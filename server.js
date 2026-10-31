import http from 'node:http';
import { readFile, mkdir, appendFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./public/', import.meta.url));
const dataDir = process.env.DATA_DIR || fileURLToPath(new URL('./.data/', import.meta.url));
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp', '.jpg':'image/jpeg' };
const rates = new Map();
function json(res, status, body) { res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(JSON.stringify(body)); }
export function validateInquiry(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return 'Please provide your inquiry details.';
  for (const key of ['name','email','company','service','message','website']) if (input[key] !== undefined && typeof input[key] !== 'string') return 'Invalid form data.';
  if (!input.name?.trim() || input.name.length > 100) return 'Please enter your name (up to 100 characters).';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email || '') || input.email.length > 254) return 'Please enter a valid email address.';
  if ((input.company || '').length > 150) return 'Company name must be under 150 characters.';
  if (!['Import inquiry','Export inquiry','Sourcing inquiry','General inquiry'].includes(input.service)) return 'Please select an inquiry type.';
  if (!input.message?.trim() || input.message.trim().length < 20 || input.message.length > 4000) return 'Please describe your inquiry in 20–4,000 characters.';
  if (input.consent !== true) return 'Please agree to the inquiry privacy notice.';
  return null;
}
export const server = http.createServer(async (req,res) => {
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
  try {
    const url = new URL(req.url,'http://localhost');
    if (url.pathname === '/api/health' && req.method === 'GET') return json(res,200,{status:'ok'});
    if (url.pathname === '/api/inquiries') {
      if (req.method !== 'POST') return json(res,405,{error:'Method not allowed.'});
      if (req.headers.origin && req.headers.origin !== `${req.socket.encrypted ? 'https' : 'http'}://${req.headers.host}` && req.headers.origin !== process.env.SITE_ORIGIN) return json(res,403,{error:'This origin is not permitted.'});
      if (!req.headers['content-type']?.startsWith('application/json')) return json(res,415,{error:'Expected JSON.'});
      let raw=''; for await (const chunk of req) { raw+=chunk; if (Buffer.byteLength(raw)>16384) return json(res,413,{error:'Inquiry is too large.'}); }
      let input; try { input=JSON.parse(raw); } catch { return json(res,400,{error:'Invalid JSON.'}); }
      const error=validateInquiry(input); if(error) return json(res,422,{error});
      if(input.website) return json(res,422,{error:'Unable to accept this inquiry.'});
      const key=req.socket.remoteAddress; const now=Date.now();
      for (const [address,record] of rates) if (record.until<now) rates.delete(address);
      const rate=rates.get(key)||{count:0,until:now+3600000};
      if(rate.count>=10) return json(res,429,{error:'Too many inquiries. Please try again in one hour.'});
      const id=`ZEN-${randomUUID().slice(0,8).toUpperCase()}`;
      const record={id,createdAt:new Date().toISOString(),...Object.fromEntries(['name','email','company','service','message'].map(k=>[k,(input[k]||'').trim()])),consent:true};
      await mkdir(dataDir,{recursive:true,mode:0o700});
      await appendFile(resolve(dataDir,'inquiries.jsonl'),JSON.stringify(record)+'\n',{mode:0o600});
      rate.count++; rates.set(key,rate);
      return json(res,201,{id,message:'Your inquiry has been recorded. Please keep your reference number.'});
    }
    if (!['GET','HEAD'].includes(req.method)) return json(res,405,{error:'Method not allowed.'});
    const path=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
    if (!path.startsWith(root.endsWith(sep)?root:root+sep)) return json(res,403,{error:'Forbidden.'});
    const body=await readFile(path);
    res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':extname(path)==='.html'?'no-cache':'public, max-age=3600'});
    res.end(req.method==='HEAD'?undefined:body);
  } catch(error) { if(error.code==='ENOENT'||error.code==='EISDIR') return json(res,404,{error:'Page not found.'}); console.error('Request failed:',error.code||error.name); json(res,500,{error:'We could not save your inquiry. Please try again.'}); }
});
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Zena website listening on port '+(process.env.PORT||3000)));
