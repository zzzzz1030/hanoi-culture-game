/* VÒNG QUAY - HIỂN THỊ KẾT QUẢ Ở GIỮA VÒNG QUAY */
(function(){
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

    // Xóa kết quả cũ khỏi tâm vòng quay khi bắt đầu lượt mới.
    const oldCenter=wheel.querySelector('.wheel-center-result');
    if(oldCenter) oldCenter.remove();

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

      // Cập nhật điểm và tạo thông báo kết quả.
      applyWheelItem(item);
      const effectText=result.textContent;

      wheel.classList.remove('spinning');
      if(shell) shell.classList.remove('spin-flash');
      button.disabled=false;
      button.textContent='🎡 QUAY';
      spinning=false;

      // Hiển thị kết quả NGAY TRONG TÂM vòng quay.
      const center=document.createElement('div');
      center.className='wheel-center-result';
      center.innerHTML=`
        <div class="wheel-result-title">🎯 KẾT QUẢ</div>
        <div class="wheel-result-label">${item.label.replace(/\n/g,'<br>')}</div>
        <div class="wheel-result-effect">${effectText}</div>
      `;
      wheel.appendChild(center);

      // Kết quả vẫn được giữ ở ô bên dưới để không mất thông tin.
      result.classList.add('result-win');
    },5750);
  };
})();
