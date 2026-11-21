// Draws a GTA-style multi-panel cover: slanted panels with white gutters, a Vice City
// sunset or neon grade, and the caption in big condensed capitals across the foot.
// Everything is drawn on the canvas's 2D context, at the canvas's own size, so the same
// code renders the on-screen preview and every export size.
//
// state = {
//   layout: 'hero' | 'grid' | 'single',
//   grade: 'sunset' | 'neon' | 'none',
//   caption: string,
//   captionColor: css color,
//   panels: [{ img: Image|null, zoom: number, ox: number, oy: number }]  // ox/oy in panel fractions
// }
// A panel's ox/oy shift its photo inside the panel; zoom scales it. All three are clamped
// so the photo always covers its panel.

const CAPTION_BAND = 0.2; // bottom fifth of the cover carries the caption
const GUTTER = 0.012; // white gutter between panels, as a fraction of cover width

/** Panel rectangles for a layout, as fractions of the panel area (x, y, w, h). */
export function layoutPanels(layout) {
  if (layout === 'grid') {
    return [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ];
  }
  if (layout === 'single') {
    return [{ x: 0, y: 0, w: 1, h: 1 }];
  }
  // hero: one big panel left, two stacked panels right
  return [
    { x: 0, y: 0, w: 0.64, h: 1 },
    { x: 0.64, y: 0, w: 0.36, h: 0.5 },
    { x: 0.64, y: 0.5, w: 0.36, h: 0.5 },
  ];
}

/** How many panels a layout shows. */
export function panelCount(layout) {
  return layoutPanels(layout).length;
}

/** The slanted polygon of a panel rect (parallelograms tile with one shared slant). */
function panelPath(ctx, x, y, w, h, slant) {
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + slant, y);
  ctx.lineTo(x + w + slant, y);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

/** Draws one photo into its panel, cover-fit, with the panel's pan and zoom applied. */
function drawPanelPhoto(ctx, rect, panel) {
  const { img, zoom, ox, oy } = panel;
  if (!img) return;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const base = Math.max(rect.w / iw, rect.h / ih) * (zoom || 1);
  const pw = iw * base;
  const ph = ih * base;
  // Clamp the pan so the photo never leaves a gap at a panel edge. dy runs from
  // -overflow/2 (bottom-anchored) to +overflow/2 (top-anchored); the default sits
  // at the top end, so a face near the top of a portrait photo survives a wide
  // panel, and dragging a panel up pans it toward the bottom of the photo.
  const overflowY = Math.max(0, ph - rect.h);
  const maxX = Math.max(0, (pw - rect.w) / 2);
  const dx = Math.max(-maxX, Math.min(maxX, (ox || 0) * rect.w));
  const dy = Math.max(-overflowY / 2, Math.min(overflowY / 2, (oy || 0) * rect.h + overflowY * 0.5));
  ctx.drawImage(img, rect.x + (rect.w - pw) / 2 + dx, rect.y + (rect.h - ph) / 2 + dy, pw, ph);
}

/** The colour grade washed over one panel: warm sunset, cold neon, or nothing. */
function gradePanel(ctx, rect, grade) {
  if (grade === 'none') return;
  const g = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  if (grade === 'neon') {
    g.addColorStop(0, 'rgba(0, 229, 255, 0.16)');
    g.addColorStop(0.55, 'rgba(120, 40, 200, 0.10)');
    g.addColorStop(1, 'rgba(255, 0, 140, 0.30)');
  } else {
    g.addColorStop(0, 'rgba(255, 170, 60, 0.05)');
    g.addColorStop(0.55, 'rgba(255, 110, 60, 0.18)');
    g.addColorStop(1, 'rgba(200, 40, 120, 0.34)');
  }
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

/** Draws the whole cover onto the canvas. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const areaH = h * (1 - CAPTION_BAND);
  const gutter = w * GUTTER;
  const slant = areaH * 0.045;

  // Backdrop: near-black plum, shows through the gutters and behind empty panels.
  ctx.fillStyle = '#14101c';
  ctx.fillRect(0, 0, w, h);

  const rects = layoutPanels(state.layout);
  rects.forEach((cell, i) => {
    const panel = state.panels[i] || { img: null, zoom: 1, ox: 0, oy: 0 };
    const rect = {
      x: cell.x * w + gutter / 2,
      y: cell.y * areaH + gutter / 2,
      w: cell.w * w - gutter,
      h: cell.h * areaH - gutter,
    };
    ctx.save();
    panelPath(ctx, rect.x, rect.y, rect.w, rect.h, slant);
    ctx.clip();
    if (panel.img) {
      drawPanelPhoto(ctx, rect, panel);
    } else {
      // Empty panel: a dusk gradient so the cover never shows a hole.
      const empty = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
      empty.addColorStop(0, '#3a1c5e');
      empty.addColorStop(1, '#120a1e');
      ctx.fillStyle = empty;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    gradePanel(ctx, rect, state.grade);
    ctx.restore();
    // White frame around the panel, following its slant.
    ctx.save();
    panelPath(ctx, rect.x, rect.y, rect.w, rect.h, slant);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(2, w * 0.004);
    ctx.stroke();
    ctx.restore();
  });

  // A gold rule above the caption band.
  ctx.fillStyle = '#ffd23f';
  ctx.fillRect(0, areaH - Math.max(3, h * 0.004), w, Math.max(3, h * 0.004));

  // Caption band: deep plum, caption in big condensed capitals.
  const band = ctx.createLinearGradient(0, areaH, 0, h);
  band.addColorStop(0, '#241031');
  band.addColorStop(1, '#12081c');
  ctx.fillStyle = band;
  ctx.fillRect(0, areaH, w, h - areaH);

  const text = (state.caption || '').trim().toUpperCase();
  if (text) {
    let size = (h - areaH) * 0.74;
    ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
    while (ctx.measureText(text).width > w * 0.92 && size > 12) {
      size -= 2;
      ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = state.captionColor || '#ffffff';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.lineWidth = Math.max(2, size * 0.055);
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = size * 0.12;
    ctx.shadowOffsetY = size * 0.03;
    const cy = areaH + (h - areaH) / 2;
    ctx.strokeText(text, w / 2, cy);
    ctx.fillText(text, w / 2, cy);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  // Vignette: darkens the corners so the panels read as one poster.
  const vig = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.45,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(0, 0, 0, 0.26)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // Outer white frame.
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(3, w * 0.008);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
}

/** Which panel (index) contains a point on the canvas, or -1. */
export function panelAt(canvas, state, px, py) {
  const w = canvas.width;
  const h = canvas.height;
  const areaH = h * (1 - CAPTION_BAND);
  if (py >= areaH) return -1;
  const rects = layoutPanels(state.layout);
  for (let i = 0; i < rects.length; i++) {
    const cell = rects[i];
    const x = cell.x * w;
    const y = cell.y * areaH;
    const pw = cell.w * w;
    const ph = cell.h * areaH;
    // Undo the slant: at height py the left edge has shifted right by slant * (1 - (py - y) / ph).
    const slant = areaH * 0.045;
    const shift = slant * (1 - (py - y) / ph);
    if (px >= x + shift && px <= x + pw + shift && py >= y && py <= y + ph) return i;
  }
  return -1;
}
