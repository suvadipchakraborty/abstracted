import { MOCK } from './mock-data.js';

const API = 'https://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL+OR+cat:stat.ML&sortBy=submittedDate&sortOrder=descending&max_results=50';
const PROXY = 'https://api.allorigins.win/raw?url=';
const MAIL = 'suvadipchakraborty@gmail.com';
const CATS = { 'cs.AI': 'Artificial Intelligence', 'cs.LG': 'Machine Learning', 'cs.CL': 'Language', 'stat.ML': 'Statistical ML' };
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
const S = { papers: [], i: 0, flipped: false, busy: false, saved: store.get('abstracted:saved', []), source: '' };
const card = $('#card'), deck = $('#deck');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const buzz = ms => { try { navigator.vibrate?.(ms); } catch {} };

/* ---------- LaTeX to readable Unicode ---------- */
const GREEK = { alpha:'α',beta:'β',gamma:'γ',delta:'δ',epsilon:'ε',varepsilon:'ε',zeta:'ζ',eta:'η',theta:'θ',kappa:'κ',lambda:'λ',mu:'μ',nu:'ν',xi:'ξ',pi:'π',rho:'ρ',sigma:'σ',tau:'τ',phi:'φ',varphi:'φ',chi:'χ',psi:'ψ',omega:'ω',Gamma:'Γ',Delta:'Δ',Theta:'Θ',Lambda:'Λ',Pi:'Π',Sigma:'Σ',Phi:'Φ',Psi:'Ψ',Omega:'Ω' };
const SYM = { times:'×',cdot:'·',leq:'≤',le:'≤',geq:'≥',ge:'≥',neq:'≠',ne:'≠',approx:'≈',to:'→',rightarrow:'→',leftarrow:'←',Rightarrow:'⇒',infty:'∞',pm:'±',sim:'∼',ell:'ℓ',partial:'∂',nabla:'∇',in:'∈',sum:'Σ',prod:'Π',ldots:'…',dots:'…',cdots:'⋯',sqrt:'√',ll:'≪',gg:'≫',mid:'|',forall:'∀',exists:'∃',subset:'⊂',cup:'∪',cap:'∩',odot:'⊙',otimes:'⊗',oplus:'⊕',log:'log',exp:'exp',min:'min',max:'max',argmax:'argmax',argmin:'argmin' };
const BB = { R:'ℝ',N:'ℕ',Z:'ℤ',Q:'ℚ',C:'ℂ',E:'𝔼',P:'ℙ' };
const SUP = { 0:'⁰',1:'¹',2:'²',3:'³',4:'⁴',5:'⁵',6:'⁶',7:'⁷',8:'⁸',9:'⁹','+':'⁺','-':'⁻','−':'⁻',n:'ⁿ',i:'ⁱ',T:'ᵀ' };
const SUB = { 0:'₀',1:'₁',2:'₂',3:'₃',4:'₄',5:'₅',6:'₆',7:'₇',8:'₈',9:'₉','+':'₊','-':'₋',n:'ₙ',i:'ᵢ',j:'ⱼ',k:'ₖ',m:'ₘ',t:'ₜ',x:'ₓ' };
const script = (s, map, mark) => [...s].every(c => map[c]) ? [...s].map(c => map[c]).join('') : `${mark}(${s})`;
function tex(m) {
  let s = m;
  s = s.replace(/\\(?:mathbb)\{(\w)\}/g, (_, c) => BB[c] || c);
  s = s.replace(/\\(?:text|mathrm|mathbf|mathcal|mathit|textbf|textit|emph|operatorname|boldsymbol)\{([^{}]*)\}/g, '$1');
  s = s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)');
  s = s.replace(/\\([A-Za-z]+)/g, (_, n) => GREEK[n] || SYM[n] || n);
  s = s.replace(/\^\{([^{}]*)\}|\^(\S)/g, (_, a, b) => script(a ?? b, SUP, '^'));
  s = s.replace(/_\{([^{}]*)\}|_(\S)/g, (_, a, b) => script(a ?? b, SUB, '_'));
  return s.replace(/[{}\\]/g, '').replace(/\s{2,}/g, ' ').trim();
}
const clean = s => (s || '').replace(/\$\$?([^$]+)\$\$?/g, (_, m) => tex(m)).replace(/\\(?:textit|emph|textbf)\{([^{}]*)\}/g, '$1');

