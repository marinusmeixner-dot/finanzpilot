#!/usr/bin/env python3
"""Best-effort täglich aktualisierte echte Schlusskurse; keine kostenpflichtigen APIs.

Benötigt die freie Python-Bibliothek yfinance auf GitHub Actions.
Wenn ein Abruf ausfällt, werden die existierenden Daten NICHT durch Beispielzahlen ersetzt.
Nicht für Trading, Echtzeitkurse oder Anlageentscheidungen geeignet.
"""
from __future__ import annotations
import json
from datetime import datetime, timezone
from pathlib import Path

OUT=Path(__file__).resolve().parents[1]/'data'/'prices.json'
SYMBOLS={
 'MSFT':('MSFT','USD'), 'NVDA':('NVDA','USD'),'AAPL':('AAPL','USD'),
 'SIEMENS':('SIE.DE','EUR'),'SPY':('SPY','USD'), 'QQQ':('QQQ','USD'), 'ACWI':('ACWI','USD'),
 'DAX':('^GDAXI','EUR'),'BTCEUR':('BTC-EUR','EUR'),'VWCE':('VWCE.DE','EUR')
}

def main():
 import yfinance as yf
 try: result=json.loads(OUT.read_text(encoding='utf-8'))
 except (FileNotFoundError,ValueError):result={'schema_version':1,'assets':{}}
 result.setdefault('assets',{})
 successful=0
 for key,(ticker,currency) in SYMBOLS.items():
  try:
   history=yf.Ticker(ticker).history(period='1y',interval='1d',auto_adjust=True,timeout=15)
   if history is None or history.empty:raise ValueError('Keine verfügbaren Handelstage')
   points=[]
   for t,row in history.iterrows():
    price=float(row['Close'])
    if price>0 and price<1e9 and price==price:
     points.append({'d':t.date().isoformat(),'c':round(price,5)})
   points=sorted({x['d']:x for x in points}.values(),key=lambda x:x['d'])
   if len(points)<15:raise ValueError('Zu wenig Kursdaten')
   result['assets'][key]={'ticker':ticker,'currency':currency,'source':'Yahoo Finance (über yfinance)','asof':points[-1]['d'],'adjusted':'Split-/dividendenbereinigt nach Anbieter','points':points[-300:]}
   successful+=1
   print(f'{key}: {len(points)} Tage, bis {points[-1]["d"]}')
  except Exception as ex:
   print(f'{key}: Abruf fehlgeschlagen ({type(ex).__name__}: {str(ex)[:120]}), letzte gesicherte Reihe bleibt erhalten')
 if successful:
  result['schema_version']=1
  result['last_refresh_at']=datetime.now(timezone.utc).isoformat()
  OUT.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
 else:print('Kein Erfolg; Datei bleibt unverändert.')

if __name__=='__main__':main()