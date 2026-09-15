/* BẢNG ĐIỂM - CẬP NHẬT THEO SCORES LƯU TRONG localStorage */
(function(){
  window.updateScore = function(){
    const board = document.getElementById('scoreBoard');
    if(!board || typeof scores === 'undefined') return;

    const data = [1,2,3,4].map(t => ({
      team:t,
      score:Number(scores[t]) || 0
    }));
    const maxScore = Math.max(10, ...data.map(x=>x.score));
    const highest = Math.max(...data.map(x=>x.score));

    board.innerHTML = data.map(x => {
      const leading = highest > 0 && x.score === highest;
      const pct = Math.min(100, x.score / maxScore * 100);
      return `<div class="score-card ${leading?'leading':''}">
        <div>
          <h2>🏆 Tổ ${x.team}</h2>
          ${leading ? '<div class="ok">⭐ Đang dẫn đầu</div>' : ''}
        </div>
        <div>
          <div class="score-value">${x.score}</div>
          <div class="progress"><i style="width:${pct}%"></i></div>
        </div>
      </div>`;
    }).join('');
  };
})();
