// Motor da apresentação: cenas 1600x900, passos dentro de cada cena, disco que viaja entre elas.
const palco = document.getElementById('palco');
const disco = document.getElementById('disco');
const cenas = [...document.querySelectorAll('.cena')];
const menu = document.getElementById('menu');
const notas = document.getElementById('notas');
const E = 'power3.out';

let atual = -1, passo = 0, ocupado = false;
// as notas de fala só existem no link da apresentadora: ?ray
const comNotas = new URLSearchParams(location.search).has('ray');
// modo de impressão (?pdf): cada cena já aberta no último passo, sem animação e sem dica
const modoPdf = new URLSearchParams(location.search).has('pdf');
if (modoPdf) { gsap.globalTimeline.timeScale(1000); document.getElementById('dica').style.display = 'none'; }
if (!comNotas) document.getElementById('dica').textContent = '→ avança · ← volta · M cenas · F tela cheia';

cenas.forEach(c => {
  c.passos = Math.max(+c.dataset.passos || 0, ...[...c.querySelectorAll('[data-p]')].map(el => +el.dataset.p));
});

function escala() {
  const s = Math.min(innerWidth / 1600, innerHeight / 900);
  palco.style.transform = `translate(${(innerWidth - 1600 * s) / 2}px,${(innerHeight - 900 * s) / 2}px) scale(${s})`;
}
addEventListener('resize', escala); escala();

function moverDisco(x, y, d, dur = 1.2) {
  gsap.to(disco, { left: x - d / 2, top: y - d / 2, width: d, height: d, duration: dur, ease: 'power3.inOut', overwrite: true });
}
function discoDaCena(c) { return c.dataset.disco.split(',').map(Number); }

// guarda a posição original das palavras soltas pra poder devolver
document.querySelectorAll('.pal').forEach(el => { el._pos = { left: el.style.left, top: el.style.top }; });
function repor(els) { els.forEach(el => gsap.set(el, { left: el._pos.left, top: el._pos.top, xPercent: 0, yPercent: 0, scale: 1 })); }

// ganchos: comportamentos próprios de algumas cenas
// câmera: move a cena inteira pra mirar um ponto (coordenadas do palco 1600x900)
const legcam = document.createElement('div'); legcam.className = 'legcam'; palco.appendChild(legcam);
function boxDe(el, c) {
  const r = el.getBoundingClientRect(), rc = c.getBoundingClientRect(), k = rc.width / 1600;
  return { x: (r.left - rc.left) / k, y: (r.top - rc.top) / k, w: r.width / k, h: r.height / k };
}
function mirar(c, cx, cy, s, dur, ease = 'power3.inOut') {
  c._cam = true;
  gsap.set(c, { transformOrigin: '0 0' });
  return gsap.to(c, { x: 800 - cx * s, y: 450 - cy * s, scale: s, duration: dur, ease, overwrite: 'auto' });
}
function soltar(c, dur, ease = 'power3.inOut') {
  c._cam = false;
  return gsap.to(c, { x: 0, y: 0, scale: 1, duration: dur, ease, overwrite: 'auto' });
}
function discoVisivel(v, dur = .5, delay = 0) { gsap.to(disco, { opacity: v ? 1 : 0, duration: dur, delay, overwrite: 'auto' }); }
function legenda(txt, inst) {
  if (txt) legcam.textContent = txt;
  gsap.to(legcam, { opacity: txt ? 1 : 0, duration: inst ? 0 : .5, delay: txt && !inst ? .6 : 0, overwrite: 'auto' });
}
function linhaViva(el) {
  if (el._len === undefined) { el._len = el.getTotalLength ? el.getTotalLength() : 0; el.style.strokeDasharray = el._len; }
  return el._len;
}

