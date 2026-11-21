// Draws a GTA-style multi-panel cover: slanted panels with white gutters, a Vice City
// sunset or neon grade, and movie-poster dressing — a chrome gradient title that
// overlaps the panels, a neon script tagline, a character name tag on every panel,
// a gold seal, a billing block and a barcode — all drawn on the canvas's 2D context,
// at the canvas's own size, so the same code renders the on-screen preview and every
// export size.
//
// state = {
//   layout: 'hero' | 'grid' | 'single',
//   grade: 'sunset' | 'neon' | 'none',
//   caption: string,
//   captionColor: css color (the chrome base: white, gold or cyan),
//   tagline: string,            // neon script line under the title, editable
//   seal: string, showSeal: boolean,
//   billing: string, showBilling: boolean,
//   comingSoon: boolean,
//   panels: [{ img: Image|null, zoom: number, ox: number, oy: number, tag: string }]
// }
// A panel's ox/oy shift its photo inside the panel; zoom scales it. All three are clamped
// so the photo always covers its panel.

const CAPTION_BAND = 0.2; // bottom fifth of the cover carries the title's foot and billing
const GUTTER = 0.012; // white gutter between panels, as a fraction of cover width

/** Default character tag per panel index. */
export const TAG_DEFAULTS = ['THE DRIVER', 'THE FIXER', 'THE BOSS', 'THE LOOKOUT'];

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

/** A character name tag at the top-left inside a panel: black tag, gold slash.
 *  The panel's left edge slants right toward the top, so the tag starts after the
 *  slant shift at its own height, or the clip would cut its left end off. */
function drawNameTag(ctx, rect, tag, w, slant) {
  const text = (tag || '').trim().toUpperCase();
  if (!text) return;
  const fs = Math.max(13, w * 0.02);
  ctx.font = `${fs}px Anton, 'Arial Narrow', sans-serif`;
  const padX = fs * 0.55;
  const tw = ctx.measureText(text).width;
  const tagH = fs * 1.85;
  const slashW = Math.max(3, fs * 0.22);
  const tagW = tw + padX * 2 + slashW;
  const inset = Math.max(6, w * 0.008);
  const cy = rect.y + inset + tagH / 2;
  const shift = slant * (1 - (cy - rect.y) / rect.h);
  const x = rect.x + shift + inset;
  const y = rect.y + inset;
  ctx.fillStyle = 'rgba(8, 6, 14, 0.85)';
  ctx.fillRect(x, y, tagW, tagH);
  ctx.fillStyle = '#ffd23f';
  ctx.fillRect(x, y, slashW, tagH);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + slashW + padX, y + tagH / 2 + fs * 0.04);
}

/** Chrome gradient for the title, from the chosen caption colour base. */
function chromeGradient(ctx, top, bottom, base) {
  const g = ctx.createLinearGradient(0, top, 0, bottom);
  if (base === '#ffd23f') {
    // gold chrome: pale gold over orange into hot pink
    g.addColorStop(0, '#fff8d0');
    g.addColorStop(0.35, '#ffd23f');
    g.addColorStop(0.6, '#ff8a3c');
    g.addColorStop(0.82, '#ff3d7e');
    g.addColorStop(1, '#c9184a');
  } else if (base === '#00e5ff') {
    // cyan chrome: ice over cyan into violet and magenta
    g.addColorStop(0, '#e6fbff');
    g.addColorStop(0.35, '#00e5ff');
    g.addColorStop(0.6, '#7b5cff');
    g.addColorStop(0.82, '#ff2d92');
    g.addColorStop(1, '#b5179e');
  } else {
    // silver chrome: white over steel blue
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.4, '#e8eefc');
    g.addColorStop(0.65, '#aebfe0');
    g.addColorStop(0.85, '#7e93c4');
    g.addColorStop(1, '#5b6b96');
  }
  return g;
}

/** The title in chrome letters with sunset stripes, drawn on its own layer so the
 *  stripes only touch the letters, then stamped over the cover with a glow. */
function drawChromeTitle(ctx, text, w, h, areaH, base) {
  let size = h * 0.115;
  ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  while (ctx.measureText(text).width > w * 0.94 && size > 12) {
    size -= 2;
    ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  }
  // The title straddles the panel area and the caption band, like a poster title
  // printed over the artwork.
  const cy = areaH - size * 0.32;
  const top = cy - size * 0.52;
  const bottom = cy + size * 0.52;
  const layer = document.createElement('canvas');
  layer.width = Math.max(1, Math.ceil(w));
  layer.height = Math.max(1, Math.ceil(bottom - top));
  const lctx = layer.getContext('2d');
  lctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  lctx.textAlign = 'center';
  lctx.textBaseline = 'middle';
  lctx.lineJoin = 'round';
  lctx.strokeStyle = 'rgba(10, 4, 18, 0.9)';
  lctx.lineWidth = Math.max(2, size * 0.07);
  lctx.strokeText(text, w / 2, layer.height / 2);
  lctx.fillStyle = chromeGradient(lctx, 0, layer.height, base);
  lctx.fillText(text, w / 2, layer.height / 2);
  // Sunset stripes across the letters only.
  lctx.globalCompositeOperation = 'source-atop';
  lctx.fillStyle = 'rgba(24, 8, 32, 0.22)';
  const stripeH = size * 0.09;
  for (const f of [0.32, 0.56, 0.8]) {
    lctx.fillRect(0, layer.height * f, w, stripeH);
  }
  lctx.globalCompositeOperation = 'source-over';
  ctx.save();
  ctx.shadowColor = 'rgba(255, 80, 170, 0.5)';
  ctx.shadowBlur = size * 0.1;
  ctx.shadowOffsetY = size * 0.02;
  ctx.drawImage(layer, 0, top);
  ctx.restore();
}

