// FinanzPilot Web Push v91. Keys live only in an RLS-protected Supabase table.
import { createClient } from "npm:@supabase/supabase-js@2.49.4";
import webpush from "npm:web-push@3.6.7";

const projectUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const admin = createClient(projectUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const origin = "https://marinusmeixner-dot.github.io";
async function verifyDispatch(req:Request,cfg:Config):Promise<boolean>{
 const stamp=req.headers.get("x-fp-ts")||"";
 const signature=req.headers.get("x-fp-sig")||"";
 if(!/^\\d{10}$/.test(stamp)||!/^[0-9a-f]{64}$/.test(signature))return false;
 if(Math.abs(Date.now()/1000-Number(stamp))>120)return false;
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(cfg.dispatch_secret),{name:"HMAC",hash:"SHA-256"},false,["verify"]);
 const signatureBytes=Uint8Array.from(signature.match(/.{2}/g)!.map(pair=>parseInt(pair,16)));
 return crypto.subtle.verify("HMAC",key,signatureBytes,new TextEncoder().encode(stamp));
}
const cors = { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Headers": "authorization,apikey,content-type,x-fp-ts,x-fp-sig", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Vary": "Origin" };
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), {status, headers: {...cors,"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
const errorMessage = (e: unknown) => e instanceof Error ? e.message : String(e);
type Config = { vapid_public: string; vapid_private: string; dispatch_secret: string };
async function config(): Promise<Config> {
  const {data,error} = await admin.from("fp_push_server_config").select("vapid_public,vapid_private,dispatch_secret").eq("id",1).single();
  if(error || !data) throw Error("Push-Konfiguration fehlt");
  return data as Config;
}
async function actor(req: Request) {
  const jwt = /^Bearer (.+)$/i.exec(req.headers.get("Authorization")||"")?.[1];
  if (!jwt) return null;
  const {data,error} = await admin.auth.getUser(jwt);
  return error ? null : data.user;
}
async function dispatch(cfg: Config) {
  webpush.setVapidDetails("https://marinusmeixner-dot.github.io/finanzpilot/", cfg.vapid_public, cfg.vapid_private);
  const {data: events,error} = await admin.from("fp_push_events").select("*").eq("status","pending").gt("expires_at",new Date().toISOString()).order("created_at",{ascending:true}).limit(12);
  if(error) throw error;
  const hour = Number(new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Berlin",hour:"2-digit",hourCycle:"h23"}).format(new Date()));
  let delivered = 0, failed = 0;
  for(const event of events||[]) {
    if(event.priority!=="breaking" && (hour>=22||hour<7)) continue;
    let query = admin.from("fp_push_subscriptions").select("id,user_id,endpoint,p256dh,auth,categories").eq("enabled",true).contains("categories",[event.category]).limit(200);
    if(event.target_user_id) query=query.eq("user_id",event.target_user_id);
    const {data: subscribers,error: subError}=await query;
    if(subError) throw subError;
    let pending = false;
    for(const sub of subscribers||[]) {
      const {data: previous,error: recordError}=await admin.from("fp_push_deliveries").select("status,attempts").eq("event_id",event.id).eq("subscription_id",sub.id).maybeSingle();
      if(recordError) throw recordError;
      if(["sent","gone"].includes(previous?.status)) continue;
      if((previous?.attempts||0)>=3) {failed++;continue}
      const attempts=(previous?.attempts||0)+1;
      const payload=JSON.stringify({title:event.title,body:event.body,category:event.category,tag:event.event_key,url:event.url,priority:event.priority});
      let status="sent",lastError:string|null=null;
      try {
        await webpush.sendNotification({endpoint:sub.endpoint,keys:{p256dh:sub.p256dh,auth:sub.auth}},payload,{TTL:event.priority==="breaking"?1800:21600,urgency:event.priority==="breaking"?"high":"normal"});
        delivered++;
      } catch (e) {
        const httpStatus=Number((e as {statusCode?:number})?.statusCode||0);
        if(httpStatus===404||httpStatus===410) {
          status="gone";
          await admin.from("fp_push_subscriptions").delete().eq("id",sub.id);
        } else {
          status=attempts>=3?"failed":"pending";
          pending ||= status==="pending";
          failed++;
        }
        lastError=("HTTP "+(httpStatus||"?")+" "+errorMessage(e)).slice(0,200);
      }
      const {error: deliveryError}=await admin.from("fp_push_deliveries").upsert({event_id:event.id,subscription_id:sub.id,status,attempts,last_error:lastError,delivered_at:status==="sent"?new Date().toISOString():null,updated_at:new Date().toISOString()},{onConflict:"event_id,subscription_id"});
      if(deliveryError) throw deliveryError;
    }
    if(!pending) {
      const {error: doneError}=await admin.from("fp_push_events").update({status:"sent",completed_at:new Date().toISOString()}).eq("id",event.id).eq("status","pending");
      if(doneError) throw doneError;
    }
  }
  // Expired events must not be re-sent later.
  await admin.from("fp_push_events").update({status:"failed",completed_at:new Date().toISOString()}).eq("status","pending").lt("expires_at",new Date().toISOString());
  return {events:(events||[]).length,delivered,failed};
}
Deno.serve(async req=>{
  if(req.method==="OPTIONS") return new Response(null,{status:204,headers:cors});
  if(req.headers.get("Origin") && req.headers.get("Origin")!==origin) return reply({error:"Origin nicht erlaubt"},403);
  try{
    if(req.method==="GET") {
      const cfg=await config();
      return reply({vapidPublicKey:cfg.vapid_public});
    }
    if(req.method!=="POST") return reply({error:"Methode nicht erlaubt"},405);
    const data=await req.json().catch(()=>({})) as {action?:string};
    if(data.action==="dispatch") {
      const cfg=await config();
      if(!await verifyDispatch(req,cfg)) return reply({error:"Nicht autorisiert"},401);
      return reply({ok:true,...await dispatch(cfg)});
    }
    if(data.action==="test") {
      const user=await actor(req);
      if(!user) return reply({error:"Bitte anmelden"},401);
      const {data: subscriptions,error}=await admin.from("fp_push_subscriptions").select("categories").eq("user_id",user.id).eq("enabled",true).limit(1);
      if(error) throw error;
      const category=(subscriptions?.[0]?.categories||[])[0];
      if(!category) return reply({error:"Erst Benachrichtigungen aktivieren"},409);
      const {data: last,error: lastError}=await admin.from("fp_push_events").select("created_at").eq("target_user_id",user.id).like("event_key","test:%").order("created_at",{ascending:false}).limit(1);
      if(lastError) throw lastError;
      if(last?.length && Date.now()-new Date(last[0].created_at).getTime()<60000) return reply({error:"Bitte eine Minute bis zum nächsten Test warten"},429);
      const key="test:"+user.id+":"+crypto.randomUUID();
      const {error: insertError}=await admin.from("fp_push_events").insert({event_key:key,category,title:"FinanzPilot Push funktioniert",body:"Du erhältst jetzt wichtige Meldungen direkt auf dein iPhone.",url:"./",target_user_id:user.id,priority:"breaking",expires_at:new Date(Date.now()+3600000).toISOString()});
      if(insertError) throw insertError;
      const result=await dispatch(await config());
      return reply({ok:true,...result});
    }
    return reply({error:"Unbekannte Aktion"},400);
  }catch(e){console.error("FinanzPilot Push:",errorMessage(e));return reply({error:"Push-Dienst vorübergehend nicht erreichbar"},500)}
});