const ganchos = {
  abas(c, p, instante) {
    const pal = c.querySelectorAll('.pal');
    if (p >= 1) {
      if (instante) { gsap.set(pal, { opacity: 0 }); return; }
      gsap.timeline()
        .to(pal, { left: 800, top: 450, xPercent: -50, yPercent: -50, scale: .2, opacity: 0, duration: 1.1, stagger: .07, ease: 'power3.in' })
        .to(disco, { scale: 1.2, duration: .45, ease: 'power2.out' }, '-=.3')
        .to(disco, { scale: 1, duration: .6, ease: 'power2.inOut' });
    } else {
      repor(pal);
      gsap.to(pal, { opacity: 1, duration: .4 });
    }
  },
  orbita(c, p, instante) {
    const centro = c.querySelector('.centro'), pontos = [...c.querySelectorAll('.ponto')], linhas = [...c.querySelectorAll('.orb line')];
    linhas.forEach(linhaViva);
    if (p === 0) {
      const b = boxDe(centro, c);
      mirar(c, b.x + b.w / 2, b.y + b.h / 2, 2.4, 0);
      gsap.set(pontos, { opacity: 0 });
      gsap.set(linhas, { strokeDashoffset: (i, l) => l._len });
      discoVisivel(false, instante ? 0 : .4);
      return;
    }
    if (c._cam) soltar(c, instante ? 0 : 2.8, 'power2.inOut');
    gsap.to(linhas, { strokeDashoffset: 0, duration: instante ? 0 : 1.1, stagger: instante ? 0 : .16, delay: instante ? 0 : .6, ease: 'power2.out' });
    gsap.to(pontos, { opacity: 1, duration: instante ? 0 : .8, stagger: instante ? 0 : .16, delay: instante ? 0 : 1.1, ease: E });
    discoVisivel(true, .6, instante ? 0 : 2.2);
  },
  // cena 16: as fotos caem na mesa; depois a última toma a tela
  ensaio(c, p, instante) {
    const fotos = [...c.querySelectorAll('.foto')], alvo = fotos[fotos.length - 1];
    fotos.forEach(f => { if (f._rot === undefined) f._rot = parseFloat((f.getAttribute('style').match(/rotate\((-?[\d.]+)deg/) || [0, 0])[1]); });
    const outros = [...c.children].filter(x => x !== alvo);
    if (p === 1) {
      const b = boxDe(alvo, c);
      mirar(c, b.x + b.w / 2, b.y + b.h / 2, 900 * .9 / b.h, instante ? 0 : 1.6);
      gsap.to(alvo, { rotation: 0, duration: instante ? 0 : 1.6, ease: 'power3.inOut' });
      gsap.to(outros, { opacity: .12, filter: 'blur(4px)', duration: instante ? 0 : .9 });
      discoVisivel(false, instante ? 0 : .5);
      return;
    }
    if (p === 0 && !instante && !c._cam) {
      gsap.fromTo(fotos, { y: -240, opacity: 0, scale: 1.12, rotation: f => fotos[f]._rot * 3 },
        { y: 0, opacity: 1, scale: 1, rotation: f => fotos[f]._rot, duration: 1, ease: 'power3.out', stagger: .3, delay: .7, overwrite: 'auto' });
      return;
    }
    if (c._cam) soltar(c, instante ? 0 : 1.5);
    gsap.to(alvo, { rotation: alvo._rot, duration: instante ? 0 : 1.5, ease: 'power3.inOut' });
    gsap.to(outros, { opacity: 1, filter: 'blur(0px)', duration: instante ? 0 : .9, delay: instante ? 0 : .3 });
    discoVisivel(true, .6, instante ? 0 : .8);
  },
  ia(c, p, instante) {
    const txt = c.querySelector('.txt'), frase = 'o que eu posto essa semana?';
    if (p === 1 && !instante) {
      txt.textContent = '';
      gsap.to({}, { duration: 1.2, delay: .3, onUpdate() { txt.textContent = frase.slice(0, Math.round(this.progress() * frase.length)); } });
    } else if (p >= 1) txt.textContent = frase;
    const slides = [...c.querySelectorAll('.sl')];
    if (p >= 4 && p < 4 + slides.length) {
      const b = boxDe(slides[p - 4], c);
      mirar(c, b.x + b.w / 2, b.y + b.h / 2, Math.min(900 * .8 / b.h, 1600 * .5 / b.w), instante ? 0 : 1.3);
      discoVisivel(false, instante ? 0 : .5);
    } else if (c._cam) { soltar(c, instante ? 0 : 1.4); discoVisivel(true, .6, instante ? 0 : .6); }
  },
  vagas(c, p, instante) {
    const barra = c.querySelector('.carrega i'), antes = [c.querySelector('.carrega'), c.querySelector('.mini')];
    if (p >= 1) { gsap.to(antes, { opacity: 0, duration: instante ? 0 : .3 }); return; }
    gsap.set(antes, { opacity: 1 });
    gsap.fromTo(barra, { width: '0%' }, { width: '100%', duration: 2, delay: .8, ease: 'power2.inOut',
      onComplete() { if (cenas[atual] === c && passo === 0) avancar(); } });
  },
  mapa(c, p, instante) {
    const svg = c.querySelector('.mapa');
    svg.dataset.sel = p;
    c.dataset.sel = p;
    if (p < 1 || p > 3) {
      if (c._cam) soltar(c, instante ? 0 : 1.5);
      legenda(null, instante); discoVisivel(true, .6, instante ? 0 : .8);
      return;
    }
    const caixas = [...svg.querySelectorAll(`.n.f${p}, .n.v${p}`)].map(n => boxDe(n, c));
    const x0 = Math.min(...caixas.map(b => b.x)), x1 = Math.max(...caixas.map(b => b.x + b.w));
    const y0 = Math.min(...caixas.map(b => b.y)), y1 = Math.max(...caixas.map(b => b.y + b.h));
    const s = Math.min(1.9, 900 * .62 / (y1 - y0 + 80)), meia = 800 / s, cy = (y0 + y1) / 2;
    let ca = x0 - 50 + meia, cb = x1 + 50 - meia;
    if (cb < ca) ca = cb = (x0 + x1) / 2;
    const linhas = [...svg.querySelectorAll(`.l.s${p}`)].sort((a, b) => parseFloat(a.getAttribute('d').slice(1)) - parseFloat(b.getAttribute('d').slice(1)));
    linhas.forEach(linhaViva);
    legenda(c.querySelector(`.legenda-tela[data-s="${p}"]`).textContent, instante);
    discoVisivel(false, instante ? 0 : .4);
    if (instante) {
      mirar(c, cb, cy, s, 0); gsap.set(linhas, { strokeDashoffset: 0 }); return;
    }
    c._cam = true;
    gsap.killTweensOf(c);
    gsap.set(c, { transformOrigin: '0 0' });
    gsap.timeline()
      .to(c, { x: 800 - ca * s, y: 450 - cy * s, scale: s, duration: 1.2, ease: 'power3.inOut' })
      .to(c, { x: 800 - cb * s, duration: 2.8, ease: 'power2.inOut' });
    gsap.fromTo(linhas, { strokeDashoffset: (i, l) => l._len }, { strokeDashoffset: 0, duration: .9, stagger: 2.4 / Math.max(linhas.length, 1), delay: 1, ease: 'power2.out' });
  },
  // câmera: a partir do passo 4, aproxima um print por vez; o último passo volta pra visão geral
  foco(c, p, instante) {
    const alvos = [...c.querySelectorAll('.print, .cita')];
    const ordem = c.dataset.foco.split(',').map(Number);
    const el = p >= 4 ? alvos[ordem[p - 4]] : null;
    const dur = instante ? 0 : 1.3, ease = 'power3.inOut';
    const resto = [...c.children].filter(x => x !== el);
    if (!el) {
      if (!c._zoom) { gsap.set(c, { x: 0, y: 0, scale: 1 }); return; }
      c._zoom = false;
      gsap.to(c, { x: 0, y: 0, scale: 1, duration: dur, ease });
      gsap.to(resto, { opacity: (i, x) => (x.hasAttribute('data-p') && +x.dataset.p > p) ? 0 : 1, filter: 'blur(0px)', duration: instante ? 0 : .8 });
      gsap.to(disco, { opacity: 1, duration: instante ? 0 : .6 });
      return;
    }
    const w = el.offsetWidth, h = el.offsetHeight;
    const s = Math.min(1600 * .74 / w, 900 * .8 / h, 2.6);
    const cx = el.offsetLeft + w / 2, cy = el.offsetTop + h / 2;
    c._zoom = true;
    gsap.set(c, { transformOrigin: '0 0' });
    gsap.to(c, { x: 800 - cx * s, y: 450 - cy * s, scale: s, duration: dur, ease });
    gsap.to(el, { opacity: 1, filter: 'blur(0px)', duration: instante ? 0 : .6 });
    gsap.to(resto, { opacity: .12, filter: 'blur(3px)', duration: instante ? 0 : .8 });
    gsap.to(disco, { opacity: 0, duration: instante ? 0 : .5 });
    const grifo = el.querySelector('.grifo');
    if (grifo) gsap.fromTo(grifo, { scaleX: 0, transformOrigin: '0 50%' }, { scaleX: 1, duration: instante ? 0 : .7, delay: instante ? 0 : 1.1, ease: 'power2.out' });
  },
  tempo(c, p, instante) {
    const x = [200, 500, 800, 1100, 1400][Math.min(p, 4)], d = p === 3 ? 96 : 64, dur = instante ? .01 : 1.3;
    gsap.to(c.querySelector('.trilho-vivo'), { scaleX: (x - 200) / 1200, duration: dur, ease: 'power3.inOut' });
    if (p >= 1 && p <= 4) {
      const s = 1.45, cy = 520, cx = Math.max(800 / s, Math.min(1600 - 800 / s, x));
      mirar(c, cx, cy, s, dur);
      moverDisco(800 + (x - cx) * s, 450 + (470 - cy) * s, d * s, dur);
    } else {
      if (c._cam) soltar(c, dur);
      moverDisco(x, 470, d, instante ? .01 : .9);
    }
  },
};

function mostrar(el, instante) {
  if (el.classList.contains('h') && !instante) { gsap.to(el, { opacity: 1, duration: .8, delay: .9 }); return; }
  if (instante) gsap.set(el, { opacity: 1, y: 0 });
  else gsap.fromTo(el, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: .8, ease: E });
}
function esconder(el, instante) {
  instante ? gsap.set(el, { opacity: 0 }) : gsap.to(el, { opacity: 0, duration: .3 });
}

