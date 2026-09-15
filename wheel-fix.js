/* VÒNG QUAY - HIỂN THỊ Ô + KẾT QUẢ Ở GIỮA + HIỆU ỨNG NỔ */
(function(){
  function renderWheel(){
    const wheel=document.getElementById('prizeWheel');
    const legend=document.getElementById('wheelLegend');
    if(!wheel || !Array.isArray(wheelItems)) return;

    const n=wheelItems.length;
    const slice=360/n;
    const gradient=wheelItems.map((it,i)=>`${it.color} ${i*slice}deg ${(i+1)*slice}deg`).join(',');
    wheel.style.background=`conic-gradient(${gradient})`;

    wheel.innerHTML=wheelItems.map((it,i)=>{
      const angle=i*slice+slice/2;
      return `<div class="wheel-label wheel-label-fixed" style="--angle:${angle}deg"><span>${it.label.replace(/\n/g,'<br>')}</span></div>`;
    }).join('');

    if(legend){
      legend.innerHTML=wheelItems.map(it=>`
        <div class="legend-item">
          <span class="legend-dot" style="background:${it.color}"></span>
          <div><b>${it.label.replace(/\n/g,' ')}</b><small>${it.desc}</small></div>
        </div>`).join('');
    }
  }

  function burst(wheel){
    const burst=document.createElement('div');
    burst.className='wheel-result-burst';
    for(let i=0;i<28;i++){
      const p=document.createElement('i');
      p.style.setProperty('--angle',(360/28*i)+'deg');
      p.style.setProperty('--distance',(120+Math.random()*55)+'px');
      p.style.setProperty('--delay',(Math.random()*.08)+'s');
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

    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      wheel.style.transform=`rotate(${rotation}deg)`;
    }));

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

  const style=document.createElement('style');
  style.textContent=`
    .wheel-label-fixed{
      position:absolute;left:50%;top:50%;width:112px;height:58px;
      margin-left:-56px;margin-top:-29px;
      display:flex;align-items:center;justify-content:center;
      transform:rotate(var(--angle)) translateY(-125px);
      transform-origin:50% 50%;
      text-align:center;line-height:1.12;
      font-size:12px;font-weight:900;color:#fff;
      z-index:6;pointer-events:none;text-shadow:0 2px 4px #000;
    }
    .wheel-label-fixed span{display:block;transform:rotate(calc(var(--angle) * -1));max-width:108px}
    .wheel-center-result{
      position:absolute;z-index:20;left:50%;top:50%;
      width:158px;height:158px;transform:translate(-50%,-50%);
      border-radius:50%;display:flex;flex-direction:column;
      align-items:center;justify-content:center;text-align:center;padding:14px;
      background:radial-gradient(circle at 35% 28%,#4b5d91 0,#1a2443 46%,#0b1124 100%);
      border:6px solid #fff;
      box-shadow:0 0 0 5px rgba(124,92,255,.25),0 0 42px rgba(124,92,255,.95),0 12px 30px rgba(0,0,0,.7);
      animation:centerExplosion .78s cubic-bezier(.16,1.3,.3,1) both;
      pointer-events:none;
    }
    .wheel-result-title{font-size:14px;font-weight:950;letter-spacing:1px;color:#eef1ff;text-shadow:0 2px 5px #000;line-height:1.1}
    .wheel-result-label{font-size:26px;font-weight:1000;line-height:1.02;margin:7px 0;text-shadow:0 3px 8px #000;white-space:nowrap}
    .wheel-result-effect{font-size:10px;font-weight:800;line-height:1.15;color:#fff;max-width:138px;text-shadow:0 2px 4px #000}
    @keyframes centerExplosion{
      0%{opacity:0;transform:translate(-50%,-50%) scale(.05);filter:brightness(2)}
      30%{opacity:1;transform:translate(-50%,-50%) scale(1.23);filter:brightness(1.7)}
      52%{transform:translate(-50%,-50%) scale(.91)}
      75%{transform:translate(-50%,-50%) scale(1.07)}
      100%{opacity:1;transform:translate(-50%,-50%) scale(1);filter:brightness(1)}
    }
    .wheel-result-burst{position:absolute;z-index:19;left:50%;top:50%;width:1px;height:1px;pointer-events:none}
    .wheel-result-burst i{
      position:absolute;left:0;top:0;width:7px;height:30px;border-radius:4px;
      background:#fff;box-shadow:0 0 12px rgba(255,255,255,.95);
      transform-origin:50% 0;animation:burstRay .82s cubic-bezier(.1,.85,.2,1) var(--delay) both;
    }
    @keyframes burstRay{
      0%{opacity:0;transform:rotate(var(--angle)) translateY(0) scale(.15)}
      30%{opacity:1}
      100%{opacity:0;transform:rotate(var(--angle)) translateY(calc(var(--distance) * -1)) scale(1)}
    }
    @media(max-width:700px){
      .wheel-label-fixed{width:102px;margin-left:-51px;font-size:10px;transform:rotate(var(--angle)) translateY(-119px)}
      .wheel-center-result{width:145px;height:145px}
      .wheel-result-label{font-size:23px}
      .wheel-result-effect{font-size:9px;max-width:123px}
    }
  `;
  document.head.appendChild(style);

  // app.js chạy buildWheel() trước file này, nên render lại để sửa vị trí nhãn chắc chắn.
  renderWheel();
})();
