// Wires the page: pick photos per panel, drag a panel to move its photo, type the caption,
// choose a layout, a grade and an export size, and save the cover as a PNG. A `?shot=`
// query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, layoutPanels, panelAt, panelCount } from './cover.js';
import { runShot } from './shots.js';

const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const status = document.getElementById('status');
const panelBox = document.getElementById('panels');
const sizeSelect = document.getElementById('size');

const state = {
  layout: 'hero',
  grade: 'sunset',
  caption: 'VICE NIGHTS',
  captionColor: '#ffffff',
  panels: [
    { img: null, zoom: 1, ox: 0, oy: 0 },
    { img: null, zoom: 1, ox: 0, oy: 0 },
    { img: null, zoom: 1, ox: 0, oy: 0 },
    { img: null, zoom: 1, ox: 0, oy: 0 },
  ],
};

let fontsReady = false;
document.fonts.load('100px Anton').then(() => { fontsReady = true; redraw(); });
document.fonts.ready.then(() => { fontsReady = true; redraw(); });

function redraw() {
  if (!fontsReady) {
    // Draw once with the fallback font so the page never looks blank, then again
    // in Anton once it loads.
    drawCover(canvas, state);
    return;
  }
  drawCover(canvas, state);
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Builds the per-panel photo rows (file input, sample buttons, zoom slider). */
function buildPanelRows() {
  panelBox.innerHTML = '';
  const count = panelCount(state.layout);
  for (let i = 0; i < count; i++) {
    const row = document.createElement('div');
    row.className = 'panel-row';
    row.innerHTML = `
      <span class="panel-name">Panel ${i + 1}</span>
      <label>Photo <input type="file" accept="image/*" data-panel="${i}"></label>
      <span class="sample-buttons">
        <button type="button" data-sample="boulevard" data-panel="${i}">Boulevard</button>
        <button type="button" data-sample="pier" data-panel="${i}">Pier</button>
      </span>
      <label>Zoom <input type="range" min="1" max="2.5" step="0.05" value="${state.panels[i].zoom}" data-zoom="${i}"></label>`;
    panelBox.appendChild(row);
  }
  panelBox.querySelectorAll('input[type=file]').forEach((input) => {
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const i = Number(e.target.dataset.panel);
      state.panels[i].img = await loadImage(URL.createObjectURL(file));
      state.panels[i].ox = 0;
      state.panels[i].oy = 0;
      redraw();
    });
  });
  panelBox.querySelectorAll('[data-sample]').forEach((button) => {
    button.addEventListener('click', async () => {
      const i = Number(button.dataset.panel);
      state.panels[i].img = await loadImage(`samples/${button.dataset.sample}.jpg`);
      state.panels[i].ox = 0;
      state.panels[i].oy = 0;
      redraw();
    });
  });
  panelBox.querySelectorAll('[data-zoom]').forEach((slider) => {
    slider.addEventListener('input', () => {
      state.panels[Number(slider.dataset.zoom)].zoom = Number(slider.value);
      redraw();
    });
  });
}

/** Applies the chosen export size to the preview canvas. */
function applySize() {
  const [w, h] = SIZES[sizeSelect.value];
  canvas.width = w;
  canvas.height = h;
  redraw();
}

// Drag a panel to move its photo inside it.
let drag = null;
function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return [
    ((e.clientX - rect.left) / rect.width) * canvas.width,
    ((e.clientY - rect.top) / rect.height) * canvas.height,
  ];
}
canvas.addEventListener('pointerdown', (e) => {
  const [x, y] = canvasPoint(e);
  const i = panelAt(canvas, state, x, y);
  if (i < 0 || !state.panels[i].img) return;
  drag = { i, x, y, ox: state.panels[i].ox, oy: state.panels[i].oy };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const [x, y] = canvasPoint(e);
  const cell = layoutPanels(state.layout)[drag.i];
  state.panels[drag.i].ox = drag.ox + (x - drag.x) / (cell.w * canvas.width);
  state.panels[drag.i].oy = drag.oy + (y - drag.y) / (cell.h * canvas.height * 0.8);
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });

document.querySelectorAll('input[name=layout]').forEach((radio) => {
  radio.addEventListener('change', () => {
    state.layout = radio.value;
    buildPanelRows();
    redraw();
  });
});
document.querySelectorAll('input[name=grade]').forEach((radio) => {
  radio.addEventListener('change', () => {
    state.grade = radio.value;
    redraw();
  });
});
document.querySelectorAll('[data-color]').forEach((button) => {
  button.addEventListener('click', () => {
    state.captionColor = button.dataset.color;
    document.querySelectorAll('[data-color]').forEach((b) => b.classList.toggle('active', b === button));
    redraw();
  });
});
document.getElementById('same-photo').addEventListener('click', async () => {
  const first = state.panels.find((p) => p.img);
  if (!first) {
    status.textContent = 'Load a photo into any panel first.';
    return;
  }
  state.panels.forEach((p) => { p.img = first.img; p.ox = 0; p.oy = 0; });
  redraw();
  status.textContent = 'One photo now fills every panel.';
});
captionInput.addEventListener('input', () => {
  state.caption = captionInput.value;
  redraw();
});
sizeSelect.addEventListener('change', applySize);
document.getElementById('export').addEventListener('click', async () => {
  await document.fonts.ready;
  const [w, h] = SIZES[sizeSelect.value];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, state);
  off.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-nights-${w}x${h}.png`;
    a.click();
    status.textContent = `Saved vice-nights-${w}x${h}.png`;
  }, 'image/png');
});

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), state, {
    loadImage, buildPanelRows, applySize, redraw,
  });
} else {
  buildPanelRows();
  applySize();
}
