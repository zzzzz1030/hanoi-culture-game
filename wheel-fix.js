/* VÒNG QUAY - HIỂN THỊ KẾT QUẢ +10 CHO TỔ VỪA TRẢ LỜI ĐÚNG + BẢNG ĐIỂM */
(function(){
  let currentQuestionTeam=null;
  let currentQuestionPerson=null;
  let lastCorrectTeam=Number(localStorage.getItem('lastCorrectTeam'))||null;
  let lastCorrectPerson=localStorage.getItem('lastCorrectPerson')||'';

  function saveCorrectTeam(){
    if(lastCorrectTeam){
      localStorage.setItem('lastCorrectTeam',String(lastCorrectTeam));
      localStorage.setItem('lastCorrectPerson',lastCorrectPerson||'');
    }else{
      localStorage.removeItem('lastCorrectTeam');
      localStorage.removeItem('lastCorrectPerson');
    }
  }

  function updateStatus(){
    const status=document.getElementById('correctTeamStatus');
    if(!status)return;
    if(lastCorrectTeam){
      status.innerHTML=`✅ <b>Tổ ${lastCorrectTeam}</b>${lastCorrectPerson?` – ${lastCorrectPerson}`:''} vừa trả lời đúng.<br><span>Ô 🎁 +10 sẽ cộng 10 điểm cho Tổ ${lastCorrectTeam}.</span>`;
      status.className='correct-team-status has-team';
    }else{
      status.innerHTML='⏳ Chưa có thành viên nào vừa trả lời đúng. Ô 🎁 +10 chưa có đội nhận điểm.';
      status.className='correct-team-status';
    }
  }

  function updateWheelScoreboard(){
    const board=document.getElementById('wheelScoreboard');
    if(!board || typeof scores==='undefined')return;
    const max=Math.max(10,...[1,2,3,4].map(t=>Number(scores[t])||0));
    board.innerHTML=[1,2,3,4].map(t=>{
      const score=Number(scores[t])||0;
      const isLast=lastCorrectTeam===t;
      const pct=Math.min(100,score/max*100);
      return `<div class="wheel-score-card ${isLast?'is-last':''}">
        <div><div class="wheel-score-team">🏆 Tổ ${t}</div>${isLast?'<small>⭐ Vừa trả lời đúng</small>':''}</div>
        <div class="wheel-score-number">${score}</div>
        <div class="wheel-score-bar"><i style="width:${pct}%"></i></div>
      </div>`;
    }).join('');
  }

  // Gắn tổ của người vừa được random vào lượt trả lời.
  const originalRandomPerson=window.randomPerson;
  if(typeof originalRandomPerson==='function'){
    window.randomPerson=function(){
      const before=history.length;
      originalRandomPerson();
      if(history.length>before){
        const picked=history[history.length-1];
        currentQuestionTeam=picked.team;
        currentQuestionPerson=picked.person;
      }
      updateStatus();
      updateWheelScoreboard();
    };
  }

  // Khi trả lời đúng, ghi nhớ chính xác tổ của thành viên vừa được gọi.
  const originalAnswerQuestion=window.answerQuestion;
  if(typeof originalAnswerQuestion==='function'){
    window.answerQuestion=function(i){
      const q=questions[qi];
      const correct=!!q && i===q.c;
      if(correct && currentQuestionTeam){
        lastCorrectTeam=currentQuestionTeam;
        lastCorrectPerson=currentQuestionPerson||'';
        saveCorrectTeam();
      }else if(!correct){
        lastCorrectTeam=null;
        lastCorrectPerson='';
        saveCorrectTeam();
      }
      originalAnswerQuestion(i);
      updateStatus();
      updateWheelScoreboard();
    };
  }

  const plusTen=wheelItems.find(it=>it.type==='addRandomTarget');
  if(plusTen){
    plusTen.label='🎁 +10\nĐỘI VỪA ĐÚNG';
    plusTen.desc='Cộng 10 điểm cho tổ của thành viên vừa trả lời đúng câu hỏi';
  }

  // Thay thế riêng logic của ô +10, các ô còn lại giữ nguyên.
  const originalApplyWheelItem=window.applyWheelItem;
  if(typeof originalApplyWheelItem==='function'){
    window.applyWheelItem=function(item){
      if(item && item.type==='addRandomTarget'){
        const target=lastCorrectTeam;
        const box=document.getElementById('wheelResult');
        let text='';
        if(target){
          scores[target]=clampScore(scores[target]+10);
          save();
          updateScore();
          text=`🎉 Tổ ${target}${lastCorrectPerson?` – ${lastCorrectPerson}`:''} vừa trả lời đúng và nhận +10 điểm!`;
        }else{
          text='⚠️ Không có tổ nào vừa trả lời đúng, nên ô +10 không cộng điểm.';
        }
        if(box){
          box.textContent=text;
          box.classList.remove('result-win');
          void box.offsetWidth;
          box.classList.add('result-win');
        }
        launchConfetti();
        updateStatus();
        updateWheelScoreboard();
        return;
      }
      originalApplyWheelItem(item);
      updateWheelScoreboard();
    };
  }

  function renderWheel(){
    const wheel=document.getElementById('prizeWheel');
    const legend=document.getElementById('wheelLegend');
    if(!wheel || !Array.isArray(wheelItems))return;

    const n=wheelItems.length;
    const slice=360/n;
    wheel.style.background=`conic-gradient(${wheelItems.map((it,i)=>`${it.color} ${i*slice}deg ${(i+1)*slice}deg`).join(',')})`;

    // Đặt chữ theo bán kính, không dồn tất cả vào tâm.
    wheel.innerHTML=wheelItems.map((it,i)=>{
      const angle=i*slice+slice/2;
      return `<div class="wheel-label wheel-label-fixed" style="--angle:${angle}deg;--counter-angle:-${angle}deg"><span>${it.label.replace(/\n/g,'<br>')}</span></div>`;
    }).join('');

    if(legend){
      legend.innerHTML=wheelItems.map(it=>`<div class="legend-item"><span class="legend-dot" style="background:${it.color}"></span><div><b>${it.label.replace(/\n/g,' ')}</b><small>${it.desc}</small></div></div>`).join('');
    }
  }

  function addScoreboard(){
    const result=document.getElementById('wheelResult');
    if(!result)return;
    if(!document.getElementById('correctTeamStatus')){
      const status=document.createElement('div');
      status.id='correctTeamStatus';
      status.className='correct-team-status';
      result.parentNode.insertBefore(status,result);
    }
    if(!document.getElementById('wheelScorePanel')){
      const panel=document.createElement('div');
      panel.id='wheelScorePanel';
      panel.className='wheel-score-panel';
      panel.innerHTML='<h2>🏆 Bảng điểm các tổ</h2><div id="wheelScoreboard"></div>';
      result.parentNode.insertBefore(panel,result);
    }
  }

  function burst(wheel){
    const holder=document.createElement('div');
    holder.className='wheel-result-burst';
    for(let i=0;i<32;i++){
      const p=document.createElement('i');
      p.style.setProperty('--angle',(360/32*i)+'deg');
      p.style.setProperty('--distance',(125+Math.random()*75)+'px');
      holder.appendChild(p);
    }
    wheel.appendChild(holder);
    setTimeout(()=>holder.remove(),1150);
  }

  window.spinWheel=function(){
    if(spinning)return;
    spinning=true;

    const button=document.getElementById('spinButton');
    const wheel=document.getElementById('prizeWheel');
    const shell=document.querySelector('.wheel-shell');
    const result=document.getElementById('wheelResult');
    if(!button || !wheel || !result){spinning=false;return;}

    button.disabled=true;
    button.textContent='⏳ ĐANG QUAY...';
    wheel.classList.add('spinning');
    if(shell)shell.classList.add('spin-flash');

    const oldCenter=wheel.querySelector('.wheel-center-result');
    if(oldCenter)oldCenter.remove();
    const oldBurst=wheel.querySelector('.wheel-result-burst');
    if(oldBurst)oldBurst.remove();

    result.innerHTML='🎡 Vòng quay đang chạy...';
    updateStatus();
    updateWheelScoreboard();

    const index=Math.floor(Math.random()*wheelItems.length);
    const slice=360/wheelItems.length;
    const targetCenter=index*slice+slice/2;
    const normalized=(360-targetCenter+360)%360;
    const fullTurns=6+Math.floor(Math.random()*3);
    rotation+=360*fullTurns+normalized;

    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      wheel.style.transform=`rotate(${rotation}deg)`;
    }));

    setTimeout(()=>{
      const item=wheelItems[index];

      // Tính và áp dụng điểm trước, sau đó đọc thông báo thật để hiển thị ở tâm.
      applyWheelItem(item);
      const effectText=result.textContent;

      wheel.classList.remove('spinning');
      if(shell)shell.classList.remove('spin-flash');
      button.disabled=false;
      button.textContent='🎡 QUAY';
      spinning=false;

      const center=document.createElement('div');
      center.className='wheel-center-result';
      center.innerHTML=`<div class="wheel-result-title">🎯 KẾT QUẢ</div><div class="wheel-result-label">${item.label.replace(/\n/g,'<br>')}</div><div class="wheel-result-effect">${effectText}</div>`;
      wheel.appendChild(center);
      burst(wheel);
      result.classList.add('result-win');
      updateStatus();
      updateWheelScoreboard();
    },5750);
  };

  const style=document.createElement('style');
  style.textContent=`
    .wheel{position:relative;overflow:hidden}
    .wheel-label-fixed{position:absolute;left:50%;top:50%;width:112px;height:58px;margin-left:-56px;margin-top:-29px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:11px;font-weight:900;line-height:1.08;pointer-events:none;transform:rotate(var(--angle)) translateY(-125px)!important;transform-origin:center center;text-shadow:0 2px 4px #000;z-index:3}
    .wheel-label-fixed span{display:block;transform:rotate(var(--counter-angle));white-space:nowrap}
    .wheel::after{z-index:4}

    .correct-team-status{margin:14px 0 0;padding:14px 18px;border:1px solid #35466d;border-radius:14px;background:#111a31;color:#9daac5;text-align:center;font-size:16px;line-height:1.45}
    .correct-team-status.has-team{border-color:#27d6c5;box-shadow:0 0 20px rgba(39,214,197,.12);color:#eef4ff}
    .correct-team-status span{color:#9daac5}

    .wheel-score-panel{margin-top:16px;background:#121a31;border:1px solid #2b3b61;border-radius:16px;padding:16px}
    .wheel-score-panel h2{margin:0 0 12px;font-size:20px}
    .wheel-scoreboard{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
    .wheel-score-card{position:relative;padding:13px 14px;border-radius:13px;background:#1a2440;border:1px solid #2f3e63;min-height:86px}
    .wheel-score-card.is-last{border-color:#27d6c5;box-shadow:0 0 18px rgba(39,214,197,.16)}
    .wheel-score-team{font-weight:900;font-size:15px}
    .wheel-score-card small{color:#27d6c5;font-weight:800}
    .wheel-score-number{font-size:29px;font-weight:1000;margin-top:4px}
    .wheel-score-bar{height:6px;background:#293550;border-radius:8px;overflow:hidden;margin-top:8px}
    .wheel-score-bar i{display:block;height:100%;background:linear-gradient(90deg,#7c5cff,#27d6c5);border-radius:8px;transition:width .35s ease}

    .wheel-center-result{position:absolute;z-index:20;left:50%;top:50%;width:160px;height:160px;transform:translate(-50%,-50%);border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:13px;background:radial-gradient(circle at 35% 24%,#56699f 0,#202c51 42%,#0a1023 100%);border:6px solid #fff;box-shadow:0 0 0 5px rgba(124,92,255,.28),0 0 48px rgba(124,92,255,.98),0 14px 34px rgba(0,0,0,.75);animation:centerExplosion .8s cubic-bezier(.15,1.3,.3,1) both;pointer-events:none}
    .wheel-result-title{font-size:13px;font-weight:900;letter-spacing:1.2px;color:#edf1ff;text-shadow:0 2px 6px #000;line-height:1.1}
    .wheel-result-label{font-size:25px;font-weight:1000;line-height:1.02;margin:7px 0;text-shadow:0 3px 8px #000;white-space:nowrap}
    .wheel-result-effect{font-size:9px;font-weight:800;line-height:1.2;color:#fff;max-width:136px;text-shadow:0 2px 5px #000}
    @keyframes centerExplosion{0%{opacity:0;transform:translate(-50%,-50%) scale(.03);filter:brightness(2.5)}28%{opacity:1;transform:translate(-50%,-50%) scale(1.25);filter:brightness(1.8)}52%{transform:translate(-50%,-50%) scale(.92)}75%{transform:translate(-50%,-50%) scale(1.06)}100%{opacity:1;transform:translate(-50%,-50%) scale(1);filter:brightness(1)}}

    .wheel-result-burst{position:absolute;z-index:19;left:50%;top:50%;width:1px;height:1px;pointer-events:none}
    .wheel-result-burst i{position:absolute;left:0;top:0;width:6px;height:28px;border-radius:5px;background:#fff;box-shadow:0 0 13px rgba(255,255,255,.95);transform-origin:50% 0;animation:burstRay .85s cubic-bezier(.1,.8,.2,1) both}
    .wheel-result-burst i:nth-child(3n){background:#ffd166}.wheel-result-burst i:nth-child(3n+1){background:#27d6c5}
    @keyframes burstRay{0%{opacity:0;transform:rotate(var(--angle)) translateY(0) scale(.15)}35%{opacity:1}100%{opacity:0;transform:rotate(var(--angle)) translateY(calc(var(--distance) * -1)) scale(1)}}

    @media(max-width:920px){.wheel-scoreboard{grid-template-columns:1fr 1fr}}
    @media(max-width:700px){.wheel-label-fixed{transform:rotate(var(--angle)) translateY(-113px)!important}.wheel-scoreboard{grid-template-columns:1fr}.wheel-center-result{width:140px;height:140px}.wheel-result-label{font-size:22px}.wheel-result-effect{font-size:8px;max-width:116px}}
  `;
  document.head.appendChild(style);

  addScoreboard();
  renderWheel();
  updateStatus();
  updateWheelScoreboard();
})();