/* ---------- Data ---------- */
function parseFeed(xml) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('Bad XML');
  const papers = [...doc.getElementsByTagName('entry')].map(e => {
    const t = n => (e.getElementsByTagName(n)[0]?.textContent || '').replace(/\s+/g, ' ').trim();
    const pdf = [...e.getElementsByTagName('link')].find(l => l.getAttribute('title') === 'pdf')?.getAttribute('href');
    const url = t('id').replace(/^http:/, 'https:');
    const id = url.replace(/^.*\/abs\//, '');
    return {
      id, url, title: t('title'), abstract: t('summary'), published: t('published'),
      authors: [...e.getElementsByTagName('author')].map(a => a.getElementsByTagName('name')[0]?.textContent.trim()).filter(Boolean),
      categories: [...e.getElementsByTagName('category')].map(c => c.getAttribute('term')),
      pdf: (pdf || `https://arxiv.org/pdf/${id}`).replace(/^http:/, 'https:')
    };
  }).filter(p => p.title);
  if (!papers.length) throw new Error('Empty feed');
  return papers;
}
async function grab(url) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 9000);
  try { const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error(r.status); return parseFeed(await r.text()); }
  finally { clearTimeout(t); }
}
async function loadPapers() {
  for (const [url, label] of [['/api/papers', 'Live from arXiv'], [API, 'Live from arXiv'], [PROXY + encodeURIComponent(API), 'Live from arXiv (via proxy)']]) {
    try { const papers = await grab(url); store.set('abstracted:cache', { at: Date.now(), papers }); return { papers, label }; } catch {}
  }
  const c = store.get('abstracted:cache', null);
  if (c?.papers?.length) return { papers: c.papers, label: 'Saved copy from ' + new Date(c.at).toLocaleString() };
  return { papers: MOCK, label: 'Offline sample deck. arXiv could not be reached.' };
}

/* ---------- Rendering ---------- */
const fmt = d => { const x = new Date(d); return isNaN(x) ? '' : x.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); };
const cur = () => S.papers[S.i];
const isSaved = id => S.saved.some(p => p.id === id);
function setFlip(on, animate = true) {
  if (!animate) card.classList.add('no-anim');
  S.flipped = on; card.classList.toggle('flipped', on);
  $('#front').inert = on; $('#back').inert = !on;
  $('#hint').textContent = on ? 'Tap the card to flip back' : 'Swipe for the next paper';
  if (!animate) { void card.offsetWidth; card.classList.remove('no-anim'); }
}
function render() {
  const p = cur(); if (!p) return;
  const title = clean(p.title), n = title.length;
  card.classList.remove('loading');
  $('#title').textContent = title;
  $('#title').style.setProperty('--fs', n > 170 ? '1.1rem' : n > 120 ? '1.28rem' : n > 80 ? '1.5rem' : '1.85rem');
  $('#miniTitle').textContent = title;
  $('#date').textContent = fmt(p.published);
  $('#chips').replaceChildren(...p.categories.slice(0, 3).map(c => Object.assign(document.createElement('span'), { className: 'chip', textContent: CATS[c] || c })));
  const a = p.authors; $('#authors').textContent = a.length > 6 ? `${a.slice(0, 6).join(', ')} and ${a.length - 6} more` : a.join(', ');
  $('#abstract').textContent = clean(p.abstract); $('#abstract').scrollTop = 0;
  $('#pdf').href = p.pdf;
  $('#count').textContent = `${S.i + 1} / ${S.papers.length}`;
  $('#prev').disabled = S.i === 0; $('#next').disabled = S.i === S.papers.length - 1;
  const body = `Hi Suva,\n\nWhat I liked:\n\nWhat could be better:\n\n(Viewing: ${title} ${p.url})`;
  $$('#feedback,#feedbackTop').forEach(l => l.href = `mailto:${MAIL}?subject=${encodeURIComponent('Abstracted feedback')}&body=${encodeURIComponent(body)}`);
  paintSaved(); setFlip(false, false);
}
function paintSaved() {
  const on = !!cur() && isSaved(cur().id);
  $$('.bm').forEach(b => { b.setAttribute('aria-pressed', on); b.setAttribute('aria-label', on ? 'Remove bookmark' : 'Bookmark paper'); });
  const b = $('#badge'); b.textContent = S.saved.length; b.hidden = !S.saved.length;
}

