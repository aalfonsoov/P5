const sketch = (p) => {
  let raindrops = [];

  /* =====================
     CONFIGURACIÓN
  ===================== */

  const RAINDROP_COUNT = 1224;

  // Reposo
  const idleSpeed = 2;
  const idleJitter = 0.01;

  // Hiperespacio progresivo
  const holdThresholdMs = 500;
  const accelPerSecond = 40;
  const hyperMaxSpeed = 30;

  // Suavidad
  const speedSmoothing = 10;

  // Control de scroll
  const scrollSensitivity = 0.5; // Cuánto cambia la velocidad por scroll

  /* =====================
     ESTADO
  ===================== */

  let pressStartMs = null;
  let isHolding = false;

  let speedCurrent = idleSpeed;
  let speedTarget = idleSpeed;

  /* =====================
     UTILIDADES
  ===================== */

  function makeRaindrop() {
    return {
      x: p.random(-p.width, p.width),
      y: p.random(-p.height, p.height),
      z: p.random(p.width * 0.3, p.width),
      pz: 0,
      length: p.random(15, 35)
    };
  }

  function resetRaindrop(r) {
    r.x = p.random(-p.width * 1.5, p.width * 1.5);
    r.y = p.random(-p.height * 1.5, p.height * 1.5);
    r.z = p.width;
    r.pz = r.z;
    r.length = p.random(15, 35);
  }

  function setPressState(down) {
    if (down) {
      pressStartMs = p.millis();
      isHolding = true;
    } else {
      pressStartMs = null;
      isHolding = false;
      speedTarget = idleSpeed;
    }
  }

  /* =====================
     SETUP
  ===================== */

  p.setup = () => {
    const c = p.createCanvas(p.windowWidth * 0.3333, p.windowHeight);
    c.parent("p5-holder");
    p.pixelDensity(1);

    raindrops = [];
    for (let i = 0; i < RAINDROP_COUNT; i++) {
      raindrops.push(makeRaindrop());
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth * 0.3333, p.windowHeight);
    raindrops.forEach(resetRaindrop);
  };

  /* =====================
     INPUT
  ===================== */

  p.mousePressed = () => setPressState(true);
  p.mouseReleased = () => setPressState(false);
  p.touchStarted = () => { setPressState(true); return false; };
  p.touchEnded   = () => { setPressState(false); return false; };

  // Control de velocidad con scroll
  document.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    // Cambiar velocidad según dirección del scroll
    const scrollDelta = e.deltaY > 0 ? -scrollSensitivity : scrollSensitivity;
    speedTarget = Math.max(idleSpeed, Math.min(hyperMaxSpeed, speedTarget + scrollDelta));
  }, { passive: false });

  /* =====================
     DRAW
  ===================== */

  p.draw = () => {
    const dt = Math.min(0.05, (p.deltaTime || 16.67) / 1000);

    p.clear();

    // Velocidad objetivo
    if (isHolding && pressStartMs !== null) {
      const heldMs = p.millis() - pressStartMs;
      if (heldMs >= holdThresholdMs) {
        const t = (heldMs - holdThresholdMs) / 1000;
        speedTarget = Math.min(
          hyperMaxSpeed,
          idleSpeed + t * accelPerSecond
        );
      } else {
        speedTarget = idleSpeed;
      }
    } else if (!isHolding) {
      // Usar el valor actual de speedTarget (controlado por scroll)
      // No resetear a idleSpeed si no se está presionando
    }

    // Suavizado exponencial
    const a = 1 - Math.exp(-speedSmoothing * dt);
    speedCurrent += (speedTarget - speedCurrent) * a;

    const cx = p.width * 0.5;
    const cy = p.height * 0.667; // Punto de fuga en tercio inferior

    p.push();
    p.translate(cx, cy);

    for (let i = 0; i < raindrops.length; i++) {
      const r = raindrops[i];

      // Posición perspectiva basada en profundidad (z)
      const sx = (r.x / r.z) * p.width;
      const sy = (r.y / r.z) * p.height;

      // Calcular distancia desde el centro para efecto de profundidad
      const distFromCenter = Math.sqrt(sx * sx + sy * sy);
      const maxDist = Math.sqrt(p.width * p.width + p.height * p.height) / 2 * 0.55;
      
      // Mapear distancia a profundidad: centro = lejano, exterior = cercano
      const depthFromDistance = p.map(distFromCenter, 0, maxDist, p.width, p.width * 0.2);
      const alpha = p.map(depthFromDistance, p.width * 0.3, p.width, 200, 80);
      const size = p.map(depthFromDistance, p.width * 0.3, p.width, 8, 1.5);
      
      p.stroke(200, 210, 220, alpha);
      p.strokeWeight(p.map(size, 1.5, 8, 0.2, 1.2));
      p.fill(220, 230, 240, alpha * 0.7);

      // Dibujar gota de lluvia redondeada
      p.ellipse(sx, sy, size * 0.6, size * 1.3);

      // Movimiento hacia el espectador (eje z)
      r.pz = r.z;
      r.z -= (speedCurrent > 0 ? speedCurrent : idleSpeed) * (dt * 60);

      // Pequeño movimiento horizontal
      r.x += (p.noise(i * 0.01, p.frameCount * 0.01) - 0.5) * idleJitter * 5;
      r.y += (p.noise(100 + i * 0.01, p.frameCount * 0.01) - 0.5) * idleJitter * 5;

      // Resetear si se acerca demasiado (siempre mantener lluvia constante)
      if (r.z < 1) {
        resetRaindrop(r);
      }
    }

    p.pop();
  };
};

new p5(sketch);
