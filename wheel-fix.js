/* HANOI CULTURE GAME - VÒNG QUAY ỔN ĐỊNH + CỘNG ĐIỂM */
(function(){
  'use strict';

  let correctTeam = Number(localStorage.getItem('lastCorrectTeam')) || null;
  let correctPerson = localStorage.getItem('lastCorrectPerson') || '';
  let rotation = 0;
  let busy = false;

  const $ = id => document.getElementById(id);
  const teamsList = [1,2,3,4];

  function currentCorrect(){
    const t = Number(localStorage.getItem('lastCorrectTeam')) || correctTeam || null;
    const p = localStorage.getItem('lastCorrectPerson') || correctPerson || '';
    correctTeam = t;
    correctPerson = p;
    return {team:t,person:p};
  }

  function syncScores(){
    if(typeof window.updateScore === 'function') window.updateScore();
    renderScores();
  }

  function renderStatus(){
    const el = $('correctTeamStatus');
    if(!el) return;
    const cur = currentCorrect();
    if(cur.team){
      el.className = 'correct-team-status has-team';
      el.innerHTML = `✅ <b>Tổ ${cur.team}</b>${cur.person?` – ${cur.person}`:''} vừa trả lời đúng.<br><span>🎁 Ô +10 sẽ cộng đúng cho Tổ ${cur.team}.</span>`;
    }else{
      el.className = 'correct-team-status';
      el.innerHTML = '⏳ Chưa có thành viên nào vừa trả lời đúng. Ô 🎁 +10 đang chờ đội trả lời đúng.';
    }
  }

  function renderScores(){
    const board = $('wheelScoreboard');
    if(!board || typeof scores === 'undefined') return;
    const vals = teamsList.map(t => Number(scores[t]) || 0);
    const max = Math.max(10,...vals);
    board.innerHTML = teamsList.map(t=>{
      const score = Number(scores[t]) || 0;
      const pct = Math.min(100,score/max*100);
      const active = currentCorrect().team === t;
      return `<div class="wheel-score-card ${active?'is-last':''}">
        <div class="wheel-score-team">🏆 Tổ ${t}</div>
        ${active?'<small>⭐ Đội vừa trả lời đúng</small>':''}
        <div class="wheel-score-number">${score} điểm</div>
        <div class="wheel-score-bar"><i style="width:${pct}%"></i></div>
      </div>`;
    }).join('');
  }

  function rememberCurrentPerson(){
    if(Array.isArray(history) && history.length){
      const p = history[history.length-1];
      window.__currentQuestionTeam = Number(p.team) || null;
      window.__currentQuestionPerson = p.person || '';
    }
  }

  // Bắt sự kiện trước onclick của app.js để không bị mất tổ/người khi câu hỏi chuyển.
  document.addEventListener('click', function(e){
    const target = e.target && e.target.closest ? e.target.closest('button,.answer') : null;
    if(!target) return;

    if(target.matches('button[onclick*="randomPerson"]')){
      setTimeout(()=>{ rememberCurrentPerson(); renderStatus(); renderScores(); },20);
    }

    if(target.classList.contains('answer')){
      const q = questions[qi];
      const answerButtons = Array.from(document.querySelectorAll('.answer'));
      const idx = answerButtons.indexOf(target);
      const team = window.__currentQuestionTeam;
      const person = window.__currentQuestionPerson || '';

      if(q && idx === q.c && team){
        correctTeam = Number(team);
        correctPerson = person;
        localStorage.setItem('lastCorrectTeam',String(correctTeam));
        localStorage.setItem('lastCorrectPerson',correctPerson);
      }else if(q && idx !== q.c){
        correctTeam = null;
        correctPerson = '';
        localStorage.removeItem('lastCorrectTeam');
        localStorage.removeItem('lastCorrectPerson');
      }
      setTimeout(()=>{renderStatus();renderScores();},20);
    }
  },true);

  const plusTen = wheelItems.find(it=>it.type==='addRandomTarget');
  if(plusTen){
    plusTen.label = '🎁 +10\nĐỘI VỪA ĐÚNG';
    plusTen.desc = 'Cộng 10 điểm cho đúng tổ của thành viên vừa trả lời đúng';
  }

  function addPoints(team, points){
    const t = Number(team);
    const p = Number(points);
    if(!teamsList.includes(t) || !Number.isFinite(p)) return false;
    const oldScore = Number(scores[t]) || 0;
    scores[t] = Math.max(0, oldScore + p);
    save();
    syncScores();
    return true;
  }

  function applyResult(item){
    let message = '';
    if(item.type === 'add'){
      addPoints(item.team,item.points);
      message = `🎉 Tổ ${item.team} được cộng ${item.points} điểm!`;
    }else if(item.type === 'subtract'){
      addPoints(item.team,item.points);
      message = `⚠️ Tổ ${item.team} bị trừ ${Math.abs(item.points)} điểm!`;
    }else if(item.type === 'addRandomTarget'){
      const cur = currentCorrect();
      if(cur.team){
        addPoints(cur.team,10);
        message = `🎉 Tổ ${cur.team}${cur.person?` – ${cur.person}`:''} nhận +10 điểm vì vừa trả lời đúng!`;
      }else{
        message = '⚠️ Chưa có tổ vừa trả lời đúng nên ô +10 chưa cộng điểm.';
      }
    }else if(item.type === 'subtractRandomTarget'){
      const t = teamsList[Math.floor(Math.random()*teamsList.length)];
      addPoints(t,-10);
      message = `⚠️ Tổ ${t} ngẫu nhiên bị −10 điểm!`;
    }else if(item.type === 'takeOther'){
      const a = teamsList[Math.floor(Math.random()*teamsList.length)];
      const others = teamsList.filter(t=>t!==a);
      const b = others[Math.floor(Math.random()*others.length)];
      const transferable = Math.min(5,Number(scores[b])||0);
      scores[b] = Math.max(0,(Number(scores[b])||0)-transferable);
      scores[a] = (Number(scores[a])||0)+transferable;
      save();
      syncScores();
      message = transferable>0 ? `🔄 Tổ ${a} lấy ${transferable} điểm từ Tổ ${b}!` : `🔄 Tổ ${a} được chọn lấy điểm từ Tổ ${b}, nhưng Tổ ${b} chưa có điểm.`;
    }else if(item.type === 'exchange'){
      const a = teamsList[Math.floor(Math.random()*teamsList.length)];
      const others = teamsList.filter(t=>t!==a);
      const b = others[Math.floor(Math.random()*others.length)];
      const transferable = Math.min(5,Number(scores[a])||0);
      scores[a] = Math.max(0,(Number(scores[a])||0)-transferable);
      scores[b] = (Number(scores[b])||0)+transferable;
      save();
      syncScores();
      message = transferable>0 ? `🔄 TRAO ĐỔI: Tổ ${a} → Tổ ${b}, chuyển ${transferable} điểm!` : `🔄 TRAO ĐỔI: Tổ ${a} và Tổ ${b} được chọn, nhưng Tổ ${a} chưa có điểm để chuyển.`;
    }

    const box = $('wheelResult');
    if(box){
      box.textContent = message;
      box.classList.remove('result-win');
      void box.offsetWidth;
      box.classList.add('result-win');
    }
    renderStatus();
    renderScores();
    return message;
  }

  function showCenter(item,message){
    const wheel = $('prizeWheel');
    if(!wheel) return;
    const old = wheel.querySelector('.wheel-center-result');
    if(old) old.remove();
    const center = document.createElement('div');
    center.className = 'wheel-center-result';
    center.innerHTML = `<div class="wheel-result-title">🎯 KẾT QUẢ</div><div class="wheel-result-label">${String(item.label||'').replace(/\n/g,'<br>')}</div><div class="wheel-result-effect">${message||''}</div>`;
    wheel.appendChild(center);
    burst(wheel);
  }

  function burst(wheel){
    const old = wheel.querySelector('.wheel-result-burst');
    if(old) old.remove();
    const holder = document.createElement('div');
    holder.className = 'wheel-result-burst';
    for(let i=0;i<30;i++){
      const ray = document.createElement('i');
      ray.style.setProperty('--angle',(i*12)+'deg');
      ray.style.setProperty('--distance',(115+Math.random()*75)+'px');
      holder.appendChild(ray);
    }
    wheel.appendChild(holder);
    setTimeout(()=>holder.remove(),1200);
  }

  function renderWheel(){
    const wheel=$('prizeWheel'), legend=$('wheelLegend');
    if(!wheel || !Array.isArray(wheelItems)) return;
    const slice=360/wheelItems.length;
    wheel.style.background=`conic-gradient(${wheelItems.map((it,i)=>`${it.color} ${i*slice}deg ${(i+1)*slice}deg`).join(',')})`;
    wheel.innerHTML=wheelItems.map((it,i)=>{
      const a=i*slice+slice/2;
      const textAngle=(a>90&&a<270)?180:0;
      return `<div class="wheel-label wheel-label-fixed" style="--angle:${a}deg;--text-angle:${textAngle}deg"><span>${String(it.label).replace(/\n/g,'<br>')}</span></div>`;
    }).join('');
    if(legend){
      legend.innerHTML=wheelItems.map(it=>`<div class="legend-item"><span class="legend-dot" style="background:${it.color}"></span><div><b>${String(it.label).replace(/\n/g,' ')}</b><small>${it.desc}</small></div></div>`).join('');
    }
  }

  function finish(button,wheel,shell){
    busy=false;
    if(button){button.disabled=false;button.textContent='🎡 QUAY';}
    if(wheel)wheel.classList.remove('spinning');
    if(shell)shell.classList.remove('spin-flash');
  }

  window.spinWheel=function(){
    if(busy) return;
    const button=$('spinButton'),wheel=$('prizeWheel'),shell=document.querySelector('.wheel-shell'),result=$('wheelResult');
    if(!button||!wheel||!result) return;

    busy=true;
    button.disabled=true;
    button.textContent='⏳ ĐANG QUAY...';
    wheel.classList.add('spinning');
    if(shell)shell.classList.add('spin-flash');

    const oldCenter=wheel.querySelector('.wheel-center-result');if(oldCenter)oldCenter.remove();
    const oldBurst=wheel.querySelector('.wheel-result-burst');if(oldBurst)oldBurst.remove();
    result.textContent='🎡 Vòng quay đang chạy...';

    const index=Math.floor(Math.random()*wheelItems.length);
    const slice=360/wheelItems.length;
    const target=index*slice+slice/2;
    const current=((rotation%360)+360)%360;
    const delta=(360-target-current+360)%360;
    rotation += 360*(6+Math.floor(Math.random()*3))+delta;

    wheel.style.transition='transform 5.5s cubic-bezier(.12,.75,.18,1)';
    requestAnimationFrame(()=>{wheel.style.transform=`rotate(${rotation}deg)`;});

    setTimeout(()=>{
      try{
        const item=wheelItems[index];
        const message=applyResult(item);
        showCenter(item,message);
        launchConfetti();
      }catch(err){
        console.error('Wheel result error:',err);
        result.textContent='⚠️ Có lỗi khi cộng/trừ điểm.';
      }finally{
        finish(button,wheel,shell);
      }
    },5750);
  };

  // Giao diện phụ, không ảnh hưởng logic điểm.
  const style=document.createElement('style');
  style.textContent=`
    .wheel-label-fixed{position:absolute;left:50%;top:50%;width:116px;height:62px;margin:-31px 0 0 -58px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:11px;font-weight:900;line-height:1.08;pointer-events:none;transform:rotate(var(--angle)) translateY(-125px)!important;transform-origin:center center;text-shadow:0 2px 4px #000;z-index:3}
    .wheel-label-fixed span{display:block;transform:rotate(var(--text-angle));max-width:112px}
    .correct-team-status{margin-top:14px;padding:14px 18px;border:1px solid #35466d;border-radius:14px;background:#111a31;color:#9daac5;text-align:center;font-size:16px;line-height:1.45}.correct-team-status.has-team{border-color:#27d6c5;box-shadow:0 0 20px rgba(39,214,197,.14);color:#eef4ff}.correct-team-status span{color:#9daac5}
    .wheel-score-panel{margin-top:16px;background:#121a31;border:1px solid #2b3b61;border-radius:16px;padding:16px}.wheel-score-panel h2{margin:0 0 12px;font-size:20px}.wheel-scoreboard{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.wheel-score-card{padding:13px 14px;border-radius:13px;background:#1a2440;border:1px solid #2f3e63;min-height:95px}.wheel-score-card.is-last{border-color:#27d6c5;box-shadow:0 0 18px rgba(39,214,197,.16)}.wheel-score-team{font-weight:900;font-size:15px}.wheel-score-card small{color:#27d6c5;font-weight:800}.wheel-score-number{font-size:25px;font-weight:1000;margin-top:5px}.wheel-score-bar{height:6px;background:#293550;border-radius:8px;overflow:hidden;margin-top:8px}.wheel-score-bar i{display:block;height:100%;background:linear-gradient(90deg,#7c5cff,#27d6c5);border-radius:8px;transition:width .35s ease}
    .wheel-center-result{position:absolute;z-index:20;left:50%;top:50%;width:160px;height:160px;transform:translate(-50%,-50%);border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:13px;background:radial-gradient(circle at 35% 24%,#56699f 0,#202c51 42%,#0a1023 100%);border:6px solid #fff;box-shadow:0 0 0 5px rgba(124,92,255,.28),0 0 48px rgba(124,92,255,.98),0 14px 34px rgba(0,0,0,.75);animation:centerExplosion .8s cubic-bezier(.15,1.3,.3,1) both;pointer-events:none}.wheel-result-title{font-size:13px;font-weight:900;letter-spacing:1.2px;color:#edf1ff;text-shadow:0 2px 6px #000;line-height:1.1}.wheel-result-label{font-size:25px;font-weight:1000;line-height:1.02;margin:7px 0;text-shadow:0 3px 8px #000;white-space:nowrap}.wheel-result-effect{font-size:9px;font-weight:800;line-height:1.2;color:#fff;max-width:136px;text-shadow:0 2px 5px #000}
    @keyframes centerExplosion{0%{opacity:0;transform:translate(-50%,-50%) scale(.03);filter:brightness(2.5)}28%{opacity:1;transform:translate(-50%,-50%) scale(1.25);filter:brightness(1.8)}52%{transform:translate(-50%,-50%) scale(.92)}75%{transform:translate(-50%,-50%) scale(1.06)}100%{opacity:1;transform:translate(-50%,-50%) scale(1);filter:brightness(1)}}
    .wheel-result-burst{position:absolute;z-index:19;left:50%;top:50%;width:1px;height:1px;pointer-events:none}.wheel-result-burst i{position:absolute;left:0;top:0;width:6px;height:28px;border-radius:5px;background:#fff;box-shadow:0 0 13px rgba(255,255,255,.95);transform-origin:50% 0;animation:burstRay .85s cubic-bezier(.1,.8,.2,1) both}.wheel-result-burst i:nth-child(3n){background:#ffd166}.wheel-result-burst i:nth-child(3n+1){background:#27d6c5}@keyframes burstRay{0%{opacity:0;transform:rotate(var(--angle)) translateY(0) scale(.15)}35%{opacity:1}100%{opacity:0;transform:rotate(var(--angle)) translateY(calc(var(--distance) * -1)) scale(1)}}
    @media(max-width:920px){.wheel-scoreboard{grid-template-columns:1fr 1fr}}@media(max-width:700px){.wheel-scoreboard{grid-template-columns:1fr}.wheel-center-result{width:140px;height:140px}.wheel-result-label{font-size:22px}.wheel-result-effect{font-size:8px;max-width:116px}.wheel-label-fixed{transform:rotate(var(--angle)) translateY(-113px)!important}}
  `;
  document.head.appendChild(style);

  renderWheel();
  renderStatus();
  renderScores();
})();
