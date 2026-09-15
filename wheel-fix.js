/* VÒNG QUAY - HIỂN THỊ KẾT QUẢ ỔN ĐỊNH */
(function(){
  const originalBuildWheel = window.buildWheel;

  function showWheelResult(item, effectText){
    const box = document.getElementById('wheelResult');
    if(!box) return;

    const label = item.label.replace(/\n/g, ' ');
    box.innerHTML = `
      <div style="font-size:16px;color:#99a5bf;margin-bottom:6px">🎯 KẾT QUẢ VÒNG QUAY</div>
      <div style="font-size:30px;font-weight:900;margin:6px 0">${label}</div>
      <div style="font-size:20px;font-weight:700">${effectText || ''}</div>
    `;
    box.classList.remove('result-win');
    void box.offsetWidth;
    box.classList.add('result-win');

    // Đảm bảo người chơi nhìn thấy kết quả ngay cả khi màn hình nhỏ.
    box.scrollIntoView({behavior:'smooth', block:'center'});
  }

  window.spinWheel = function(){
    if(window.spinning) return;
    window.spinning = true;

    const button = document.getElementById('spinButton');
    const wheel = document.getElementById('prizeWheel');
    const shell = document.querySelector('.wheel-shell');
    const box = document.getElementById('wheelResult');

    if(!button || !wheel || !box){
      window.spinning = false;
      return;
    }

    button.disabled = true;
    button.textContent = '⏳ ĐANG QUAY...';
    wheel.classList.add('spinning');
    if(shell) shell.classList.add('spin-flash');

    box.innerHTML = '<div style="font-size:24px;font-weight:800">🎡 Đang quay...</div>';

    const index = Math.floor(Math.random() * wheelItems.length);
    const slice = 360 / wheelItems.length;
    const targetCenter = index * slice + slice / 2;
    const normalized = (360 - targetCenter + 360) % 360;
    const fullTurns = 6 + Math.floor(Math.random() * 3);

    rotation += 360 * fullTurns + normalized;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        wheel.style.transform = `rotate(${rotation}deg)`;
      });
    });

    // CSS transition là 5.5s; chờ dư một chút để chắc chắn vòng quay kết thúc.
    setTimeout(() => {
      const item = wheelItems[index];

      // applyWheelItem cập nhật điểm + tạo nội dung kết quả cơ bản.
      applyWheelItem(item);
      const effectText = box.textContent;

      wheel.classList.remove('spinning');
      if(shell) shell.classList.remove('spin-flash');
      button.disabled = false;
      button.textContent = '🎡 QUAY';
      window.spinning = false;

      // Ghi đè lại bằng giao diện kết quả rõ ràng, không phụ thuộc animation.
      showWheelResult(item, effectText);
    }, 5750);
  };
})();
