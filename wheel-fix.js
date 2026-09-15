/* VÒNG QUAY - KẾT QUẢ LỚN + HIỆU ỨNG NỔ */
(function(){
  function burst(wheel){
    const burst=document.createElement('div');
    burst.className='wheel-result-burst';
    for(let i=0;i<24;i++){
      const p=document.createElement('i');
      const angle=(360/24)*i;
      p.style.setProperty('--angle',angle+'deg');
      p.style.setProperty('--distance',(105+Math.random()*45)+'px');
      burst.appendChild(p);
    }
    wheel.appendChild(burst);
    setTimeout(()=>burst.remove(),900);
  }

  window.spinWheel = function(){
    if(spinning) return;
    spinning=true;

    const button=document.getElementById('spinButton');
    const wheel=document.getElementById('prizeWheel');
    const shell=document.querySelector('.wheel-shell');
    const result=document.getElementById('wheelResult');
    if(!button || !wheel || !result){ spinning=false; return; }

    button.disabled=true;
    button.textContent='⏳ ĐANG QUAY...';
    wheel.classList.add('spinning');
    if(shell) shell.classList.add('spin-flash');

    const oldCenter=wheel.querySelector('.wheel-center-result');
    if(oldCenter) oldCenter.remove();
    const oldBurst=wheel.querySelector('.wheel-result-burst');
    if(oldBurst) oldBurst.remove();

    const index=Math.floor(Math.random()*wheelItems.length);
    const slice=360/wheelItems.length;
    const targetCenter=index*slice+slice/2;
    const normalized=(360-targetCenter+360)%360;
    const fullTurns=6+Math.floor(Math.random()*3);
    rotation += 360*fullTurns + normalized;

    requestAnimationFrame(()=>{
      requestAnimationFrame(()=>{
        wheel.style.transform=`rotate(${rotation}deg)`;
      });
    });

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
      center.innerHTML=`
        <div class="wheel-result-title">🎯 KẾT QUẢ</div>
        <div class="wheel-result-label">${item.label.replace(/\n/g,'<br>')}</div>
        <div class="wheel-result-effect">${effectText}</div>
      `;
      wheel.appendChild(center);
      burst(wheel);
      result.classList.add('result-win');
    },5750);
  };

  // CSS bổ sung cho kết quả trung tâm và hiệu ứng nổ.
  const style=document.createElement('style');
  style.textContent=`
    .wheel-center-result{
      position:absolute;z-index:20;left:50%;top:50%;
      width:158px;height:158px;transform:translate(-50%,-50%);
      border-radius:50%;display:flex;flex-direction:column;
      align-items:center;justify-content:center;text-align:center;
      padding:14px;background:radial-gradient(circle at 35% 28%,#39466f 0,#171f3a 48%,#0d1327 100%);
      border:6px solid #fff;box-shadow:0 0 0 5px rgba(124,92,255,.22),0 0 38px rgba(124,92,255,.95),0 12px 30px rgba(0,0,0,.65);
      animation:centerExplosion .75s cubic-bezier(.16,1.25,.3,1) both;pointer-events:none;
    }
    .wheel-result-title{font-size:13px;font-weight:900;letter-spacing:1px;color:#dce3ff;text-shadow:0 2px 5px #000;line-height:1.1}
    .wheel-result-label{font-size:27px;font-weight:1000;line-height:1.02;margin:7px 0;text-shadow:0 3px 8px #000;white-space:nowrap}
    .wheel-result-effect{font-size:10px;font-weight:800;line-height:1.15;color:#fff;max-width:135px;text-shadow:0 2px 4px #000}
    @keyframes centerExplosion{
      0%{opacity:0;transform:translate(-50%,-50%) scale(.05);filter:brightness(2)}
      35%{opacity:1;transform:translate(-50%,-50%) scale(1.18);filter:brightness(1.5)}
      55%{transform:translate(-50%,-50%) scale(.94)}
      78%{transform:translate(-50%,-50%) scale(1.06)}
      100%{opacity:1;transform:translate(-50%,-50%) scale(1);filter:brightness(1)}
    }
    .wheel-result-burst{position:absolute;z-index:19;left:50%;top:50%;width:1px;height:1px;pointer-events:none;animation:burstFade .9s ease-out both}
    .wheel-result-burst i{position:absolute;left:0;top:0;width:7px;height:24px;border-radius:4px;background:#fff;box-shadow:0 0 10px rgba(255,255,255,.9);transform-origin:50% 0;transform:rotate(var(--angle)) translateY(calc(var(--distance) * -1));animation:burstRay .75s cubic-bezier(.1,.8,.2,1) both}
    @keyframes burstRay{0%{opacity:0;transform:rotate(var(--angle)) translateY(0) scale(.2)}45%{opacity:1}100%{opacity:0;transform:rotate(var(--angle)) translateY(calc(var(--distance) * -1)) scale(1)} }
    @keyframes burstFade{0%{opacity:1}100%{opacity:0}}
    @media(max-width:700px){.wheel-center-result{width:145px;height:145px}.wheel-result-label{font-size:24px}.wheel-result-effect{font-size:9px;max-width:122px}}
  `;
  document.head.appendChild(style);
})();
