import fs from 'node:fs';
import path from 'node:path';
fs.rmSync('output',{recursive:true,force:true});
fs.cpSync('public','output',{recursive:true});
const raw=process.env.SITE_URL||process.env.VERCEL_PROJECT_PRODUCTION_URL||process.env.VERCEL_URL;
const origin=raw?(raw.startsWith('https://')?raw:'https://'+raw):null;
function update(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())update(p);else if(entry.name.endsWith('.html')&&origin){fs.writeFileSync(p,fs.readFileSync(p,'utf8').replaceAll('https://nesibe-kiris-can.nesibe.chatgpt.site',origin));}}}
update('output');
console.log('Built Turkish and English pages with country-aware middleware.');
