-- FinancePilot v40: single 1,000 EUR virtual cash budget, up to 6 decimal share places.
-- One FX-quoted EUR wallet, not free 1,000 USD + 1,000 EUR accounts.
create table if not exists public.fp_paper_fx_rates (
 currency text primary key check(currency ~ '^[A-Z]{3}$'),
 eur_per_unit numeric(20,10) not null check(eur_per_unit>0),
 quote_date date not null,
 source text not null,
 updated_at timestamptz not null default now()
);
alter table public.fp_paper_fx_rates enable row level security;
revoke all on public.fp_paper_fx_rates from public,anon,authenticated;
grant select on public.fp_paper_fx_rates to authenticated;
drop policy if exists fp_fx_read on public.fp_paper_fx_rates;
create policy fp_fx_read on public.fp_paper_fx_rates for select to authenticated using (true);
insert into public.fp_paper_fx_rates(currency,eur_per_unit,quote_date,source)
values ('EUR',1,'2026-10-30','Fixed EUR base'),('USD',1/1.1172,'2026-10-30','ECB EUR/USD reference 30 Oct 2026')
on conflict(currency) do update set eur_per_unit=excluded.eur_per_unit,quote_date=excluded.quote_date,source=excluded.source,updated_at=now()
where public.fp_paper_fx_rates.quote_date <= excluded.quote_date;

alter table public.fp_paper_wallets drop constraint if exists fp_paper_wallets_starting_balance_check;
alter table public.fp_paper_wallets alter column starting_balance set default 1000;

alter table public.fp_paper_trades drop constraint if exists fp_paper_trades_quantity_check;
alter table public.fp_paper_trades alter column quantity type numeric(20,6) using quantity::numeric(20,6);
alter table public.fp_paper_trades add constraint fp_paper_trades_quantity_check check(quantity>=0.000001 and quantity<=10000);
alter table public.fp_paper_trades add column if not exists fx_eur_per_unit numeric(20,10);
alter table public.fp_paper_trades add column if not exists eur_total numeric(20,2);
update public.fp_paper_trades t
set fx_eur_per_unit=coalesce(f.eur_per_unit,1),
    eur_total=round(t.total*coalesce(f.eur_per_unit,1),2)
from public.fp_paper_fx_rates f where t.currency=f.currency and t.eur_total is null;

-- Only for first cutover, preserve all existing trades and prior cash movements.
-- 2026-10-30 ECB reference is the documented opening FX rate for legacy USD positions;
-- their past exchange-rate history is not claimed to be exact.
create table if not exists private.fp_paper_migration_audit (
 user_id uuid not null,
 currency text not null,
 old_balance numeric(20,2) not null,
 old_starting_balance numeric(20,2) not null,
 fx_rate numeric(20,10) not null,
 migrated_at timestamptz not null default now(),
 primary key(user_id,currency)
);
alter table private.fp_paper_migration_audit enable row level security;
revoke all on private.fp_paper_migration_audit from public,anon,authenticated;
insert into private.fp_paper_migration_audit(user_id,currency,old_balance,old_starting_balance,fx_rate)
select w.user_id,w.currency,w.balance,w.starting_balance,coalesce(f.eur_per_unit,1)
from public.fp_paper_wallets w left join public.fp_paper_fx_rates f on f.currency=w.currency
where w.starting_balance=50000 on conflict do nothing;

-- Calculate how much of the old 50,000 nominal wallets was spent (or earned);
-- carry only this signed economic movement into the new 1,000 EUR budget.
with movements as (
 select a.user_id,round(sum((a.old_balance-a.old_starting_balance)*a.fx_rate),2) as delta
 from private.fp_paper_migration_audit a group by a.user_id
)
update public.fp_paper_wallets w
set balance=greatest(0,1000+movements.delta), starting_balance=1000
from movements where w.user_id=movements.user_id and w.currency='EUR' and w.starting_balance=50000;
delete from public.fp_paper_wallets where currency<>'EUR' and starting_balance=50000;
alter table public.fp_paper_wallets add constraint fp_paper_wallets_starting_balance_check check(starting_balance=1000);

