-- FinancePilot global equity discovery: expand symbols/currencies, private watchlist, trusted quote registration.
alter table public.fp_paper_quotes drop constraint if exists fp_paper_quotes_symbol_check;
alter table public.fp_paper_quotes add constraint fp_paper_quotes_symbol_check check (symbol ~ '^[A-Z0-9][A-Z0-9.\-]{0,23}$');
alter table public.fp_paper_quotes drop constraint if exists fp_paper_quotes_currency_check;
alter table public.fp_paper_quotes add constraint fp_paper_quotes_currency_check check (currency ~ '^[A-Z]{3}$');
alter table public.fp_paper_wallets drop constraint if exists fp_paper_wallets_currency_check;
alter table public.fp_paper_wallets add constraint fp_paper_wallets_currency_check check (currency ~ '^[A-Z]{3}$');
alter table public.fp_paper_trades drop constraint if exists fp_paper_trades_symbol_check;
alter table public.fp_paper_trades drop constraint if exists fp_paper_trades_currency_check;
alter table public.fp_paper_trades add constraint fp_paper_trades_currency_check check (currency ~ '^[A-Z]{3}$');

create table if not exists public.fp_paper_watchlist(
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 symbol text not null references public.fp_paper_quotes(symbol) on delete restrict,
 created_at timestamptz not null default now(),
 primary key(user_id,symbol)
);
alter table public.fp_paper_watchlist enable row level security;
revoke all on public.fp_paper_watchlist from public,anon,authenticated;
grant select,insert(user_id,symbol),delete on public.fp_paper_watchlist to authenticated;
drop policy if exists fp_paper_watch_owner_select on public.fp_paper_watchlist;
create policy fp_paper_watch_owner_select on public.fp_paper_watchlist for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists fp_paper_watch_owner_insert on public.fp_paper_watchlist;
create policy fp_paper_watch_owner_insert on public.fp_paper_watchlist for insert to authenticated with check(user_id=(select auth.uid()));
drop policy if exists fp_paper_watch_owner_delete on public.fp_paper_watchlist;
create policy fp_paper_watch_owner_delete on public.fp_paper_watchlist for delete to authenticated using(user_id=(select auth.uid()));

create or replace function public.fp_paper_register_verified_quote(
 p_symbol text,p_name text,p_currency text,p_price numeric,p_date date,p_source text,p_adjusted boolean default false
) returns void language plpgsql security definer set search_path=''
as $$
begin
 if auth.role() <> 'service_role' then raise exception 'Nur geschützter Kursdienst'; end if;
 if p_symbol !~ '^[A-Z0-9][A-Z0-9.\-]{0,23}$' or p_currency !~ '^[A-Z]{3}$' or
    length(coalesce(p_name,'')) not between 2 and 180 or p_price<=0 or p_price>100000000 or
    p_date is null or p_date>(now() at time zone 'UTC')::date+1 or p_date<(now() at time zone 'UTC')::date-14
 then raise exception 'Ungültiger Referenzkurs'; end if;
 insert into public.fp_paper_quotes(symbol,asset_name,currency,price,quote_date,source,adjusted)
 values(p_symbol,left(p_name,180),p_currency,p_price,p_date,left(p_source,180),coalesce(p_adjusted,false))
 on conflict(symbol) do update set asset_name=excluded.asset_name,currency=excluded.currency,
   price=excluded.price,quote_date=excluded.quote_date,source=excluded.source,adjusted=excluded.adjusted,updated_at=now()
 where public.fp_paper_quotes.quote_date<=excluded.quote_date;
end $$;
revoke all on function public.fp_paper_register_verified_quote(text,text,text,numeric,date,text,boolean) from public,anon,authenticated;
grant execute on function public.fp_paper_register_verified_quote(text,text,text,numeric,date,text,boolean) to service_role;

create or replace function public.fp_paper_execute(p_symbol text,p_side text,p_quantity integer)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
 v_user uuid:=(select auth.uid());
 v_quote public.fp_paper_quotes%rowtype;
 v_balance numeric(20,2);
 v_total numeric(20,2);
 v_holdings bigint;
 v_symbol text:=upper(btrim(coalesce(p_symbol,'')));
 v_side text:=upper(btrim(coalesce(p_side,'')));
begin
 if v_user is null then raise exception 'Login erforderlich.' using errcode='28000';end if;
 if v_symbol !~ '^[A-Z0-9][A-Z0-9.\-]{0,23}$' or v_side not in ('BUY','SELL') or
   p_quantity is null or p_quantity<1 or p_quantity>10000
 then raise exception 'Ungültiger Handelsauftrag.' using errcode='22023';end if;
 select * into v_quote from public.fp_paper_quotes where symbol=v_symbol for share;
 if not found then raise exception 'Wertpapier hat keinen geprüften Referenzkurs.' using errcode='22023';end if;
 if v_quote.quote_date>(now() at time zone 'Europe/Berlin')::date or
    v_quote.quote_date<(now() at time zone 'Europe/Berlin')::date-7
 then raise exception 'Referenzkurs veraltet; bitte neue Kursprüfung durchführen.' using errcode='22023';end if;
 v_total:=round(v_quote.price*p_quantity,2);
 if v_total<=0 then raise exception 'Ungültiger Gesamtwert.' using errcode='22023';end if;
 insert into public.fp_paper_wallets(user_id,currency,balance,starting_balance)
 values(v_user,v_quote.currency,50000,50000) on conflict(user_id,currency) do nothing;
 select balance into v_balance from public.fp_paper_wallets where user_id=v_user and currency=v_quote.currency for update;
 if v_side='BUY' and v_balance<v_total then raise exception 'Nicht genug virtuelles Geld.' using errcode='22023';end if;
 if v_side='SELL' then
   select coalesce(sum(case when side='BUY' then quantity else -quantity end),0) into v_holdings
   from public.fp_paper_trades where user_id=v_user and symbol=v_symbol;
   if v_holdings<p_quantity then raise exception 'Nicht genügend Aktien im Depot.' using errcode='22023';end if;
 end if;
 update public.fp_paper_wallets set balance=balance+(case when v_side='SELL' then v_total else -v_total end)
 where user_id=v_user and currency=v_quote.currency returning balance into v_balance;
 insert into public.fp_paper_trades(user_id,symbol,currency,side,quantity,price,total,quote_date,source)
 values(v_user,v_symbol,v_quote.currency,v_side,p_quantity,v_quote.price,v_total,v_quote.quote_date,v_quote.source);
 return jsonb_build_object('symbol',v_symbol,'side',v_side,'quantity',p_quantity,'price',v_quote.price,'quote_date',v_quote.quote_date,'currency',v_quote.currency,'total',v_total,'cash_remaining',v_balance);
end $$;
revoke all on function public.fp_paper_execute(text,text,integer) from public,anon,authenticated;
grant execute on function public.fp_paper_execute(text,text,integer) to authenticated;
