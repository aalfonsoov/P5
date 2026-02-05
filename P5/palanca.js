/* =====================
   CONTROL DE PALANCA ROTATIVA
===================== */

const leverControl = (() => {
  const lever = document.getElementById('lever-overlay');
  if (!lever) return;

  // Configuración
  const maxRotationAngle = 35; // Máximo ángulo de rotación en grados
  const rotationSmoothing = 8; // Suavidad de la animación

  // Estado
  let currentRotation = { x: 0, y: 0 };
  let targetRotation = { x: 0, y: 0 };
  let lastFrameTime = Date.now();

  // Calcular ángulo basado en posición del ratón
  const getRotationAngle = () => {
    // Centro de la pantalla
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Normalizar posición del ratón de -1 a 1
    const normalizedX = (event.clientX - centerX) / (window.innerWidth / 2);
    const normalizedY = (event.clientY - centerY) / (window.innerHeight / 2);

    // Calcular ángulos (limitados entre -maxRotationAngle y +maxRotationAngle)
    return {
      x: -normalizedY * maxRotationAngle, // Rotación en eje X (arriba/abajo)
      y: normalizedX * maxRotationAngle   // Rotación en eje Y (izquierda/derecha)
    };
  };

  // Aplicar rotación a la palanca
  const applyRotation = (angleX, angleY) => {
    // Usar perspectiva 3D para simular mejor el movimiento
    // rotateY para girar en el eje Y (de izquierda a derecha)
    // rotateX para girar en el eje X (arriba/abajo)
    lever.style.transform = `perspective(600px) rotateX(${angleX * 0.8}deg) rotateY(${angleY * 0.8}deg) rotateZ(${angleY * 0.3}deg)`;
  };

  // Suavizar animación
  const smoothAnimation = () => {
    const now = Date.now();
    const dt = (now - lastFrameTime) / 1000;
    lastFrameTime = now;

    // Suavizado exponencial
    const alpha = 1 - Math.exp(-rotationSmoothing * dt);
    currentRotation.x += (targetRotation.x - currentRotation.x) * alpha;
    currentRotation.y += (targetRotation.y - currentRotation.y) * alpha;

    applyRotation(currentRotation.x, currentRotation.y);
    requestAnimationFrame(smoothAnimation);
  };

  // Event listeners
  document.addEventListener('mousemove', (e) => {
    targetRotation = getRotationAngle();
  });

  // Volver a posición neutral cuando el ratón sale
  document.addEventListener('mouseleave', () => {
    targetRotation = { x: 0, y: 0 };
  });

  // Iniciar animación
  smoothAnimation();
})();