const legendasTelas = [
  'O DNA da marca: paleta, tipografia, ritmo e temas, lidos pela IA em cada pedido.',
  'Criar com IA: curadoria de ideias, arte, carrossel, stories e roteiro, tudo a partir do DNA.',
  'O que já existe da marca: cada peça com estado, do rascunho ao publicado. Aqui, as artes de Ana Karinna.',
];
function aplicarPasso(c, p, instante) {
  const lt = c.querySelector('.legenda-tela[data-l]'); if (lt) lt.textContent = legendasTelas[Math.min(p, 2)];
  c.querySelectorAll('[data-p]').forEach(el => {
    const v = +el.dataset.p;
    if (v <= p) { if (el._visto !== true) { mostrar(el, instante); el._visto = true; } }
    else if (el._visto !== false) { esconder(el, true); el._visto = false; }
  });
  const g = ganchos[c.dataset.gancho];
  if (g) g(c, p, instante);
}

function irPara(i, p = 0) {
  if (i < 0 || i >= cenas.length) return;
  const velha = cenas[atual], nova = cenas[i];
  if (velha && velha !== nova) {
    gsap.to(velha.children, { opacity: 0, y: -24, duration: .45, ease: 'power2.in', onComplete: () => { if (cenas[atual] !== velha) velha.classList.remove('on'); } });
  }
  if (velha && velha !== nova && (velha._zoom || velha._cam)) { velha._zoom = velha._cam = false; gsap.killTweensOf(velha); gsap.set(velha, { x: 0, y: 0, scale: 1, delay: .5 }); gsap.set(velha.children, { filter: 'blur(0px)', delay: .5 }); }
  legenda(null, false); discoVisivel(true, .4);
  atual = i; passo = p;
  document.body.classList.toggle('escuro', nova.classList.contains('escura'));
  document.body.classList.toggle('marrom', nova.classList.contains('marrom'));
  const [x, y, d] = discoDaCena(nova);
  gsap.set(disco, { scale: 1 });
  moverDisco(x, y, d);

  nova.querySelectorAll('[data-p]').forEach(el => { el._visto = undefined; gsap.set(el, { opacity: 0, y: 0 }); });
  repor(nova.querySelectorAll('.pal'));
  const entra = [...nova.children].filter(el => !el.hasAttribute('data-p') && !el.hasAttribute('data-s'));
  gsap.set(entra, { opacity: 0, y: 30 });
  nova.classList.add('on');
  gsap.to(entra, { opacity: 1, y: 0, duration: .9, stagger: .09, ease: E, delay: velha ? .35 : .1 });

  if (nova.classList.contains('escura')) {
    const img = nova.querySelector('.full img');
    if (img) gsap.fromTo(img, { scale: 1.2 }, { scale: 1, duration: 3, ease: 'power2.out' });
  }
  cenas.forEach(c => c.querySelectorAll('video').forEach(v => { c === nova ? v.play().catch(() => {}) : v.pause(); }));
  aplicarPasso(nova, p, p > 0);
  history.replaceState(null, '', '#' + (i + 1));
  notas.textContent = nova.dataset.fala || '';
  marcarMenu();
}

