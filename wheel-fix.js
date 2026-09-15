/* VÒNG QUAY - BẢN SỬA ỔN ĐỊNH */
(function(){
  let currentQuestionTeam = null;
  let currentQuestionPerson = '';
  let lastCorrectTeam = Number(localStorage.getItem('lastCorrectTeam')) || null;
  let lastCorrectPerson = localStorage.getItem('lastCorrectPerson') || '';
  let wheelRotation = 0;
  let wheelSpinning = false;

  function rememberCorrect(team, person){
    lastCorrectTeam = Number(team) || null;
    lastCorrectPerson = person || '';
    if(lastCorrectTeam){
      localStorage.setItem('lastCorrectTeam', String(lastCorrectTeam));
      localStorage.setItem('lastCorrectPerson', lastCorrectPerson);
    }else{
      localStorage.removeItem('lastCorrectTeam');
      localStorage.removeItem('lastCorrectPerson');
    }
  }

  function renderStatus(){
    const el = document.getElementById('correctTeamStatus');
    if(!el) return;
    if(lastCorrectTeam){
      el.innerHTML = `✅ <b>Tổ ${lastCorrectTeam}</b>${lastCorrectPerson ? ` – ${lastCorrectPerson}` : ''} vừa trả lời đúng.<br><span>🎁 +10 sẽ cộng cho đúng Tổ ${lastCorrectTeam}.</span>`;
      el.className = 'correct-team-status has-team';
    }else{
      el.innerHTML = '⏳ Chưa có thành viên trả lời đúng. Ô 🎁 +10 sẽ chờ đội trả lời đúng.';
      el.className = 'correct-team-status';
    }
  }

  function renderScores(){
    const board = document.getElementById('wheelScoreboard');
    if(!board) return;
    const maxScore = Math.max(10, 1,2,3,4 .map ? 10 : 10);
    board.innerHTML = [1,2,3,4].map(t=>{
      const score = Number(scores[t]) || 0;
      const pct = Math.min(100, score / Math.max(10,...[1,2,3,4].map(x=>Number(scores[x])||0)) * 100);
      const active = lastCorrectTeam === t;
      return `<div class="wheel-score-card ${active?'is-last':''}">
        <div class="wheel-score-team">🏆 Tổ ${t}</div>
        ${active ? '<small>⭐ Đội vừa trả lời đúng</small>' : ''}
        <div class="wheel-score-number">${score} điểm</div>
        <div class="wheel-score-bar"><i style="width:${pct}%"></i></div>
      </div>`;
    }).join('');
  }

  function showCenter(item, effectText){
    const wheel = document.getElementById('prizeWheel');
    if(!wheel) return;
    const old = wheel.querySelector('.wheel-center-result');
    if(old) old.remove();

    const center = document.createElement('div');
    center.className = 'wheel-center-result';
    const label = String(item.label || '').replace(/\n/g,'<br>');
    center.innerHTML = `
      <div class="wheel-result-title">🎯 KẾT QUẢ</div>
      <div class="wheel-result-label">${label}</div>
      <div class="wheel-result-effect">${effectText || ''}</div>
    `;
    wheel.appendChild(center);
    makeBurst(wheel);
  }

  function makeBurst(wheel){
    const old = wheel.querySelector('.wheel-result-burst');
    if(old) old.remove();
    const holder = document.createElement('div');
    holder.className = 'wheel-result-burst';
    for(let i=0;i<32;i++){
      const ray = document.createElement('i');
      ray.style.setProperty('--angle',(i*360/32)+'deg');
      ray.style.setProperty('--distance',(120 + Math.random()*70)+'px');
      holder.appendChild(ray);
    }
    wheel.appendChild(holder);
    setTimeout(()=>holder.remove(),1200);
  }

  function applyResult(item){
    let text = '';
    if(item.type === 'add'){
      scores[item.team] = clampScore(scores[item.team] + item.points);
      text = `🎉 Tổ ${item.team} được cộng ${item.points} điểm!`;
    }else if(item.type === 'subtract'){
      scores[item.team] = clampScore(scores[item.team] + item.points);
      text = `⚠️ Tổ ${item.team} bị trừ ${Math.abs(item.points)} điểm!`;
    }else if(item.type === 'addRandomTarget'){
      const target = lastCorrectTeam;
      if(target){
        scores[target] = clampScore(scores[target] + 10);
        text = `🎉 Tổ ${target}${lastCorrectPerson ? ` – ${lastCorrectPerson}` : ''} nhận +10 điểm vì vừa trả lời đúng!`;
      }else{
        text = '⚠️ Chưa có Tổ vừa trả lời đúng nên chưa cộng +10 điểm.';
      }
    }else if(item.type === 'subtractRandomTarget'){
      const target = Math.floor(Math.random()*4)+1;
      scores[target] = clampScore(scores[target] - 10);
      text = `⚠️ Tổ ${target} ngẫu nhiên bị −10 điểm!`;
    }else if(item.type === 'takeOther'){
      const winner = Math.floor(Math.random()*4)+1;
      const other = [1,2,3,4].filter(t=>t!==winner)[Math.floor(Math.random()*3)];
      const actual = Math.min(5, Number(scores[other]) || 0);
      scores[other] = (Number(scores[other]) || 0) - actual;
      scores[winner] = (Number(scores[winner]) || 0) + actual;
      text = actual > 0
        ? `🔄 Tổ ${winner} lấy ${actual} điểm từ Tổ ${other}!`
        : `🔄 Tổ ${winner} được chọn lấy điểm từ Tổ ${other}, nhưng Tổ ${other} chưa có điểm.`;
    }else if(item.type === 'exchange'){
      const a = Math.floor(Math.random()*4)+1;
      const b = [1,2,3,4].filter(t=>t!==a)[Math.floor(Math.random()*3)];
      const transfer = Math.min(5, Number(scores[a]) || 0);
      scores[a] = (Number(scores[a]) || 0) - transfer;
      scores[b] = (Number(scores[b]) || 0) + transfer;
      text = transfer > 0
        ? `🔄 TRAO ĐỔI: Tổ ${a} → Tổ ${b}, chuyển ${transfer} điểm!`
        : `🔄 TRAO ĐỔI: Tổ ${a} và Tổ ${b} được chọn, nhưng Tổ ${a} chưa có điểm để chuyển.`;
    }
    save();
    updateScore();
    const box = document.getElementById('wheelResult');
    if(box){
      box.textContent = text;
      box.classList.remove('result-win');
      void box.offsetWidth;
      box.classList.add('result-win');
    }
    launchConfetti();
    renderStatus();
    renderScores();
    return text;
  }

  // Bắt sự kiện ở capture phase nên chắc chắn lấy được tổ trước khi app.js chuyển câu.
  document.addEventListener('click', function(e){
    const randomBtn = e.target.closest && e.target.closest('button[onclick*="randomPerson"]');
    if(randomBtn){
      setTimeout(()=>{
        if(Array.isArray(history) && history.length){
          const picked = history[history.length-1];
          currentQuestionTeam = picked.team;
          currentQuestionPerson = picked.person || '';
        }
        renderStatus();
        renderScores();
      }, 0);
    }

    const answerBtn = e.target.closest && e.target.closest('.answer');
    if(answerBtn){
      const q = questions[qi];
      const buttons = Array.from(document.querySelectorAll('.answer'));
      const index = buttons.indexOf(answerBtn);
      if(q && index === q.c && currentQuestionTeam){
        rememberCorrect(currentQuestionTeam, currentQuestionPerson);
      }else if(q && index !== q.c){
        rememberCorrect(null, '');
      }
      setTimeout(()=>{ renderStatus(); renderScores(); }, 0);
    }
  }, true);

  function renderWheel(){
    const wheel = document.getElementById('prizeWheel');
    const legend = document.getElementById('wheelLegend');
    if(!wheel || !Array.isArray(wheelItems)) return;
    const n = wheelItems.length;
    const slice = 360 / n;
    wheel.style.background = `conic-gradient(${wheelItems.map((it,i)=>`${it.color} ${i*slice}deg ${(i+1)*slice}deg`).join(',')})`;

    wheel.innerHTML = wheelItems.map((it,i)=>{
      const angle = i*slice + slice/2;
      const upright = angle > 90 && angle < 270 ? 180 : 0;
      return `<div class="wheel-label wheel-label-fixed" style="--angle:${angle}deg;--text-angle:${upright}deg"><span>${String(it.label).replace(/\n/g,'<br>')}</span></div>`;
    }).join('');

    if(legend){
      legend.innerHTML = wheelItems.map(it=>`<div class="legend-item"><span class="legend-dot" style="background:${it.color}"></span><div><b>${String(it.label).replace(/\n/g,' ')}</b><small>${it.desc}</small></div></div>`).join('');
    }
  }

  function createLayout(){
    const result = document.getElementById('wheelResult');
    if(!result) return;
    if(!document.getElementById('correctTeamStatus')){
      const status = document.createElement('div');
      status.id = 'correctTeamStatus';
      status.className = 'correct-team-status';
      result.parentNode.insertBefore(status, result);
    }
    if(!document.getElementById('wheelScorePanel')){
      const panel = document.createElement('div');
      panel.id = 'wheelScorePanel';
      panel.className = 'wheel-score-panel';
      panel.innerHTML = '<h2>🏆 Bảng điểm từng tổ</h2><div id="wheelScoreboard" class="wheel-scoreboard"></div>';
      result.parentNode.insertBefore(panel, result);
    }
  }

  window.spinWheel = function(){
    if(wheelSpinning) return;
    wheelSpinning = true;
    const button = document.getElementById('spinButton');
    const wheel = document.getElementById('prizeWheel');
    const shell = document.querySelector('.wheel-shell');
    const result = document.getElementById('wheelResult');
    if(!button || !wheel || !result){ wheelSpinning=false; return; }

    button.disabled = true;
    button.textContent = '⏳ ĐANG QUAY...';
    wheel.classList.add('spinning');
    if(shell) shell.classList.add('spin-flash');

    const oldCenter = wheel.querySelector('.wheel-center-result');
    if(oldCenter) oldCenter.remove();
    const oldBurst = wheel.querySelector('.wheel-result-burst');
    if(oldBurst) oldBurst.remove();
    result.textContent = '🎡 Vòng quay đang chạy...';

    const index = Math.floor(Math.random()*wheelItems.length);
    const slice = 360 / wheelItems.length;
    const targetCenter = index*slice + slice/2;
    const normalized = (360-targetCenter+360)%360;
    const fullTurns = 6 + Math.floor(Math.random()*3);
    wheelRotation += 360*fullTurns + normalized;

    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      wheel.style.transform = `rotate(${wheelRotation}deg)`;
    }));

    setTimeout(()=>{
      const item = wheelItems[index];
      const text = applyResult(item);
      wheel.classList.remove('spinning');
      if(shell) shell.classList.remove('spin-flash');
      button.disabled = false;
      button.textContent = '🎡 QUAY';
      wheelSpinning = false;
      showCenter(item, text);
      renderStatus();
      renderScores();
    }, 5700);
  };

  const style = document.createElement('style');
  style.textContent = `
    .wheel-label-fixed{position:absolute;left:50%;top:50%;width:116px;height:62px;margin:-31px 0 0 -58px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:11px;font-weight:900;line-height:1.08;pointer-events:none;transform:rotate(var(--angle)) translateY(-125px)!important;transform-origin:center center;text-shadow:0 2px 4px #000;z-index:3}
    .wheel-label-fixed span{display:block;transform:rotate(var(--text-angle));white-space:normal;max-width:112px}
    .correct-team-status{margin-top:14px;padding:14px 18px;border:1px solid #35466d;border-radius:14px;background:#111a31;color:#9daac5;text-align:center;font-size:16px;line-height:1.45}
    .correct-team-status.has-team{border-color:#27d6c5;box-shadow:0 0 20px rgba(39,214,197,.14);color:#eef4ff}
    .correct-team-status span{color:#9daac5}
    .wheel-score-panel{margin-top:16px;background:#121a31;border:1px solid #2b3b61;border-radius:16px;padding:16px}
    .wheel-score-panel h2{margin:0 0 12px;font-size:20px}
    .wheel-scoreboard{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
    .wheel-score-card{padding:13px 14px;border-radius:13px;background:#1a2440;border:1px solid #2f3e63;min-height:95px}
    .wheel-score-card.is-last{border-color:#27d6c5;box-shadow:0 0 18px rgba(39,214,197,.16)}
    .wheel-score-team{font-weight:900;font-size:15px}.wheel-score-card small{color:#27d6c5;font-weight:800}.wheel-score-number{font-size:25px;font-weight:1000;margin-top:5px}.wheel-score-bar{height:6px;background:#293550;border-radius:8px;overflow:hidden;margin-top:8px}.wheel-score-bar i{display:block;height:100%;background:linear-gradient(90deg,#7c5cff,#27d6c5);border-radius:8px;transition:width .35s ease}
    .wheel-center-result{position:absolute;z-index:20;left:50%;top:50%;width:160px;height:160px;transform:translate(-50%,-50%);border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:13px;background:radial-gradient(circle at 35% 24%,#56699f 0,#202c51 42%,#0a1023 100%);border:6px solid #fff;box-shadow:0 0 0 5px rgba(124,92,255,.28),0 0 48px rgba(124,92,255,.98),0 14px 34px rgba(0,0,0,.75);animation:centerExplosion .8s cubic-bezier(.15,1.3,.3,1) both;pointer-events:none}
    .wheel-result-title{font-size:13px;font-weight:900;letter-spacing:1.2px;color:#edf1ff;text-shadow:0 2px 6px #000;line-height:1.1}.wheel-result-label{font-size:25px;font-weight:1000;line-height:1.02;margin:7px 0;text-shadow:0 3px 8px #000}.wheel-result-effect{font-size:9px;font-weight:800;line-height:1.2;color:#fff;max-width:136px;text-shadow:0 2px 5px #000}
    @keyframes centerExplosion{0%{opacity:0;transform:translate(-50%,-50%) scale(.03);filter:brightness(2.5)}28%{opacity:1;transform:translate(-50%,-50%) scale(1.25);filter:brightness(1.8)}52%{transform:translate(-50%,-50%) scale(.92)}75%{transform:translate(-50%,-50%) scale(1.06)}100%{opacity:1;transform:translate(-50%,-50%) scale(1);filter:brightness(1)}}
    .wheel-result-burst{position:absolute;z-index:19;left:50%;top:50%;width:1px;height:1px;pointer-events:none}.wheel-result-burst i{position:absolute;left:0;top:0;width:6px;height:28px;border-radius:5px;background:#fff;box-shadow:0 0 13px rgba(255,255,255,.95);transform-origin:50% 0;animation:burstRay .85s cubic-bezier(.1,.8,.2,1) both}.wheel-result-burst i:nth-child(3n){background:#ffd166}.wheel-result-burst i:nth-child(3n+1){background:#27d6c5}@keyframes burstRay{0%{opacity:0;transform:rotate(var(--angle)) translateY(0) scale(.15)}35%{opacity:1}100%{opacity:0;transform:rotate(var(--angle)) translateY(calc(var(--distance) * -1)) scale(1)}}
    @media(max-width:920px){.wheel-scoreboard{grid-template-columns:1fr 1fr}}@media(max-width:700px){.wheel-scoreboard{grid-template-columns:1fr}.wheel-center-result{width:140px;height:140px}.wheel-result-label{font-size:22px}.wheel-result-effect{font-size:8px;max-width:116px}.wheel-label-fixed{transform:rotate(var(--angle)) translateY(-113px)!important}}
  `;
  document.head.appendChild(style);
  createLayout();
  renderWheel();
  renderStatus();
  renderScores();
})();