/** A small deterministic pseudo-random stream, so the barcode is the same every run. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A decorative barcode: black bars on white, with a small number under them. */
function drawBarcode(ctx, x, y, bw, bh) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, bw, bh);
  const rnd = mulberry32(10472);
  const barH = bh * 0.68;
  let bx = x + bw * 0.06;
  ctx.fillStyle = '#111111';
  while (bx < x + bw * 0.94) {
    const barW = 1 + Math.floor(rnd() * 3) * Math.max(1, bw * 0.003);
    const gap = Math.max(1, bw * 0.008) * (1 + Math.floor(rnd() * 3));
    ctx.fillRect(bx, y + bh * 0.08, Math.min(barW, x + bw * 0.94 - bx), barH);
    bx += barW + gap;
  }
  ctx.fillStyle = '#111111';
  ctx.font = `${Math.max(7, bh * 0.16)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('0 10472 85991', x + bw / 2, y + bh * 0.87);
}

/** A gold starburst seal with the seal text inside, tilted like a sticker. */
function drawSeal(ctx, text, w, h) {
  const cx = w * 0.935;
  const cy = h * 0.062;
  const r = w * 0.05;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.18);
  ctx.beginPath();
  const spikes = 24;
  for (let i = 0; i < spikes * 2; i++) {
    const ang = (i / (spikes * 2)) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.88;
    const px = Math.cos(ang) * rr;
    const py = Math.sin(ang) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = '#f2b705';
  ctx.fill();
  ctx.strokeStyle = '#a86e00';
  ctx.lineWidth = Math.max(1.5, r * 0.05);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.74, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(36, 16, 49, 0.55)';
  ctx.lineWidth = Math.max(1, r * 0.03);
  ctx.stroke();
  const lines = (text || '').trim().toUpperCase().split(/\s+/).slice(0, 2);
  ctx.fillStyle = '#241031';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fs = r * 0.36;
  ctx.font = `${fs}px Anton, 'Arial Narrow', sans-serif`;
  lines.forEach((line, i) => {
    ctx.fillText(line, 0, (i - (lines.length - 1) / 2) * fs * 1.05);
  });
  ctx.restore();
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
    const panel = state.panels[i] || { img: null, zoom: 1, ox: 0, oy: 0, tag: TAG_DEFAULTS[i] };
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
    drawNameTag(ctx, rect, panel.tag, w, slant);
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

  // Caption band: deep plum.
  const band = ctx.createLinearGradient(0, areaH, 0, h);
  band.addColorStop(0, '#241031');
  band.addColorStop(1, '#12081c');
  ctx.fillStyle = band;
  ctx.fillRect(0, areaH, w, h - areaH);

  // Chrome title, straddling the panels and the band.
  const text = (state.caption || '').trim().toUpperCase();
  if (text) drawChromeTitle(ctx, text, w, h, areaH, state.captionColor || '#ffffff');

  // Neon script tagline under the title.
  const tagline = (state.tagline || '').trim();
  if (tagline) {
    let size = h * 0.048;
    ctx.font = `${size}px Yellowtail, cursive`;
    while (ctx.measureText(tagline).width > w * 0.86 && size > 10) {
      size -= 2;
      ctx.font = `${size}px Yellowtail, cursive`;
    }
    ctx.save();
    ctx.translate(w / 2, areaH + (h - areaH) * 0.36);
    ctx.rotate(-0.035);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff6eb4';
    ctx.shadowColor = 'rgba(255, 45, 146, 0.8)';
    ctx.shadowBlur = size * 0.45;
    ctx.fillText(tagline, 0, 0);
    ctx.restore();
  }

  // Billing strip along the very bottom: COMING SOON, billing line, barcode.
  const stripY = h * 0.962;
  const stripH = h * 0.032;
  if (state.comingSoon) {
    ctx.font = `${Math.max(11, h * 0.02)}px Anton, 'Arial Narrow', sans-serif`;
    ctx.fillStyle = '#ffd23f';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('C O M I N G   S O O N', w * 0.03, stripY);
  }
  const barcodeW = w * 0.085;
  const barcodeX = w * 0.97 - barcodeW;
  const barcodeY = stripY - stripH / 2;
  if (state.showBilling || state.comingSoon) drawBarcode(ctx, barcodeX, barcodeY, barcodeW, stripH);
  if (state.showBilling) {
    const billing = (state.billing || '').trim();
    if (billing) {
      const left = state.comingSoon ? w * 0.03 + ctx.measureText('C O M I N G   S O O N').width + w * 0.03 : w * 0.03;
      const right = barcodeX - w * 0.02;
      let size = Math.max(9, h * 0.0135);
      ctx.font = `${size}px system-ui, sans-serif`;
      while (ctx.measureText(billing).width > right - left && size > 8) {
        size -= 1;
        ctx.font = `${size}px system-ui, sans-serif`;
      }
      ctx.fillStyle = '#c9bfe0';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const cx = (left + right) / 2;
      ctx.fillText(billing.length > 90 ? billing.slice(0, 87) + '...' : billing, cx, stripY);
    }
  }

  // Gold seal, top-right over the panels.
  if (state.showSeal && (state.seal || '').trim()) drawSeal(ctx, state.seal, w, h);

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
