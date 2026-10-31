-- FinancePilot private, virtual US/EU paper trading. Historical adjusted close, NOT live orders.
create table if not exists public.fp_paper_quotes(
 symbol text primary key check(symbol ~ '^[A-Z0-9]{2,12}$'),
 asset_name text not null,
 currency text not null check(currency in ('USD','EUR')),
 price numeric(20,4) not null check(price > 0),
 quote_date date not null,
 source text not null,
 adjusted boolean not null default true,
 updated_at timestamptz not null default now()
);
create table if not exists public.fp_paper_wallets(
 user_id uuid not null references auth.users(id) on delete cascade,
 currency text not null check(currency in ('USD','EUR')),
 balance numeric(20,2) not null check(balance >= 0),
 starting_balance numeric(20,2) not null default 50000 check(starting_balance=50000),
 created_at timestamptz not null default now(),
 primary key(user_id,currency)
);
create table if not exists public.fp_paper_trades(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 symbol text not null references public.fp_paper_quotes(symbol),
 currency text not null check(currency in ('USD','EUR')),
 side text not null check(side in ('BUY','SELL')),
 quantity integer not null check(quantity between 1 and 10000),
 price numeric(20,4) not null check(price > 0),
 total numeric(20,2) not null check(total > 0),
 quote_date date not null,
 source text not null,
 traded_at timestamptz not null default now()
);
create index if not exists fp_paper_trades_owner_date on public.fp_paper_trades(user_id,traded_at desc);
create index if not exists fp_paper_trades_owner_symbol on public.fp_paper_trades(user_id,symbol);
alter table public.fp_paper_quotes enable row level security;
alter table public.fp_paper_wallets enable row level security;
alter table public.fp_paper_trades enable row level security;
revoke all on public.fp_paper_quotes,public.fp_paper_wallets,public.fp_paper_trades from PUBLIC,anon,authenticated;
grant select on public.fp_paper_quotes,public.fp_paper_wallets,public.fp_paper_trades to authenticated;
drop policy if exists fp_quotes_read on public.fp_paper_quotes;
create policy fp_quotes_read on public.fp_paper_quotes for select to authenticated using (true);
drop policy if exists fp_wallet_owner_read on public.fp_paper_wallets;
create policy fp_wallet_owner_read on public.fp_paper_wallets for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists fp_trade_owner_read on public.fp_paper_trades;
create policy fp_trade_owner_read on public.fp_paper_trades for select to authenticated using (user_id=(select auth.uid()));
-- Only the per-request RPC can update wallet balances, and only after checking prices and holdings.
create or replace function public.fp_paper_execute(p_symbol text,p_side text,p_quantity integer)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
 v_user uuid := (select auth.uid());
 v_quote public.fp_paper_quotes%rowtype;
 v_balance numeric(20,2);
 v_total numeric(20,2);
 v_holdings bigint;
 v_symbol text := upper(btrim(coalesce(p_symbol,'')));
 v_side text := upper(btrim(coalesce(p_side,'')));