create or replace function public.fp_paper_execute(
 p_symbol text,p_side text,p_quantity numeric default null,p_amount_eur numeric default null
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare
 v_user uuid:=(select auth.uid());
 v_quote public.fp_paper_quotes%rowtype;
 v_fx numeric(20,10);
 v_fx_date date;
 v_price_eur numeric(26,12);
 v_balance numeric(20,2);
 v_total numeric(20,2);
 v_eur_total numeric(20,2);
 v_q numeric(20,6);
 v_holdings numeric(20,6);
 v_symbol text:=upper(btrim(coalesce(p_symbol,'')));
 v_side text:=upper(btrim(coalesce(p_side,'')));
begin
 if v_user is null then raise exception 'Login erforderlich.' using errcode='28000';end if;
 if v_symbol !~ '^[A-Z0-9][A-Z0-9.\-]{0,23}$' or v_side not in ('BUY','SELL')
 then raise exception 'Ungültiger Handelsauftrag.' using errcode='22023';end if;
 if (p_quantity is null)=(p_amount_eur is null)
 then raise exception 'Wähle entweder eine Stückzahl oder einen Eurobetrag.' using errcode='22023';end if;
 select * into v_quote from public.fp_paper_quotes where symbol=v_symbol for share;
 if not found then raise exception 'Aktie ohne verifizierten Referenzkurs.' using errcode='22023';end if;
 if v_quote.quote_date>(now() at time zone 'Europe/Berlin')::date
 or v_quote.quote_date<(now() at time zone 'Europe/Berlin')::date-7
 then raise exception 'Kurs veraltet – zuerst Kurs aktualisieren.' using errcode='22023';end if;
 if v_quote.currency='EUR' then v_fx:=1;v_fx_date=v_quote.quote_date;
 else
  select f.eur_per_unit,f.quote_date into v_fx,v_fx_date
  from public.fp_paper_fx_rates f where f.currency=v_quote.currency;
  if v_fx is null or v_fx_date<(now() at time zone 'Europe/Berlin')::date-7
  or v_fx_date>(now() at time zone 'Europe/Berlin')::date
  then raise exception 'EZB-Umrechnungskurs nicht aktuell; Kursdaten aktualisieren.' using errcode='22023';end if;
 end if;
 v_price_eur:=v_quote.price*v_fx;
 if p_amount_eur is not null then
  if p_amount_eur<0.01 or p_amount_eur>100000 then
    raise exception 'Eurobetrag zwischen 0,01 und 100.000 erforderlich.' using errcode='22023';end if;
  v_q:=trunc(p_amount_eur/v_price_eur,6);
 else
  if p_quantity<0.000001 or p_quantity>10000 or p_quantity<>trunc(p_quantity,6) then
   raise exception 'Maximal sechs Dezimalstellen je Anteil.' using errcode='22023';end if;
  v_q:=p_quantity;
 end if;
 if v_q<0.000001 or v_q>10000 then raise exception 'Auftragsbetrag für Stückbruchteile zu klein oder zu groß.' using errcode='22023';end if;
 v_total:=round(v_quote.price*v_q,2);
 v_eur_total:=round(v_quote.price*v_q*v_fx,2);
 if v_eur_total<0.01 then raise exception 'Mindestauftragswert 0,01 €.' using errcode='22023';end if;
 insert into public.fp_paper_wallets(user_id,currency,balance,starting_balance)
 values(v_user,'EUR',1000,1000) on conflict(user_id,currency) do nothing;
 select balance into v_balance from public.fp_paper_wallets where user_id=v_user and currency='EUR' for update;
 if v_side='BUY' and v_balance<v_eur_total then raise exception 'Nicht genügend Euro-Spielgeld.' using errcode='22023';end if;
 if v_side='SELL' then
  select coalesce(sum(case when side='BUY' then quantity else -quantity end),0)
  into v_holdings from public.fp_paper_trades where user_id=v_user and symbol=v_symbol;
  if v_holdings<v_q then raise exception 'Nicht genügend Anteile im Depot.' using errcode='22023';end if;
 end if;
 update public.fp_paper_wallets set balance=balance+(case when v_side='SELL' then v_eur_total else -v_eur_total end)
 where user_id=v_user and currency='EUR' returning balance into v_balance;
 insert into public.fp_paper_trades(user_id,symbol,currency,side,quantity,price,total,quote_date,source,fx_eur_per_unit,eur_total)
 values(v_user,v_symbol,v_quote.currency,v_side,v_q,v_quote.price,v_total,v_quote.quote_date,v_quote.source,v_fx,v_eur_total);
 return jsonb_build_object('symbol',v_symbol,'side',v_side,'quantity',v_q,'price',v_quote.price,
 'quote_date',v_quote.quote_date,'currency',v_quote.currency,'total',v_total,'total_eur',v_eur_total,
 'fx_eur_per_unit',v_fx,'cash_remaining_eur',v_balance);
end $$;
drop function if exists public.fp_paper_execute(text,text,integer);
revoke all on function public.fp_paper_execute(text,text,numeric,numeric) from public,anon,authenticated;
grant execute on function public.fp_paper_execute(text,text,numeric,numeric) to authenticated;
comment on function public.fp_paper_execute(text,text,numeric,numeric) is
'Authenticated EUR-only virtual wallet trades, 6-decimal fractions, ECB FX; cash and holdings checked atomically. No real trade.';