/* ---------- Actions ---------- */
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }
function flip() { if (!cur() || S.busy) return; buzz(15); setFlip(!S.flipped); }
async function go(dir) {
  const n = S.i + dir;
  if (S.busy || !cur()) return;
  if (n < 0 || n >= S.papers.length) { snap(); toast(n < 0 ? 'This is the newest paper' : 'That is the last paper in today\'s deck'); return; }
  S.busy = true; buzz(15);
  const w = innerWidth, ms = reduce ? 1 : 1;
  deck.style.transform = ''; 
  const out = deck.animate({ transform: `translateX(${-dir * w}px) rotate(${-dir * 14}deg)`, opacity: 0 }, { duration: reduce ? 1 : 190, easing: 'ease-in', fill: 'forwards' });
  await out.finished;
  S.i = n; render();
  const inn = deck.animate([{ transform: `translateX(${dir * w * .35}px) rotate(${dir * 6}deg)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: reduce ? 1 : 300, easing: 'cubic-bezier(.2,.9,.3,1)' });
  out.cancel(); await inn.finished; S.busy = false;
}
function snap() { deck.style.transition = 'transform .35s cubic-bezier(.3,1.5,.5,1)'; deck.style.transform = ''; }
function toggleSave() {
  const p = cur(); if (!p) return; buzz(15);
  if (isSaved(p.id)) { S.saved = S.saved.filter(x => x.id !== p.id); toast('Removed from Library'); }
  else { S.saved.unshift(p); toast('Saved to Library'); }
  store.set('abstracted:saved', S.saved); paintSaved(); if (!$('#library').hidden) renderLib();
}
async function share() {
  const p = cur(); if (!p) return;
  const data = { title: clean(p.title), text: `${clean(p.title)} (arXiv)`, url: p.url };
  try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(p.url); toast('Link copied'); } }
  catch (e) { if (e.name !== 'AbortError') toast('Could not share. Copy the link from the PDF page.'); }
}

/* ---------- Sheets ---------- */
let lastFocus;
function open(id) {
  closeSheets(true); const s = $(id); lastFocus = document.activeElement;
  s.hidden = false; requestAnimationFrame(() => { s.classList.add('open'); s.querySelector('.x').focus(); });
}
function closeSheets(now) {
  $$('.sheet:not([hidden])').forEach(s => {
    s.classList.remove('open');
    const done = () => { s.hidden = true; };
    now ? done() : setTimeout(done, 380);
  });
  if (!now) lastFocus?.focus?.();
}
function renderLib() {
  const ul = $('#libList');
  if (!S.saved.length) { ul.innerHTML = '<li class="empty">Nothing saved yet. Tap the bookmark on a card, or press B, to keep a paper here.</li>'; return; }
  ul.replaceChildren(...S.saved.map(p => {
    const li = document.createElement('li'); li.className = 'item';
    const go = Object.assign(document.createElement('button'), { className: 'go', textContent: clean(p.title) });
    go.onclick = () => { const k = S.papers.findIndex(x => x.id === p.id); if (k >= 0) { S.i = k; render(); closeSheets(); } else window.open(p.url, '_blank', 'noopener'); };
    const sm = Object.assign(document.createElement('small'), { textContent: `${p.authors.slice(0, 3).join(', ')}${p.authors.length > 3 ? ' et al.' : ''}` });
    const acts = document.createElement('div'); acts.className = 'acts';
    const a = Object.assign(document.createElement('a'), { href: p.pdf, target: '_blank', rel: 'noopener noreferrer', textContent: 'Open PDF' });
    const rm = Object.assign(document.createElement('button'), { className: 'rm', textContent: 'Remove' });
    rm.onclick = () => { S.saved = S.saved.filter(x => x.id !== p.id); store.set('abstracted:saved', S.saved); paintSaved(); renderLib(); };
    acts.append(a, rm); li.append(go, sm, acts); return li;
  }));
}

/* ---------- Gestures ---------- */
let g = null;
deck.addEventListener('pointerdown', e => {
  if (S.busy || e.button > 0 || e.target.closest('a,button')) return;
  g = { x: e.clientX, y: e.clientY, dx: 0, moved: false, t: performance.now(), scroll: e.target.closest('.scroll') };
  deck.style.transition = 'none';
});
addEventListener('pointermove', e => {
  if (!g) return;
  const dx = e.clientX - g.x, dy = e.clientY - g.y;
  if (!g.moved && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) g.moved = true;
  if (!g.moved) return;
  g.dx = dx; const edge = (dx > 0 && S.i === 0) || (dx < 0 && S.i === S.papers.length - 1) ? .3 : 1;
  deck.style.transform = `translateX(${dx * edge}px) rotate(${dx * edge / 28}deg)`;
});
const end = e => {
  if (!g) return; const s = g; g = null;
  const v = Math.abs(s.dx) / (performance.now() - s.t);
  if (s.moved && (Math.abs(s.dx) > 90 || v > .5)) go(s.dx < 0 ? 1 : -1);
  else if (s.moved) snap();
  else if (e.type === 'pointerup' && Math.abs(e.clientX - s.x) < 10 && Math.abs(e.clientY - s.y) < 10) flip();
  else snap();
};
addEventListener('pointerup', end); addEventListener('pointercancel', end);
addEventListener('keydown', e => {
  if (e.key === 'Escape') return closeSheets();
  if (!$('#library').hidden || !$('#about').hidden || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'ArrowRight') go(1);
  else if (e.key === 'ArrowLeft') go(-1);
  else if (e.key.toLowerCase() === 'b') toggleSave();
  else if (e.key === ' ' && !e.target.closest('a,button,.scroll')) { e.preventDefault(); flip(); }
});

/* ---------- Wire up ---------- */
$$('.bm').forEach(b => b.addEventListener('click', toggleSave));
$('#prev').onclick = () => go(-1); $('#next').onclick = () => go(1);
$('#share').onclick = share;
$('#openLib').onclick = () => { renderLib(); open('#library'); };
$('#openAbout').onclick = () => open('#about');
$$('[data-close]').forEach(el => el.addEventListener('click', () => closeSheets()));
paintSaved();

(async () => {
  $('#front').inert = false; $('#back').inert = true;
  const { papers, label } = await loadPapers();
  S.papers = papers; S.source = label; S.i = 0;
  $('#source').textContent = `Source: ${label}. ${papers.length} papers.`;
  render();
  if (!label.startsWith('Live')) toast(label.startsWith('Offline') ? 'Offline. Showing a sample deck.' : 'Offline. Showing your last saved deck.');
})();

if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
