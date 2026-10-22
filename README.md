# 🎃 Cemetery Catch: Spooky-Kawaii Edition

Un videojuego interactivo web estilo *clicker / arcade* desarrollado con tecnología **HTML5 Canvas** y **JavaScript Vanilla**, ambientado en un cementerio místico procedural con estética pixel art.

---

## 📜 Contexto

El desarrollo de videojuegos web con JavaScript puro utilizando la API de `HTML5 Canvas` permite explorar la renderización gráfica 2D eficiente en tiempo real sin la necesidad de motores externos pesados (como Unity o Phaser). 

**Cemetery Catch** surge de la necesidad de combinar mecánicas clásicas de precisión (*clicker / whack-a-mole*) con un apartado estético *Spooky-Kawaii*, uniendo elementos oscuros y góticos (lápidas, criptas, tinieblas) con un diseño visual tierno y colores armonizados. Además, aborda la integración de audio interactivo y efectos sorpresa (*screamers*) bajo los estrictos estándares de políticas de reproducción multimedia de los navegadores modernos.

---

## 🎯 Objetivo

* **Objetivo Principal:** Desarrollar un videojuego web 2D interactivo, responsivo y dinámico en el que el jugador deba "atrapar" (aplastar) criaturas místicas en un cementerio antes de que sigan proliferando, ofreciendo una experiencia inmersiva mediante respuestas dinámicas de sonido, efectos visuales de partículas y eventos aleatorios.
* **Objetivos Específicos:**
  * Implementar renderizado gráfico procedural en Canvas con escala fija de resolución (`320x180` escalado dinámicamente) para garantizar pixel art nítido (*crisp-edges*).
  * Diseñar un sistema de físicas básico con vectores de movimiento aleatorio y rebote elástico por colisiones circulares entre criaturas.
  * Gestionar correctamente las restricciones de *autoplay* de audio web usando desencadenadores mediante interacción activa del usuario (*Start / Music Button*).
  * Garantizar la adaptabilidad completa del lienzo en distintos tamaños de pantalla mediante un marco proporcional dinámico.

---

## 💡 Justificación

En el desarrollo web actual, es común depender de librerías y frameworks extensos. Este proyecto demuestra el potencial técnico y la eficiencia de utilizar código nativo para manejar:

1. **Rendimiento:** Uso del bucle de renderizado `requestAnimationFrame` para mantener un rendimiento fluido de 60 FPS sin sobrecargar la memoria.
2. **Experiencia de Usuario (UX):** Control personalizado del cursor (varita mágica con estela de partículas `wandSparks`) para sustituir el puntero estándar del sistema operativo y aumentar la inmersión.
3. **Mantenibilidad:** Separación clara de responsabilidades arquitectónicas (estilos CSS, lógica de eventos, sistema de renderizado y lógica de físicas) en archivos modulares.
4. **Diseño Visual Escalable:** Implementación de una paleta cromática coherente (*ghost green, witch purple, pumpkin orange, mistic black*) que equilibra el tono atemorizante con una estética amigable.

---

## 🎮 Operación del Videojuego

### 1. Requisitos e Instalación
No requiere servidores ni compiladores. Únicamente necesitas clonar o descargar el repositorio y abrir `index.html` en cualquier navegador web moderno (Chrome, Edge, Firefox, Safari).

Estructura de carpetas requerida:
```text
/
├── index.html
├── style.css
├── script.js
└── assets/
    ├── terror.mp3
    └── screamer.mp3
