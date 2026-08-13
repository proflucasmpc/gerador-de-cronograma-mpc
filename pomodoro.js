(()=>{
  'use strict';
  const SETTINGS_KEY='mpcPomodoroSettingsV1';
  const SESSION_KEY='mpcPomodoroSessionV1';
  const $=(s,r=document)=>r.querySelector(s);
  const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
  const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
  const defaults={focus:20,rest:10,sound:true,volume:.35};
  let settings={...defaults,...read(SETTINGS_KEY,{})};
  let state={mode:'focus',running:false,remaining:settings.focus*60,endAt:0,cycles:0,...read(SESSION_KEY,{})};
  if(!['focus','rest'].includes(state.mode))state.mode='focus';
  state.remaining=Math.max(0,Number(state.remaining)||settings.focus*60);
  state.cycles=Math.max(0,Number(state.cycles)||0);
  let tickId=null;
  let audioCtx=null;

  function ensureAudio(){
    if(!settings.sound)return null;
    try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx}catch{return null}
  }
  function tone(freq=660,duration=.16,delay=0){
    const ctx=ensureAudio();if(!ctx)return;
    try{const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=freq;gain.gain.value=0;osc.connect(gain);gain.connect(ctx.destination);const t=ctx.currentTime+delay;const vol=clamp(Number(settings.volume)||.35,.05,1)*.18;gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(vol,t+.015);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);osc.start(t);osc.stop(t+duration+.03)}catch{}
  }
  function signal(kind){
    if(settings.sound){
      if(kind==='start'){tone(660,.13);tone(820,.13,.17)}
      else if(kind==='rest'){tone(560,.14);tone(560,.14,.19)}
      else {tone(760,.12);tone(920,.12,.16);tone(1080,.14,.32)}
    }
    try{if('vibrate'in navigator)navigator.vibrate(kind==='rest'?[100,80,100]:[120])}catch{}
  }
  function secondsFor(mode){return (mode==='focus'?settings.focus:settings.rest)*60}
  function save(){write(SETTINGS_KEY,settings);write(SESSION_KEY,state)}
  function currentRemaining(){return state.running?Math.max(0,Math.ceil((state.endAt-Date.now())/1000)):Math.max(0,state.remaining)}
  function format(sec){sec=Math.max(0,Math.floor(sec));return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`}
  function switchMode(auto=false){
    if(state.mode==='focus'){state.mode='rest';state.remaining=secondsFor('rest');if(auto)state.cycles+=1;signal('rest')}
    else{state.mode='focus';state.remaining=secondsFor('focus');signal('focus')}
    if(state.running)state.endAt=Date.now()+state.remaining*1000;
    save();render();
  }
  function completePhase(){state.remaining=0;switchMode(true)}
  function tick(){
    const remaining=currentRemaining();
    if(state.running&&remaining<=0){completePhase();return}
    state.remaining=remaining;save();renderClock();
  }
  function start(){
    ensureAudio();
    if(state.running)return;
    if(currentRemaining()<=0)state.remaining=secondsFor(state.mode);
    state.running=true;state.endAt=Date.now()+state.remaining*1000;signal('start');save();startTicker();render();
  }
  function pause(){state.remaining=currentRemaining();state.running=false;state.endAt=0;save();stopTicker();render()}
  function reset(){state.running=false;state.endAt=0;state.remaining=secondsFor(state.mode);save();stopTicker();render()}
  function startTicker(){stopTicker();tickId=setInterval(tick,500)}
  function stopTicker(){if(tickId){clearInterval(tickId);tickId=null}}
  function applyPreset(focus,rest){settings.focus=focus;settings.rest=rest;state.mode='focus';state.running=false;state.endAt=0;state.remaining=focus*60;save();stopTicker();syncInputs();render()}
  function syncInputs(){const f=$('#mpcPomodoroFocus'),r=$('#mpcPomodoroRest'),s=$('#mpcPomodoroSound'),v=$('#mpcPomodoroVolume');if(f)f.value=settings.focus;if(r)r.value=settings.rest;if(s)s.checked=Boolean(settings.sound);if(v)v.value=Math.round(settings.volume*100)}
  function renderClock(){const clock=$('#mpcPomodoroClock'),label=$('#mpcPomodoroMode'),cycles=$('#mpcPomodoroCycles'),status=$('#mpcPomodoroStatus');if(clock)clock.textContent=format(currentRemaining());if(label)label.textContent=state.mode==='focus'?'FOCO':'DESCANSO';if(cycles)cycles.textContent=String(state.cycles);if(status)status.textContent=state.running?(state.mode==='focus'?'Concentre-se apenas na atividade atual.':'Pausa em andamento. Afaste-se da tarefa por alguns minutos.'):'Timer pausado';const card=$('#mpcPomodoroCard');card?.classList.toggle('is-rest',state.mode==='rest')}
  function render(){renderClock();const startBtn=$('#mpcPomodoroStart'),pauseBtn=$('#mpcPomodoroPause');if(startBtn)startBtn.disabled=state.running;if(pauseBtn)pauseBtn.disabled=!state.running}

  function build(){
    if(document.getElementById('pomodoro-flexivel'))return;
    const anchor=document.getElementById('hoje')||document.getElementById('rotina-estudos')||document.getElementById('plano');if(!anchor)return;
    const section=document.createElement('section');section.className='section pomodoro-section';section.id='pomodoro-flexivel';
    section.innerHTML=`<div class="section-heading"><div><span class="kicker">Ferramenta de foco</span><h2>Timer Pomodoro Flexível</h2></div><p>Escolha o tempo de foco e de descanso que combina com sua rotina.</p></div><div class="panel pomodoro-panel"><div class="pomodoro-main" id="mpcPomodoroCard"><div class="pomodoro-top"><span id="mpcPomodoroMode">FOCO</span><small><b id="mpcPomodoroCycles">0</b> ciclos concluídos</small></div><div class="pomodoro-clock" id="mpcPomodoroClock">20:00</div><div class="pomodoro-status" id="mpcPomodoroStatus">Timer pausado</div><div class="pomodoro-actions"><button type="button" class="pomodoro-primary" id="mpcPomodoroStart">Iniciar</button><button type="button" id="mpcPomodoroPause">Pausar</button><button type="button" id="mpcPomodoroReset">Reiniciar</button><button type="button" id="mpcPomodoroSkip">Trocar etapa</button></div><div class="pomodoro-presets"><button type="button" data-pomodoro-preset="15,5">15 / 5</button><button type="button" data-pomodoro-preset="20,10">20 / 10</button><button type="button" data-pomodoro-preset="30,15">30 / 15</button></div></div><div class="pomodoro-side"><div class="pomodoro-config"><label>Tempo de foco <span><input id="mpcPomodoroFocus" type="number" min="5" max="120" inputmode="numeric"> min</span></label><label>Tempo de descanso <span><input id="mpcPomodoroRest" type="number" min="1" max="60" inputmode="numeric"> min</span></label><label class="pomodoro-toggle">Avisos sonoros <input id="mpcPomodoroSound" type="checkbox"></label><label>Volume <span><input id="mpcPomodoroVolume" type="range" min="5" max="100" step="5"></span></label></div><div class="pomodoro-help"><h3>Como usar a técnica</h3><p>Escolha um período de foco, inicie o relógio e trabalhe apenas na atividade do cronograma até o aviso. Depois faça a pausa programada e retorne para o próximo ciclo.</p><p><strong>Para que serve:</strong> ajuda a começar, sustentar a concentração, reduzir a fadiga e transformar períodos curtos do dia em estudo produtivo. O Pomodoro é uma ferramenta de execução: ele não substitui o conteúdo planejado no cronograma.</p><p class="pomodoro-tip"><strong>Dica:</strong> se estiver cansado ou com dificuldade para começar, use 15 minutos de foco. Em dias tranquilos, aumente para 20 ou 30 minutos.</p></div></div></div>`;
    anchor.insertAdjacentElement('afterend',section);
    const style=document.createElement('style');style.textContent=`.pomodoro-panel{display:grid;grid-template-columns:minmax(300px,.85fr) minmax(320px,1.15fr);gap:18px;padding:22px}.pomodoro-main{background:linear-gradient(145deg,#071225,#18365E);color:#fff;border-radius:16px;padding:22px;border:1px solid #335681;box-shadow:0 14px 34px rgba(7,18,37,.14)}.pomodoro-main.is-rest{background:linear-gradient(145deg,#143d34,#1d5b4b)}.pomodoro-top{display:flex;justify-content:space-between;align-items:center;gap:12px}.pomodoro-top>span{font-size:11px;font-weight:950;letter-spacing:.14em;color:#7FE5F0}.pomodoro-main.is-rest .pomodoro-top>span{color:#9EF0C9}.pomodoro-top small{font-size:11px;color:#dce7f8}.pomodoro-clock{font-family:Georgia,"Times New Roman",serif;font-size:clamp(56px,8vw,88px);line-height:1;text-align:center;margin:24px 0 8px;letter-spacing:.02em}.pomodoro-status{text-align:center;color:#dce7f8;font-size:12px;min-height:20px}.pomodoro-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:20px}.pomodoro-actions button,.pomodoro-presets button{border:1px solid #56739a;background:#18365E;color:#fff;border-radius:9px;padding:10px 12px;font-weight:900;cursor:pointer}.pomodoro-actions button:disabled{opacity:.45;cursor:not-allowed}.pomodoro-actions .pomodoro-primary{background:#24C8FF;color:#071225;border-color:#24C8FF}.pomodoro-presets{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:10px}.pomodoro-presets button{font-size:11px;padding:8px}.pomodoro-side{display:grid;gap:12px}.pomodoro-config,.pomodoro-help{border:1px solid var(--line);border-radius:13px;padding:16px;background:#F8FAFD}.pomodoro-config{display:grid;grid-template-columns:1fr 1fr;gap:11px}.pomodoro-config label{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12px;font-weight:850;color:var(--navy3)}.pomodoro-config label span{display:flex;align-items:center;gap:5px;color:var(--muted)}.pomodoro-config input[type=number]{width:64px;border:1px solid var(--line);border-radius:8px;padding:8px;text-align:center;background:#fff}.pomodoro-config input[type=range]{width:110px}.pomodoro-toggle input{width:18px;height:18px}.pomodoro-help h3{font-family:Georgia,serif;color:var(--navy3);font-size:20px;margin:0 0 8px}.pomodoro-help p{font-size:13px;color:var(--muted);line-height:1.65;margin:7px 0}.pomodoro-tip{border-left:4px solid var(--purple);padding-left:10px}.pomodoro-section{scroll-margin-top:145px}@media(max-width:800px){.pomodoro-panel{grid-template-columns:1fr}.pomodoro-config{grid-template-columns:1fr}.pomodoro-clock{font-size:64px}}@media(max-width:460px){.pomodoro-panel{padding:14px}.pomodoro-main{padding:18px 14px}.pomodoro-actions{grid-template-columns:1fr 1fr}.pomodoro-config label{align-items:flex-start}.pomodoro-presets{grid-template-columns:repeat(3,1fr)}}`;document.head.appendChild(style);

    syncInputs();render();
    $('#mpcPomodoroStart')?.addEventListener('click',start);$('#mpcPomodoroPause')?.addEventListener('click',pause);$('#mpcPomodoroReset')?.addEventListener('click',reset);$('#mpcPomodoroSkip')?.addEventListener('click',()=>switchMode(false));
    document.querySelectorAll('[data-pomodoro-preset]').forEach(btn=>btn.addEventListener('click',()=>{const [f,r]=btn.dataset.pomodoroPreset.split(',').map(Number);applyPreset(f,r)}));
    $('#mpcPomodoroFocus')?.addEventListener('change',e=>{settings.focus=clamp(Number(e.target.value)||20,5,120);if(!state.running&&state.mode==='focus')state.remaining=settings.focus*60;save();syncInputs();render()});
    $('#mpcPomodoroRest')?.addEventListener('change',e=>{settings.rest=clamp(Number(e.target.value)||10,1,60);if(!state.running&&state.mode==='rest')state.remaining=settings.rest*60;save();syncInputs();render()});
    $('#mpcPomodoroSound')?.addEventListener('change',e=>{settings.sound=e.target.checked;save();if(settings.sound){ensureAudio();signal('start')}});
    $('#mpcPomodoroVolume')?.addEventListener('input',e=>{settings.volume=clamp((Number(e.target.value)||35)/100,.05,1);save()});
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')tick()});window.addEventListener('pageshow',tick);window.addEventListener('focus',tick);
    if(state.running){if(state.endAt<=Date.now())completePhase();startTicker()}else render();
  }

  function mountWhenPlanIsReady(){
    let attempts=0;
    const tryMount=()=>{
      if(document.getElementById('pomodoro-flexivel'))return;
      const anchor=document.getElementById('hoje')||document.getElementById('rotina-estudos')||document.getElementById('plano');
      if(anchor){build();return}
      attempts+=1;
      if(attempts<120)setTimeout(tryMount,100);
    };
    tryMount();
  }
  function init(){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountWhenPlanIsReady,{once:true});else mountWhenPlanIsReady()}
  init();
})();
