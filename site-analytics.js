(()=>{
  'use strict';
  const MEASUREMENT_ID='G-5ZQHHYEH86';
  const HOTMART_HOST='pay.hotmart.com';
  const PRODUCT_PATHS=new Map([
    ['/academia-da-matematica','Academia da Matemática'],
    ['/80-simulados','80 Simulados'],
    ['/combo-matematica','Combo Matemática'],
    ['/combo-estrategia','Combo Estratégia'],
    ['/interpretacao-matematica','Interpretação Matemática'],
    ['/manual-do-chute','Manual do Chute'],
    ['/metodo-ia','Método IA'],
    ['/portugues-para-concursos','Português para Concursos'],
    ['/cronograma-de-estudos-para-concurso','Cronograma de Estudos']
  ]);

  window.dataLayer=window.dataLayer||[];
  function gtag(){window.dataLayer.push(arguments);}
  window.gtag=window.gtag||gtag;

  const readConsent=()=>{
    try{return localStorage.getItem('amc_cookie_consent')||'';}catch{return '';}
  };
  const consentGranted=()=>readConsent()==='all';

  // Consent Mode: Google Analytics começa sem armazenamento de cookies.
  // Quando o visitante autoriza medição na interface existente, o armazenamento é liberado.
  gtag('consent','default',{
    analytics_storage:'denied',
    ad_storage:'denied',
    ad_user_data:'denied',
    ad_personalization:'denied',
    wait_for_update:500
  });
  gtag('set','ads_data_redaction',true);
  if(consentGranted()){
    gtag('consent','update',{analytics_storage:'granted'});
  }

  const loader=document.createElement('script');
  loader.async=true;
  loader.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(MEASUREMENT_ID);
  document.head.appendChild(loader);
  gtag('js',new Date());
  gtag('config',MEASUREMENT_ID,{
    send_page_view:true,
    allow_google_signals:false,
    allow_ad_personalization_signals:false
  });

  const setAnalyticsConsent=(granted)=>{
    gtag('consent','update',{analytics_storage:granted?'granted':'denied'});
  };

  // Integra com o consentimento já existente na página da Academia, sem alterar sua interface.
  document.addEventListener('click',(event)=>{
    const el=event.target.closest('#accept,#necessary');
    if(!el)return;
    setAnalyticsConsent(el.id==='accept');
  },true);

  const cleanText=(value='')=>value.replace(/\s+/g,' ').trim().slice(0,100);
  const cleanPath=(url)=>url.pathname.replace(/\/$/,'')||'/';
  const pageKey=()=>{
    const value=location.pathname.replace(/^\/+|\/+$/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_');
    return (value||'home').slice(0,60);
  };
  const incomingUtm=()=>{
    const current=new URL(location.href);
    const names=['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];
    const out={};
    names.forEach(name=>{const value=current.searchParams.get(name);if(value)out[name]=value.slice(0,150);});
    return out;
  };

  const prepareHotmart=(anchor,url)=>{
    if(url.hostname!==HOTMART_HOST)return url;
    if(!url.searchParams.has('src'))url.searchParams.set('src','lucasmpc_site');
    if(!url.searchParams.has('sck'))url.searchParams.set('sck','site_'+pageKey());
    Object.entries(incomingUtm()).forEach(([key,value])=>{
      if(!url.searchParams.has(key))url.searchParams.set(key,value);
    });
    anchor.href=url.toString();
    return url;
  };

  const track=(name,params={})=>{
    gtag('event',name,{transport_type:'beacon',page_path:location.pathname,...params});
  };

  document.addEventListener('click',(event)=>{
    const anchor=event.target.closest('a[href]');
    if(!anchor)return;
    const raw=anchor.getAttribute('href');
    if(!raw||raw.startsWith('#')||raw.startsWith('javascript:'))return;
    let url;
    try{url=new URL(raw,location.href);}catch{return;}
    url=prepareHotmart(anchor,url);
    const path=cleanPath(url);
    const label=cleanText(anchor.textContent||anchor.getAttribute('aria-label')||'');
    const common={link_text:label,destination_domain:url.hostname,destination_path:path};

    if(url.hostname===HOTMART_HOST){
      track('checkout_click',common);
      return;
    }
    if(['wa.me','api.whatsapp.com','chat.whatsapp.com','web.whatsapp.com'].includes(url.hostname)){
      track('whatsapp_click',common);
      return;
    }
    if(url.hostname==='radar.lucasmpc.com.br'){
      track('radar_click',common);
      return;
    }
    if(url.origin===location.origin&&PRODUCT_PATHS.has(path)){
      track('product_click',{...common,product_name:PRODUCT_PATHS.get(path)});
      return;
    }
    if(url.origin!==location.origin){
      track('outbound_click',common);
    }
  },true);

  window.MPCAnalytics={
    measurementId:MEASUREMENT_ID,
    track,
    setConsent:setAnalyticsConsent
  };
})();
