export const config={matcher:'/:path*'};
export default function middleware(request){
  const url=new URL(request.url);
  const path=url.pathname;
  const page=path.endsWith('/')||path.endsWith('.html');
  const headers={'cache-control':'private, no-store','vary':'Cookie'};
  const explicit=url.searchParams.get('lang');
  const cookie=request.headers.get('cookie')?.match(/(?:^|;\s*)site_language=(tr|en)(?:;|$)/)?.[1];
  if(page&&(explicit==='tr'||explicit==='en')){
   url.searchParams.delete('lang');
   let base=path.replace(/^\/(?:en|tr)(?=\/|$)/,'')||'/';
   url.pathname=explicit==='en'?'/en'+base:base;
   return new Response(null,{status:302,headers:{...headers,location:url.toString(),'set-cookie':`site_language=${explicit}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`}});
  }
  if(path==='/tr'||path.startsWith('/tr/')){
   url.pathname=path.replace(/^\/tr/,'')||'/';url.searchParams.set('lang','tr');
   return new Response(null,{status:302,headers:{...headers,location:url.toString()}});
  }
  if(path==='/en'){
   url.pathname='/en/';return new Response(null,{status:302,headers:{...headers,location:url.toString()}});
  }
  const country=request.headers.get('x-vercel-ip-country');
  const foreign=country&&country!=='TR'&&country!=='XX'&&country!=='T1';
  const bot=/bot|crawler|spider/i.test(request.headers.get('user-agent')||'');
  if(page&&!path.startsWith('/en/')&&!bot&&(cookie==='en'||(!cookie&&foreign))){
   url.pathname='/en'+path;return new Response(null,{status:302,headers:{...headers,location:url.toString()}});
  }
  return;
}
