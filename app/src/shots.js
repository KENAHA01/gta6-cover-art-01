// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos loaded;
// ?shot=cover shows the exported cover alone. Query picks the layout, grade, caption,
// caption colour, export size, one sample photo per panel (samples/<name>.jpg), and the
// poster dressing: tagline, seal, billing, coming-soon toggle and one character tag
// per panel (tag, tag2, tag3, tag4).
// window.__shotReady is set once the cover is painted.
export async function runShot(shot, query, state, api) {
  const size = query.get('size') ?? '1080x1080';
  document.getElementById('size').value = size;
  state.layout = query.get('layout') ?? 'hero';
  state.grade = query.get('grade') ?? 'sunset';
  state.caption = query.get('caption') ?? 'VICE NIGHTS';
  state.captionColor = query.get('color') ?? '#ffffff';
  state.tagline = query.get('tagline') ?? state.tagline;
  state.seal = query.get('seal') ?? state.seal;
  state.showSeal = query.get('showseal') !== '0';
  state.billing = query.get('billing') ?? state.billing;
  state.showBilling = query.get('showbilling') !== '0';
  state.comingSoon = query.get('coming') !== '0';
  document.getElementById('caption').value = state.caption;
  document.getElementById('tagline').value = state.tagline;
  document.getElementById('seal').value = state.seal;
  document.getElementById('show-seal').checked = state.showSeal;
  document.getElementById('billing').value = state.billing;
  document.getElementById('show-billing').checked = state.showBilling;
  document.getElementById('coming-soon').checked = state.comingSoon;
  const tagNames = ['tag', 'tag2', 'tag3', 'tag4'];
  for (let i = 0; i < 4; i++) {
    const tag = query.get(tagNames[i]);
    if (tag) state.panels[i].tag = tag;
  }
  document.querySelector(`input[name=layout][value="${state.layout}"]`).checked = true;
  document.querySelector(`input[name=grade][value="${state.grade}"]`).checked = true;
  document.querySelectorAll('[data-color]').forEach((b) => {
    b.classList.toggle('active', b.dataset.color === state.captionColor);
  });

  const names = ['photo', 'photo2', 'photo3', 'photo4'];
  for (let i = 0; i < 4; i++) {
    const name = query.get(names[i]);
    if (name) state.panels[i].img = await api.loadImage(`samples/${name}.jpg`);
  }
  const zoom = Number(query.get('zoom') ?? '1');
  state.panels.forEach((p) => { p.zoom = zoom; });

  api.buildPanelRows();
  api.applySize();
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    // Fit the canvas inside the window, keeping its aspect ratio.
    const canvas = document.getElementById('cover');
    const fit = () => {
      const scale = Math.min(window.innerWidth / canvas.width, window.innerHeight / canvas.height);
      canvas.style.width = `${Math.floor(canvas.width * scale)}px`;
      canvas.style.height = `${Math.floor(canvas.height * scale)}px`;
    };
    fit();
    window.addEventListener('resize', fit);
  }
  await document.fonts.ready;
  api.redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