// a sequência normal pula as cenas marcadas com data-pular
function vizinha(i, dir) {
  let j = i + dir;
  while (cenas[j] && cenas[j].hasAttribute('data-pular')) j += dir;
  return cenas[j] ? j : -1;
}
function avancar() {
  const c = cenas[atual];
  if (passo < c.passos) { passo++; aplicarPasso(c, passo, false); return; }
  const j = vizinha(atual, 1); if (j >= 0) irPara(j);
}
function voltar() {
  const c = cenas[atual];
  if (passo > 0) { passo--; aplicarPasso(c, passo, true); return; }
  const j = vizinha(atual, -1); if (j >= 0) irPara(j, cenas[j].passos);
}

// menu de cenas
const ol = menu.querySelector('ol');
cenas.forEach((c, i) => {
  const li = document.createElement('li');
  li.textContent = c.dataset.nome;
  if (c.hasAttribute('data-pular')) li.classList.add('extra');
  li.onclick = () => { menu.classList.remove('on'); irPara(i); };
  ol.appendChild(li);
});
function marcarMenu() { [...ol.children].forEach((li, i) => li.classList.toggle('atual', i === atual)); }
menu.addEventListener('click', e => { if (e.target === menu) menu.classList.remove('on'); });

addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (menu.classList.contains('on')) { if (k === 'Escape' || k === 'm' || k === 'M') menu.classList.remove('on'); return; }
  if (k === 'ArrowRight' || k === ' ' || k === 'PageDown' || k === 'Enter') { e.preventDefault(); avancar(); }
  else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); voltar(); }
  else if (k === 'ArrowDown') { e.preventDefault(); const j = vizinha(atual, 1); if (j >= 0) irPara(j); }
  else if (k === 'ArrowUp') { e.preventDefault(); const j = vizinha(atual, -1); if (j >= 0) irPara(j); }
  else if (k === 'm' || k === 'M') menu.classList.add('on');
  else if ((k === 'n' || k === 'N') && comNotas) notas.classList.toggle('on');
  else if (k === 'f' || k === 'F') { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.(); }
});

// no toque: lado direito avança, esquerdo volta. O mouse não avança, pra dar pra selecionar texto.
addEventListener('pointerup', e => {
  if (e.pointerType !== 'touch' || menu.classList.contains('on')) return;
  e.clientX > innerWidth / 3 ? avancar() : voltar();
});

setTimeout(() => { document.getElementById('dica').style.opacity = 0; }, 5000);

document.fonts.ready.then(() => {
  const n = parseInt(location.hash.slice(1), 10);
  const idx = n >= 1 && n <= cenas.length ? n - 1 : 0;
  irPara(idx, modoPdf ? cenas[idx].passos : 0);
});

window.apresentacao = { irPara, avancar, voltar, cenas };
