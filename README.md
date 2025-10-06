<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>Star Catcher – Mobile HTML5 Game</title>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <style>
    :root { color-scheme: dark light; }
    * { box-sizing: border-box; }
    html, body { height: 100%; }
    body {
      margin: 0;
      background: #0e1320;
      display: grid;
      place-items: center;
      font-family: system-ui, Arial, sans-serif;
      padding-bottom: env(safe-area-inset-bottom, 0);
      padding-top: env(safe-area-inset-top, 0);
      padding-left: env(safe-area-inset-left, 0);
      padding-right: env(safe-area-inset-right, 0);
    }
    #wrap {
      width: min(100vw, 920px);
      aspect-ratio: 9 / 16;
      position: relative;
    }
    canvas {
      width: 100%;
      height: 100%;
      display: block;
      background: radial-gradient(120% 100% at 50% 0%, #23345c 0%, #0e1320 70%);
      border-radius: 14px;
      box-shadow: 0 10px 30px rgba(0,0,0,.35);
      touch-action: none;
    }
    .hud {
      position: absolute;
      left: 10px;
      top: 10px;
      padding: .4rem .6rem;
      border-radius: 10px;
      background: rgba(0,0,0,.35);
      color: #fff;
      font-weight: 600;
      letter-spacing: .3px;
      user-select: none;
      pointer-events: none;
    }
    .hint {
      position: absolute;
      bottom: calc(12px + env(safe-area-inset-bottom, 0));
      left: 50%;
      transform: translateX(-50%);
      padding: .5rem .9rem;
      border-radius: 999px;
      background: rgba(0,0,0,.4);
      color: #fff;
      font-weight: 600;
      letter-spacing: .3px;
      user-select: none;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div id="wrap">
    <canvas id="game" width="540" height="960"></canvas>
    <div class="hud" id="hud">Score: 0</div>
    <div class="hint" id="hint">Tippen/ziehen: Bewegen • Sammle Sterne, meide Bomben</div>
  </div>

  <script>
  (() => {
    const W = 540, H = 960;
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    function setupDPR() {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    setupDPR();
    window.addEventListener('resize', setupDPR);

    const state = {
      mode: 'ready',
      score: 0,
      best: Number(localStorage.getItem('bestStarScore') || 0),
      spawnStar: 0,
      spawnBomb: 0,
      time: 0,
      wakeLock: null
    };

    const player = { x: W/2, y: H - 120, r: 26, speed: 900 };
    const stars = [];
    const bombs = [];
    const poolStar = [];
    const poolBomb = [];

    function makeStar() {
      const o = poolStar.pop() || { x:0,y:0,r:12,v:0,a:0,alive:false,t:0 };
      o.x = 30 + Math.random()*(W-60);
      o.y = -20;
      o.r = 11 + Math.random()*6;
      o.v = 220 + Math.random()*120 + Math.min(260, state.score*0.3);
      o.a = 0.25 + Math.random()*0.35;
      o.t = 0;
      o.alive = true;
      stars.push(o);
    }
    function makeBomb() {
      const o = poolBomb.pop() || { x:0,y:0,r:18,v:0,alive:false,spin:0,ang:0 };
      o.x = 30 + Math.random()*(W-60);
      o.y = -24;
      o.r = 16 + Math.random()*8;
      o.v = 260 + Math.random()*160 + Math.min(280, state.score*0.35);
      o.spin = (Math.random() > .5 ? 1 : -1) * (2 + Math.random()*3);
      o.ang = 0;
      o.alive = true;
      bombs.push(o);
    }

    function dist2(ax,ay,bx,by){ const dx=ax-bx, dy=ay-by; return dx*dx+dy*dy; }

    // Input (Pointer + Touch)
    let activePointer = null;
    function toLocal(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left) * (W / rect.width);
      const y = (clientY - rect.top) * (H / rect.height);
      return { x, y };
    }
    async function ensureWakeLock() {
      try {
        if (!state.wakeLock && 'wakeLock' in navigator) {
          state.wakeLock = await navigator.wakeLock.request('screen');
          state.wakeLock.addEventListener('release', () => { state.wakeLock = null; });
          document.addEventListener('visibilitychange', async () => {
            if (document.visibilityState === 'visible' && !state.wakeLock) {
              try { state.wakeLock = await navigator.wakeLock.request('screen'); } catch {}
            }
          });
        }
      } catch {}
    }
    function tapStart(x, y) {
      if (state.mode === 'ready') { state.mode = 'play'; state.score = 0; state.time = 0; document.getElementById('hint').textContent = 'Sammle Sterne • Meide Bomben'; ensureWakeLock(); }
      else if (state.mode === 'gameover') { reset(); ensureWakeLock(); }
      player.x = x;
    }
    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') e.preventDefault();
      activePointer = e.pointerId;
      const p = toLocal(e.clientX, e.clientY);
      tapStart(p.x, p.y);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (activePointer !== e.pointerId) return;
      if (e.pointerType === 'touch') e.preventDefault();
      const p = toLocal(e.clientX, e.clientY);
      player.x = p.x;
    });
    canvas.addEventListener('pointerup', (e) => {
      if (activePointer === e.pointerId) activePointer = null;
    });
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        if (state.mode !== 'play') { state.mode = 'play'; state.score = 0; state.time = 0; document.getElementById('hint').textContent = 'Sammle Sterne • Meide Bomben'; ensureWakeLock(); }
      }
      if (e.code === 'ArrowLeft') player.x -= 40;
      if (e.code === 'ArrowRight') player.x += 40;
    });

    function reset() {
      state.mode = 'ready';
      stars.forEach(s => { s.alive=false; poolStar.push(s); });
      bombs.forEach(b => { b.alive=false; poolBomb.push(b); });
      stars.length = 0; bombs.length = 0;
      player.x = W/2; player.y = H - 120;
      document.getElementById('hint').textContent = 'Tippen/ziehen: Bewegen • Sammle Sterne, meide Bomben';
    }

    // Render Helpers
    function drawPlayer() {
      // Glow
      const g = ctx.createRadialGradient(player.x, player.y, 6, player.x, player.y, 44);
      g.addColorStop(0, 'rgba(0, 220, 255, .9)');
      g.addColorStop(1, 'rgba(0, 220, 255, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 44, 0, Math.PI*2);
      ctx.fill();
      // Körper
      ctx.fillStyle = '#00d4ff';
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r, 0, Math.PI*2);
      ctx.fill();
      // Akzent
      ctx.fillStyle = '#bff5ff';
      ctx.beginPath();
      ctx.arc(player.x+8, player.y-8, 6, 0, Math.PI*2);
      ctx.fill();
    }
    function drawStar(s) {
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = '#ffd84a';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }
    function drawBomb(b) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.ang);
      ctx.fillStyle = '#ff4a60';
      ctx.beginPath();
      ctx.arc(0, 0, b.r, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#ff9aa7';
      ctx.fillRect(-b.r*0.6, -b.r*1.4, b.r*1.2, b.r*0.5);
      ctx.restore();
    }
    function drawHUD() {
      const hud = document.getElementById('hud');
      hud.textContent = `Score: ${Math.floor(state.score)}  •  Best: ${state.best}`;
      if (state.mode === 'gameover') {
        ctx.fillStyle = 'rgba(0,0,0,.55)';
        ctx.fillRect(0,0,W,H);
        ctx.fillStyle = '#ffecf0';
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px system-ui, Arial';
        ctx.fillText('Game Over', W/2, H/2 - 40);
        ctx.font = '20px system-ui, Arial';
        ctx.fillText(`Score: ${Math.floor(state.score)}  •  Best: ${state.best}`, W/2, H/2);
        ctx.font = '18px system-ui, Arial';
        ctx.fillText('Tippen: Neustart', W/2, H/2 + 34);
        ctx.textAlign = 'start';
      }
    }

    // Hauptloop
    let last = performance.now();
    function loop(now = performance.now()) {
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.033) dt = 0.033;

      // Update
      if (state.mode === 'play') {
        state.time += dt;
        state.score += dt * 60;

        state.spawnStar -= dt;
        if (state.spawnStar <= 0) {
          makeStar();
          state.spawnStar = 0.25 + Math.random()*0.35;
        }
        state.spawnBomb -= dt;
        if (state.spawnBomb <= 0) {
          makeBomb();
          state.spawnBomb = 0.9 + Math.random()*0.9;
        }

        player.x = Math.max(24, Math.min(W-24, player.x));

        for (let i=stars.length-1; i>=0; i--) {
          const s = stars[i];
          s.t += dt;
          s.y += s.v * dt;
          s.r += Math.sin(s.t*6)*0.02;
          if (s.y - s.r > H + 20) { s.alive=false; poolStar.push(s); stars.splice(i,1); continue; }
          const rsum = player.r + s.r;
          if (dist2(player.x, player.y, s.x, s.y) < rsum*rsum) {
            state.score += 50;
            s.alive=false; poolStar.push(s); stars.splice(i,1);
          }
        }
        for (let i=bombs.length-1; i>=0; i--) {
          const b = bombs[i];
          b.y += b.v * dt;
          b.ang += b.spin * dt;
          if (b.y - b.r > H + 30) { b.alive=false; poolBomb.push(b); bombs.splice(i,1); continue; }
          const rsum = player.r + b.r*0.9;
          if (dist2(player.x, player.y, b.x, b.y) < rsum*rsum) {
            state.mode = 'gameover';
            state.best = Math.max(state.best, Math.floor(state.score));
            localStorage.setItem('bestStarScore', state.best);
            break;
          }
        }
      }

      // Render
      ctx.clearRect(0,0,W,H);

      // Sterne-Funkeln Hintergrund
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#9ad0ff';
      for (let i=0; i<30; i++) {
        const x = (i*97 % W);
        const y = (i*173 % H);
        ctx.fillRect(x, y, 2, 2);
      }
      ctx.restore();

      // Entities
      drawPlayer();
      stars.forEach(drawStar);
      bombs.forEach(drawBomb);
      drawHUD();

      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  })();
  </script>
</body>
</html>