begin
 if v_user is null then raise exception 'Login erforderlich.' using errcode='28000'; end if;
 if v_symbol !~ '^[A-Z0-9]{2,12}$' or v_side not in ('BUY','SELL') or p_quantity is null or p_quantity<1 or p_quantity>10000
 then raise exception 'Ungültiger Handelsauftrag.' using errcode='22023'; end if;
 select * into v_quote from public.fp_paper_quotes where symbol=v_symbol for share;
 if not found then raise exception 'Für dieses Wertpapier liegt kein freigegebener Kurs vor.' using errcode='22023';end if;
 if v_quote.quote_date>(now() at time zone 'Europe/Berlin')::date or
    v_quote.quote_date<(now() at time zone 'Europe/Berlin')::date-7
 then raise exception 'Kurs veraltet: Handel pausiert bis zur nächsten Kursaktualisierung.' using errcode='22023';end if;
 v_total:=round(v_quote.price*p_quantity,2);
 if v_total<=0 then raise exception 'Ungültiger Auftragswert.' using errcode='22023';end if;
 insert into public.fp_paper_wallets(user_id,currency,balance,starting_balance)
 values(v_user,v_quote.currency,50000,50000) on conflict(user_id,currency) do nothing;
 select balance into v_balance from public.fp_paper_wallets
 where user_id=v_user and currency=v_quote.currency for update;
 if v_balance is null then raise exception 'Virtuelles Wallet nicht verfügbar.';end if;
 if v_side='BUY' and v_balance<v_total then raise exception 'Nicht genügend virtuelles Guthaben.' using errcode='22023';end if;
 if v_side='SELL' then
   select coalesce(sum(case when side='BUY' then quantity else -quantity end),0)
   into v_holdings from public.fp_paper_trades where user_id=v_user and symbol=v_symbol;
   if v_holdings<p_quantity then raise exception 'Nicht genügend Aktien im virtuellen Depot.' using errcode='22023';end if;
 end if;
 update public.fp_paper_wallets
 set balance=balance+(case when v_side='SELL' then v_total else -v_total end)
 where user_id=v_user and currency=v_quote.currency returning balance into v_balance;
 insert into public.fp_paper_trades(user_id,symbol,currency,side,quantity,price,total,quote_date,source)
 values(v_user,v_symbol,v_quote.currency,v_side,p_quantity,v_quote.price,v_total,v_quote.quote_date,v_quote.source);
 return jsonb_build_object('symbol',v_symbol,'side',v_side,'quantity',p_quantity,'price',v_quote.price,'quote_date',v_quote.quote_date,'currency',v_quote.currency,'total',v_total,'cash_remaining',v_balance);
end $$;
revoke all on function public.fp_paper_execute(text,text,integer) from public,anon,authenticated;
grant execute on function public.fp_paper_execute(text,text,integer) to authenticated;
-- These are deliberately historical adjusted close quotes, NOT live exchange quotes.
insert into public.fp_paper_quotes(symbol,asset_name,currency,price,quote_date,source,adjusted)
values
('MSFT','Microsoft','USD',521.9100,'2026-10-30','Yahoo Finance/yfinance – adjusted historical close',true),
('NVDA','NVIDIA','USD',204.6400,'2026-10-30','Yahoo Finance/yfinance – adjusted historical close',true),
('AAPL','Apple','USD',344.6300,'2026-10-30','Yahoo Finance/yfinance – adjusted historical close',true),
('AMZN','Amazon','USD',240.3500,'2026-10-30','Yahoo Finance/yfinance – adjusted historical close',true),
('META','Meta Platforms','USD',614.9900,'2026-10-30','Yahoo Finance/yfinance – adjusted historical close',true),
('SPY','SPDR S&P 500 ETF','USD',755.7200,'2026-10-30','Yahoo Finance/yfinance – adjusted historical close',true),
('QQQ','Invesco QQQ ETF','USD',690.4900,'2026-10-30','Yahoo Finance/yfinance – adjusted historical close',true),
('ACWI','iShares MSCI ACWI ETF','USD',156.0400,'2026-10-30','Yahoo Finance/yfinance – adjusted historical close',true),
('CGNX','Cognex','USD',56.1500,'2026-10-30','Yahoo Finance/yfinance – adjusted historical close',true),
('SIEMENS','Siemens','EUR',265.6500,'2026-10-30','Yahoo Finance/yfinance – adjusted historical close',true),
('VWCE','Vanguard FTSE All-World UCITS ETF','EUR',168.9000,'2026-10-30','Yahoo Finance/yfinance – adjusted historical close',true),
('KION','KION Group','EUR',33.2700,'2026-10-30','Yahoo Finance/yfinance – adjusted historical close',true),
('AIXTRON','AIXTRON','EUR',32.3400,'2026-10-30','Yahoo Finance/yfinance – adjusted historical close',true)
on conflict (symbol) do update set asset_name=excluded.asset_name,currency=excluded.currency,
price=excluded.price,quote_date=excluded.quote_date,source=excluded.source,adjusted=excluded.adjusted,updated_at=now()
where public.fp_paper_quotes.quote_date<=excluded.quote_date;
comment on table public.fp_paper_quotes is 'Historical split/dividend-adjusted reference closes updated by FinanzPilot research editor. Paper fills are educational estimates.';
comment on table public.fp_paper_trades is 'Virtual stock trades. Server-side atomic fills at a dated, capped-freshness adjusted reference close. No real money or broker order.';
