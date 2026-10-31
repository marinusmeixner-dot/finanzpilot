// FinancePilot global equity/ETF lookup and verified historical-close registration.
// Authenticated requests only; never accept price, type or currency from a client.
const APP_ORIGIN="https://marinusmeixner-dot.github.io";
const DB=Deno.env.get("SUPABASE_URL")||"";
const ANON=Deno.env.get("SUPABASE_ANON_KEY")||"";
const ADMIN=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const stockSymbol=/^[A-Z0-9][A-Z0-9.\-]{0,23}$/;
const supported=new Set(["EQUITY","ETF"]);
const allowedCurrency=/^[A-Z]{3}$/;
const cors={"Access-Control-Allow-Origin":APP_ORIGIN,"Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
const send=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:cors});
async function yahoo(path:string){
 let lastError="";
 for(const host of ["query1.finance.yahoo.com","query2.finance.yahoo.com"]){
  try{
   const ctrl=new AbortController();const tm=setTimeout(()=>ctrl.abort(),8500);
   let res:Response;
   try{res=await fetch("https://"+host+path,{headers:{"Accept":"application/json","User-Agent":"FinanzPilot-Research/1.0 (educational portfolio)","Cache-Control":"no-cache"},signal:ctrl.signal})}
   finally{clearTimeout(tm)}
   if(res.ok)return await res.json();
   lastError="Kursanbieter meldet HTTP "+res.status;
   if(res.status===429)break;
  }catch(e){lastError=String(e)}
 }
 throw Error("Kostenloser Börsendatenanbieter derzeit nicht erreichbar. "+lastError);
}
function valid(s:string){return stockSymbol.test(s)}
async function authenticate(req:Request){
 const authorization=req.headers.get("Authorization")||"";
 if(!/^Bearer [\w.-]+$/.test(authorization)||!DB||!ANON||!ADMIN)throw Error("Anmeldung oder Konfiguration fehlt");
 const response=await fetch(DB+"/auth/v1/user",{headers:{"Authorization":authorization,"apikey":ANON}});
 if(!response.ok)throw Error("Anmeldung abgelaufen, bitte neu anmelden");
 const user=await response.json();if(!user?.id)throw Error("Benutzer unbekannt");
 return user.id as string;
}
async function search(q:string){
 if(q.length<2||q.length>64)throw Error("Mindestens zwei Zeichen eingeben");
 const raw=await yahoo("/v1/finance/search?q="+encodeURIComponent(q)+"&quotesCount=15&newsCount=0");
 const list=(Array.isArray(raw.quotes)?raw.quotes:[])
 .filter((x:any)=>supported.has(String(x.quoteType||"").toUpperCase())&&valid(String(x.symbol||"").toUpperCase()))
 .map((x:any)=>({symbol:String(x.symbol).toUpperCase(),name:String(x.shortname||x.longname||x.symbol).slice(0,150),exchange:String(x.exchDisp||x.exchange||"").slice(0,70),type:String(x.quoteType).toUpperCase()})).slice(0,12);
 return {results:list,provider:"Yahoo Finance (inoffizielle Suche)",limited:true};
}
function barDate(unix:number,timezone:string){
 const zone=/^[A-Za-z_]+(?:\/[A-Za-z_+-]+){0,3}$/.test(timezone)?timezone:"UTC";
 return new Intl.DateTimeFormat("en-CA",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(unix*1000));
}
async function register(querySymbol:string){
 const symbol=querySymbol.trim().toUpperCase();
 if(!valid(symbol))throw Error("Gültiges Aktiensymbol erforderlich, z. B. AAPL, BRK-B oder SAP.DE");
 const raw=await yahoo("/v8/finance/chart/"+encodeURIComponent(symbol)+"?range=10d&interval=1d");
 const result=raw?.chart?.result?.[0];
 if(!result)throw Error("Keine Kursdaten für dieses Börsensymbol");
 const meta=result.meta||{};
 const kind=String(meta.instrumentType||meta.quoteType||"").toUpperCase();
 if(!supported.has(kind))throw Error("Nur börsennotierte Aktien und ETFs werden unterstützt; Werttyp: "+(kind||"unbekannt"));
 const actual=String(meta.symbol||symbol).toUpperCase();
 if(!valid(actual))throw Error("Dieses Börsensymbol wird noch nicht unterstützt");
 const rawCurrency=String(meta.currency||"");
 const subunit=rawCurrency==="GBp"||rawCurrency==="GBX"?0.01:rawCurrency==="ZAc"?0.01:1;
 const currency=subunit===0.01?(rawCurrency.startsWith("GB")?"GBP":"ZAR"):rawCurrency.toUpperCase();
 if(!allowedCurrency.test(currency))throw Error("Handelswährung nicht zuverlässig identifiziert");
 const ts=result.timestamp||[],closes=result.indicators?.quote?.[0]?.close||[];
 let i=closes.length-1;
 while(i>=0&&(!Number.isFinite(Number(closes[i]))||Number(closes[i])<=0))i--;
 if(i<0||!Number.isFinite(Number(ts[i])))throw Error("Kein vollständiger historischer Schlusskurs verfügbar");
 const price=Math.round(Number(closes[i])*subunit*10000)/10000;
 const date=barDate(ts[i],String(meta.exchangeTimezoneName||"UTC"));
 const age=(Date.now()-Date.parse(date+"T12:00:00Z"))/86400000;
 if(age>7.5||age< -1.5)throw Error("Letzter verifizierter Schlusskurs ist älter als sieben Tage");
 const name=String(meta.longName||meta.shortName||actual).slice(0,160);
 const source="Yahoo Finance – inoffizieller historischer Schlusskurs (unbereinigt)";
 const post=await fetch(DB+"/rest/v1/rpc/fp_paper_register_verified_quote",{
  method:"POST",headers:{"Authorization":"Bearer "+ADMIN,"apikey":ADMIN,"Content-Type":"application/json"},
  body:JSON.stringify({p_symbol:actual,p_name:name,p_currency:currency,p_price:price,p_date:date,p_source:source,p_adjusted:false})
 });
 if(!post.ok)throw Error("Geprüfter Kurs konnte nicht gespeichert werden ("+post.status+")");
 return {quote:{symbol:actual,asset_name:name,currency,price,quote_date:date,source,adjusted:false},type:kind,provider:"Yahoo Finance (inoffiziell, kein Echtzeit-Handel)",notice:"Referenzschlusskurs – keine live ausführbare Börsenorder."};
}
async function history(symbol:string){
 const key=String(symbol).trim().toUpperCase();
 if(!valid(key))throw Error("Ungültiges Börsensymbol");
 const raw=await yahoo("/v8/finance/chart/"+encodeURIComponent(key)+"?range=6mo&interval=1d");
 const r=raw?.chart?.result?.[0];
 if(!r)throw Error("Keine historischen Kurse für dieses Wertpapier verfügbar");
 const closes=r.indicators?.quote?.[0]?.close||[],timestamps=r.timestamp||[];
 const meta=r.meta||{},currency=String(meta.currency||"").toUpperCase();
 const points=timestamps.map((t:number,i:number)=>({date:barDate(t,String(meta.exchangeTimezoneName||"UTC")),price:Number(closes[i])})).filter((p:{date:string,price:number})=>p.price>0&&Number.isFinite(p.price)).slice(-130);
 if(points.length<2)throw Error("Für dieses Wertpapier liegen noch nicht genug historische Kursdaten vor");
 return {symbol:key,currency,points,source:"Yahoo Finance – historische Tagesschlusskurse, unbereinigt",last_date:points.at(-1)?.date};
}
async function news(symbol:string){
 const key=String(symbol).trim().toUpperCase();if(!valid(key))throw Error("Ungültiges Börsensymbol");
 const q=await yahoo("/v1/finance/search?q="+encodeURIComponent(key)+"&newsCount=12&quotesCount=0");
 const list=(Array.isArray(q.news)?q.news:[]).slice(0,10).map((a:any)=>({
  title:String(a.title||"").slice(0,250),
  publisher:String(a.publisher||"").slice(0,120),
  published:Number(a.providerPublishTime||0),
  url:String(a.link||"")
 })).filter((x:{title:string,published:number,url:string})=>x.title.length>5&&x.published>0&&/^https:\/\//.test(x.url));
 return {symbol:key,news:list,source:"Yahoo Finance News – Drittanbieter-Schlagzeilen; Quelle vor Entscheidungen öffnen",asof:new Date().toISOString()};
}
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{headers:cors});
 if(req.headers.get("origin")&&req.headers.get("origin")!==APP_ORIGIN)return send({error:"Origin nicht zugelassen"},403);
 if(req.method!=="POST")return send({error:"Nur POST unterstützt"},405);
 try{
  await authenticate(req);
  const body=await req.json();
  if(!body||typeof body!=="object")throw Error("Ungültige Anfrage");
  const action=String(body.action||"");
  if(action==="search")return send(await search(String(body.query||"").trim().slice(0,64)));
  if(action==="register")return send(await register(String(body.symbol||"")));
  if(action==="history")return send(await history(String(body.symbol||"")));
  if(action==="news")return send(await news(String(body.symbol||"")));
  return send({error:"Unbekannte Aktion"},400);
 }catch(e){const message=String(e instanceof Error?e.message:e).slice(0,250);
  return send({error:message},/Anmeldung|abgelaufen/.test(message)?401:422);}
});
