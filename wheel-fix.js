/* VÒNG QUAY - HIỂN THỊ ĐẦY ĐỦ + KẾT QUẢ Ở GIỮA + +10 CHO ĐỘI VỪA TRẢ LỜI ĐÚNG */
(function(){
  let currentQuestionTeam=null;
  let lastCorrectTeam=null;

  const originalRandomPerson=window.randomPerson;
  window.randomPerson=function(){
    const before=history.length;
    originalRandomPerson();
    if(history.length>before) currentQuestionTeam=history[history.length-1].team;
  };

  const originalAnswerQuestion=window.answerQuestion;
  window.answerQuestion=function(i){
    const q=questions[qi];
    const correct=q && i===q.c;
    if(correct && currentQuestionTeam) lastCorrectTeam=currentQuestionTeam;
    originalAnswerQuestion(i);
  };

  const plusTen=wheelItems.find(it=>it.type==='addRandomTarget');
  if(plusTen){
    plusTen.label='🎁 +10\nĐỘI VỪA ĐÚNG';
    plusTen.desc='Đội có thành viên vừa trả lời đúng câu hỏi nhận 10 điểm';
  }

  const originalApplyWheelItem=window.applyWheelItem;
  window.applyWheelItem=function(item){
    if(item && item.type==='addRandomTarget'){
      const target=lastCorrectTeam || currentQuestionTeam;
      const box=document.getElementById('wheelResult');
      if(target){
        scores[target]=clampScore(scores[target]+10);
        save();
        updateScore();
        if(box){
          box.textContent=`🎉 Tổ ${target} có thành viên vừa trả lời đúng và nhận +10 điểm!`;
          box.classList.remove('result-win');
          void box.offsetWidth;
          box.classList.add('result-win');
        }
      }else if(box){
        box.textContent='⚠️ Chưa xác định được đội vừa trả lời đúng.';
        box.classList.remove('result-win');
        void box.offsetWidth;
        box.classList.add('result-win');
      }
      launchConfetti();
      return;
    }
    originalApplyWheelItem(item);
  };

  function renderWheel(){
    const wheel=document.getElementById('prizeWheel');
    const legend=document.getElementById('wheelLegend');
    if(!wheel || !Array.isArray(wheelItems)) return;

    const n=wheelItems.length;
    const slice=360/n;
    wheel.style.background=`conic-gradient(${wheelItems.map((it,i)=>`${it.color} ${i*slice}deg ${(i+1)*slice}deg`).join(',')})`;
    wheel.innerHTML=wheelItems.map((it,i)=>{
      const angle=i*slice+slice/2;
      return `<div class="wheel-label wheel-label-fixed" style="--angle:${angle}deg;--counter-angle:-${angle}deg"><span>${it.label.replace(/\n/g,'<br>')}</span></div>`;
    }).join('');

    if(legend){
      legend.innerHTML=wheelItems.map(it=>`<div class="legend-item"><span class="legend-dot" style="background:${it.color}"></span><div><b>${it.label.replace(/\n/g,' ')}</b><small>${it.desc}</small></div></div>`).join('');
    }
  }

  function burst(wheel){
    const burst=document.createElement('div');
    burst.className='wheel-result-burst';
    for(let i=0;i<28;i++){
      const p=document.createElement('i');
      p.style.setProperty('--angle',(360/28*i)+'deg');
      p.style.setProperty('--distance',(120+Math.random()*65)+'px');
      burst.appendChild(p);
    }
    wheel.appendChild(burst);
    setTimeout(()=>burst.remove(),1100);
  }

  window.spinWheel=function(){
    if(spinning) return;
    spinning=true;
    const button=document.getElementById('spinButton');
    const wheel=document.getElementById('prizeWheel');
    const shell=document.querySelector('.wheel-shell');
    const result=document.getElementById('wheelResult');
    if(!button || !wheel || !result){spinning=false;return;}

    button.disabled=true;
    button.textContent='⏳ ĐANG QUAY...';
    wheel.classList.add('spinning');
    if(shell) shell.classList.add('spin-flash');

    const oldCenter=wheel.querySelector('.wheel-center-result');
    if(oldCenter) oldCenter.remove();
    const oldBurst=wheel.querySelector('.wheel-result-burst');
    if(oldBurst) oldBurst.remove();
    result.textContent='🎡 Vòng quay đang chạy...';

    const index=Math.floor(Math.random()*wheelItems.length);
    const slice=360/wheelItems.length;
    const targetCenter=index*slice+slice/2;
    const normalized=(360-targetCenter+360)%360;
    const fullTurns=6+Math.floor(Math.random()*3);
    rotation+=360*fullTurns+normalized;

    requestAnimationFrame(()=>requestAnimationFrame(()=>{wheel.style.transform=`rotate(${rotation}deg)`;}));

    setTimeout(()=>{
      const item=wheelItems[index];
      applyWheelItem(item);
      const effectText=result.textContent;

      wheel.classList.remove('spinning');
      if(shell) shell.classList.remove('spin-flash');
      button.disabled=false;
      button.textContent='🎡 QUAY';
      spinning=false;

      const center=document.createElement('div');
      center.className='wheel-center-result';
      center.innerHTML=`<div class="wheel-result-title">🎯 KẾT QUẢ</div><div class="wheel-result-label">${item.label.replace(/\n/g,'<br>')}</div><div class="wheel-result-effect">${effectText}</div>`;
      wheel.appendChild(center);
      burst(wheel);
      result.classList.add('result-win');
    },5750);
  };

  const style=document.createElement('style');
  style.textContent=`
    .wheel{position:relative;overflow:hidden}
    .wheel-label-fixed{position:absolute;left:50%;top:50%;width:112px;height:58px;margin-left:-56px;margin-top:-29px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:11px;font-weight:900;line-height:1.08;pointer-events:none;transform:rotate(var(--angle)) translateY(-125px)!important;transform-origin:center center;text-shadow:0 2px 4px #000;z-index:3}
    .wheel-label-fixed span{display:block;transform:rotate(var(--counter-angle));white-space:nowrap}
    .wheel::after{z-index:4}
    .wheel-center-result{position:absolute;z-index:20;left:50%;top:50%;width:148px;height:148px;transform:translate(-50%,-50%);border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:12px;background:radial-gradient(circle at 35% 25%,#495786 0,#1a2342 45%,#0b1125 100%);border:6px solid #fff;box-shadow:0 0 0 5px rgba(124,92,255,.25),0 0 45px rgba(124,92,255,.95),0 10px 30px rgba(0,0,0,.7);animation:centerExplosion .78s cubic-bezier(.15,1.25,.3,1) both;pointer-events:none}
    .wheel-result-title{font-size:12px;font-weight:900;letter-spacing:1px;color:#e7ebff;text-shadow:0 2px 5px #000;line-height:1.1}
    .wheel-result-label{font-size:24px;font-weight:1000;line-height:1.02;margin:6px 0;text-shadow:0 3px 7px #000;white-space:nowrap}
    .wheel-result-effect{font-size:9px;font-weight:800;line-height:1.2;color:#fff;max-width:126px;text-shadow:0 2px 4px #000}
    @keyframes centerExplosion{0%{opacity:0;transform:translate(-50%,-50%) scale(.05);filter:brightness(2)}30%{opacity:1;transform:translate(-50%,-50%) scale(1.2);filter:brightness(1.6)}55%{transform:translate(-50%,-50%) scale(.94)}78%{transform:translate(-50%,-50%) scale(1.05)}100%{opacity:1;transform:translate(-50%,-50%) scale(1);filter:brightness(1)}}
    .wheel-result-burst{position:absolute;z-index:19;left:50%;top:50%;width:1px;height:1px;pointer-events:none}
    .wheel-result-burst i{position:absolute;left:0;top:0;width:6px;height:26px;border-radius:4px;background:#fff;box-shadow:0 0 12px rgba(255,255,255,.95);transform-origin:50% 0;animation:burstRay .8s cubic-bezier(.1,.8,.2,1) both}
    .wheel-result-burst i:nth-child(3n){background:#ffd166}.wheel-result-burst i:nth-child(3n+1){background:#27d6c5}
    @keyframes burstRay{0%{opacity:0;transform:rotate(var(--angle)) translateY(0) scale(.15)}35%{opacity:1}100%{opacity:0;transform:rotate(var(--angle)) translateY(calc(var(--distance) * -1)) scale(1)}}
    @media(max-width:700px){.wheel-label-fixed{transform:rotate(var(--angle)) translateY(-113px)!important}.wheel-center-result{width:138px;height:138px}.wheel-result-label{font-size:22px}.wheel-result-effect{font-size:8px;max-width:116px}}
  `;
  document.head.appendChild(style);
  renderWheel();
})();
