const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const DB = path.resolve(process.env.CAMPUSHUB_DB || path.join(ROOT, 'data.json'));
const PORT = Number(process.env.PORT || 18790);
const sessions = new Map();
const loginFailures = new Map();
const secureCookie = process.env.NODE_ENV === 'production' ? '; Secure' : '';
const hash = (s, salt) => crypto.scryptSync(s, salt, 64).toString('hex');
const initial = {
  users: [{ id: 'u-admin', name: 'Shubham Kumar', email: 'admin@campushub.local', role: 'admin', salt: 'campushub-admin-v1', passwordHash: hash('CampusHub@2026', 'campushub-admin-v1') }],
  notices: [
    { id:'n1', title:'Welcome to CampusHub', category:'Campus update', body:'Your campus updates, timetable and student services are now in one place.', author:'Admin', createdAt:new Date().toISOString() },
    { id:'n2', title:'AIML Semester 3 timetable available', category:'Important', body:'The July–November 2026 timetable for Room 308 has been added.', author:'Admin', createdAt:new Date().toISOString() }
  ],
  assignments: [
    { id:'a1', title:'DS & A — Assignment 1', course:'Data Structures & Algorithms · BTCS 301-18', due:'2026-10-31', status:'Pending' },
    { id:'a2', title:'M3 — Tutorial Sheet', course:'Mathematics-III · BTAM 302-23', due:'2026-11-02', status:'Pending' },
    { id:'a3', title:'OOPs — Programming Exercise', course:'Object-Oriented Programming · BTCS 302-18', due:'2026-11-05', status:'Pending' },
    { id:'a4', title:'DE — Circuit Analysis', course:'Digital Electronics · BTES 301-18', due:'2026-11-07', status:'Pending' },
    { id:'a5', title:'FCH — Written Reflection', course:'Foundation Course in Humanities · HSMC 101-18', due:'2026-11-09', status:'Pending' },
    { id:'a6', title:'IT Workshop — Practical Task', course:'IT Workshop · BTCS 305-18', due:'2026-11-12', status:'Pending' }
  ],
  events: [
    { id:'e1', title:'Tech Fest 2026', category:'Academic', date:'2026-10-30', time:'10:00 AM', location:'Main Auditorium', description:'Student technology showcase and competitions.' },
    { id:'e2', title:'Open Mic Night', category:'Social', date:'2026-11-02', time:'6:00 PM', location:'Student Plaza', description:'Music, poetry and performances by students.' }
  ],
  lostFound: [
    { id:'l1', title:'Wireless earbuds', type:'Found', location:'Library', contact:'Student Desk', createdAt:new Date().toISOString() },
    { id:'l2', title:'Keys with blue keychain', type:'Found', location:'Cafeteria', contact:'Main Counter', createdAt:new Date().toISOString() }
  ],
  timetable: {
    Monday:[['9:00–9:55','DS & A (L)','Room 308','Sarbjot Kaur'],['9:55–10:50','M3 (L)','Room 308','Riya Gill'],['10:50–11:00','BREAK','—',''],['11:00–11:55','FCH (T)','Room 308','Sumanpal Kaur'],['11:55–12:50','AOC','Room 308','Manwant Kaur'],['12:50–1:45','LUNCH BREAK','—',''],['1:45–2:40','DE (L)','Room 308','Mandeep Kaur'],['2:40–4:20','OOPs Lab G1 (Lab V) / DS & A Lab G2 (Lab II)','Labs V / II','Paramjeet Kaur / Mansi'],['4:20–5:00','ENP (L)','R-233','Navneet Kaur']],
    Tuesday:[['9:00–9:55','OOPs (L)','Room 308','Paramjeet Kaur'],['9:55–10:50','DE (L)','Room 308','Mandeep Kaur'],['10:50–11:00','BREAK','—',''],['11:00–12:50','DE Lab G1 / DS & A Lab G2','Labs 317 / II','Mandeep Kaur / Mansi'],['12:50–1:45','LUNCH BREAK','—',''],['1:45–2:40','M3 (L)','Room 308','Riya Gill'],['2:40–4:20','IT Workshop G1 / OOPs Lab G2','Labs II / I','Mansi / Paramjeet Kaur'],['4:20–5:00','ENP (L)','R-233','Navneet Kaur']],
    Wednesday:[['9:00–9:55','DE (L)','Room 308','Mandeep Kaur'],['9:55–10:50','OOPs (L)','Room 308','Paramjeet Kaur'],['10:50–11:00','BREAK','—',''],['11:00–12:50','DS & A Lab G1 / DE Lab G2','Labs VIII / 317','Anuradha Vashishtha / Mandeep Kaur'],['12:50–1:45','LUNCH BREAK','—',''],['1:45–2:40','FCH (L)','Room 308','Sumanpal Kaur'],['2:40–3:30','M3 (T)','Room 308','Riya Gill'],['3:30–4:20','PD / Soft Skills (L)','Room 308','Anuradha Vashishtha'],['4:20–5:00','ENP (L)','R-233','Navneet Kaur']],
    Thursday:[['9:00–9:55','M3 (L)','Room 308','Riya Gill'],['9:55–10:50','FCH (L)','Room 308','Sumanpal Kaur'],['10:50–11:00','BREAK','—',''],['11:00–12:50','IT Workshop G2 (Lab II)','Lab II','Mansi'],['12:50–1:45','LUNCH BREAK','—',''],['1:45–2:40','OOPs (L)','Room 308','Paramjeet Kaur'],['2:40–3:30','LIBRARY','Library','Anuradha Vashishtha'],['3:30–4:20','DS & A (L)','Room 308','Sarbjot Kaur'],['4:20–5:00','ENP (L)','R-233','Navneet Kaur']],
    Friday:[['9:00–9:55','OOPs (L)','Room 308','Paramjeet Kaur'],['9:55–10:50','DE (L)','Room 308','Mandeep Kaur'],['10:50–11:00','BREAK','—',''],['11:00–11:55','DS & A (L)','Room 308','Sarbjot Kaur'],['11:55–12:50','M3 (L)','Room 308','Riya Gill'],['12:50–1:45','LUNCH BREAK','—',''],['1:45–2:40','AOC','Room 308','Manwant Kaur'],['2:40–4:20','DS & A Lab G1 / OOPs Lab G2','Labs VIII / I','Anuradha Vashishtha / Paramjeet Kaur'],['4:20–5:00','ENP (L)','R-233','Navneet Kaur']]
  }
};
function readDb(){ try { const saved=JSON.parse(fs.readFileSync(DB,'utf8')); return {...initial,...saved,progress:saved.progress||{}}; } catch { const fresh={...initial,progress:{}}; fs.writeFileSync(DB, JSON.stringify(fresh,null,2)); return fresh; } }
let db=readDb();
function save(){ fs.writeFileSync(DB,JSON.stringify(db,null,2)); }
if (process.env.NODE_ENV === 'production' && !process.env.CAMPUSHUB_ADMIN_PASSWORD) throw new Error('Set CAMPUSHUB_ADMIN_PASSWORD before starting CampusHub in production');
if (process.env.CAMPUSHUB_ADMIN_PASSWORD) {
  if (process.env.CAMPUSHUB_ADMIN_PASSWORD.length < 16) throw new Error('CAMPUSHUB_ADMIN_PASSWORD must be at least 16 characters');
  const admin = db.users.find(x => x.role === 'admin' && x.email === 'admin@campushub.local');
  if (admin) { admin.salt = crypto.randomBytes(16).toString('hex'); admin.passwordHash = hash(process.env.CAMPUSHUB_ADMIN_PASSWORD, admin.salt); save(); }
}
const send=(res,status,data,headers={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers});res.end(JSON.stringify(data));};
function body(req){return new Promise((resolve,reject)=>{let s='';req.on('data',c=>{s+=c;if(s.length>1e6)reject(Error('Too large'))});req.on('end',()=>{try{resolve(s?JSON.parse(s):{})}catch{reject(Error('Invalid JSON'))}})});}
function userFor(req){const sid=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('campushub_sid='))?.split('=')[1];return sessions.get(sid);}
function safeUser(u){return {id:u.id,name:u.name,email:u.email,role:u.role};}
function requireUser(req,res,admin=false){const u=userFor(req);if(!u){send(res,401,{error:'Please log in'});return null}if(admin&&u.role!=='admin'){send(res,403,{error:'Admin access required'});return null}return u;}
function id(){return crypto.randomBytes(8).toString('hex')}
async function api(req,res,url){
  if(req.method==='POST'&&url==='/api/login'){const ip=req.socket.remoteAddress||'unknown',now=Date.now(),recent=(loginFailures.get(ip)||[]).filter(t=>now-t<15*60*1000);if(recent.length>=10)return send(res,429,{error:'Too many sign-in attempts. Try again later.'});const b=await body(req);const u=db.users.find(x=>x.email.toLowerCase()===String(b.email||'').toLowerCase());if(!u||hash(String(b.password||''),u.salt)!==u.passwordHash){recent.push(now);loginFailures.set(ip,recent);return send(res,401,{error:'Email or password is incorrect'});}loginFailures.delete(ip);const sid=crypto.randomBytes(24).toString('hex');sessions.set(sid,safeUser(u));return send(res,200,{user:safeUser(u)},{'Set-Cookie':`campushub_sid=${sid}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400${secureCookie}`});}
  if(req.method==='POST'&&url==='/api/logout'){const sid=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('campushub_sid='))?.split('=')[1];sessions.delete(sid);return send(res,200,{ok:true},{'Set-Cookie':`campushub_sid=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secureCookie}`});}
  if(req.method==='GET'&&url==='/api/me'){const u=userFor(req);return send(res,200,{user:u||null});}
  if(req.method==='GET'&&url==='/api/data'){const u=requireUser(req,res);if(!u)return;const studentProgress=u.role==='admin'?db.users.filter(x=>x.role==='student').map(s=>({student:safeUser(s),assignments:db.assignments.map(a=>({id:a.id,title:a.title,due:a.due,status:db.progress[s.id]?.[a.id]||'Pending'}))})):undefined;return send(res,200,{user:u,notices:db.notices,assignments:db.assignments.map(a=>({...a,status:db.progress[u.id]?.[a.id]||'Pending'})),events:db.events,lostFound:db.lostFound,timetable:db.timetable,studentProgress});}
  if(req.method==='POST'&&url==='/api/progress'){const u=requireUser(req,res);if(!u)return;const b=await body(req);if(!db.assignments.some(x=>x.id===b.assignmentId))return send(res,404,{error:'Assignment not found'});if(b.status!=='Submitted')return send(res,400,{error:'Invalid progress status'});db.progress[u.id] ||= {};db.progress[u.id][b.assignmentId]='Submitted';save();return send(res,200,{ok:true,status:'Submitted'});}
  if(req.method==='POST'&&url==='/api/users'){const admin=requireUser(req,res,true);if(!admin)return;const b=await body(req);if(!b.name||!b.email||!b.password||String(b.password).length<8)return send(res,400,{error:'Name, email and a password of at least 8 characters are required'});if(db.users.some(x=>x.email.toLowerCase()===String(b.email).toLowerCase()))return send(res,409,{error:'That email already has an account'});const salt=crypto.randomBytes(16).toString('hex');const u={id:id(),name:String(b.name),email:String(b.email).toLowerCase(),role:'student',salt,passwordHash:hash(String(b.password),salt)};db.users.push(u);db.progress[u.id]={};save();return send(res,201,{user:safeUser(u)});}
  if(req.method==='POST'&&url.startsWith('/api/')){const u=requireUser(req,res,true);if(!u)return;const b=await body(req),parts=url.split('/'),collection=parts[2],idParam=parts[3];const maps={notices:'notices',assignments:'assignments',events:'events',lostFound:'lostFound'};if(!maps[collection])return send(res,404,{error:'Unknown collection'});const key=maps[collection],arr=db[key];if(req.method==='POST'&&idParam==='delete'){db[key]=arr.filter(x=>x.id!==b.id);save();return send(res,200,{ok:true});}const item={...b,id:idParam||id()};if(collection==='notices')Object.assign(item,{author:u.name,createdAt:new Date().toISOString()});if(collection==='lostFound')item.createdAt=new Date().toISOString();if(idParam){const i=arr.findIndex(x=>x.id===idParam);if(i>=0)arr[i]=item;else arr.push(item)}else arr.unshift(item);save();return send(res,200,{item});}
  send(res,404,{error:'Not found'});
}
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{const url=new URL(req.url,'http://localhost');if(url.pathname.startsWith('/api/')){try{return await api(req,res,url.pathname)}catch(e){return send(res,400,{error:e.message})}}let relative;try{relative=decodeURIComponent(url.pathname)}catch{res.writeHead(400);return res.end()}const file=path.resolve(ROOT,relative==='/'?'index.html':`.${relative}`);const rel=path.relative(ROOT,file);if(rel.startsWith('..')||path.isAbsolute(rel)||!['index.html','app.js','style.css'].includes(rel)){res.writeHead(404);return res.end('Not found')}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end('Not found')}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(data)});}).listen(PORT,'0.0.0.0',()=>console.log(`CampusHub running at http://localhost:${PORT}`));
