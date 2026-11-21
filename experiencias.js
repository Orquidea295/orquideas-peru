(function () {
  'use strict';
  const cDoc = document.getElementById('exp_documento'), cAlt = document.getElementById('exp_altitud');
  if (!cDoc && !cAlt) return;
  const D = window.DATOS, T = D && D.tax, DET = window.DETALLE || {}, REFS = window.REFS || [];
  if (!D || !T) return;
  const N = D.nom.length;
  const e = s => (typeof esc === 'function' ? esc(s) : String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])));
  const fmt = x => x.toLocaleString('fr-FR');
  const pl = (x, s, p) => fmt(x) + ' ' + (x === 1 ? s : p);
  const azar = a => a[Math.floor(Math.random() * a.length)];
  const el = id => document.getElementById(id);

  const css = document.createElement('style');
  css.textContent = `
.exp-caja{font-family:"Times New Roman",Times,serif;color:#222;background:#FAF8F3;border:1px solid #e3e1da;border-radius:10px;padding:14px;box-sizing:border-box;max-width:100%}
.exp-caja *{box-sizing:border-box}
.exp-tit{margin:0 0 4px;color:#1F5135;font-size:1.25em}
.exp-sub{margin:0 0 12px;color:#555;font-size:.98em;line-height:1.4}
.exp-pasos{display:flex;flex-wrap:wrap;gap:10px;align-items:stretch}
.exp-paso{flex:1 1 220px;min-width:0;background:#fff;border:1px solid #e3e1da;border-radius:8px;padding:10px 12px;position:relative}
.exp-num{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:#1F5135;color:#fff;font-weight:bold;margin-right:6px;font-size:.95em}
.exp-paso:nth-child(2) .exp-num{background:#6B4C9A}
.exp-ptit{font-weight:bold;color:#1F5135;font-size:1.05em}
.exp-paso p{margin:8px 0 0;line-height:1.4;overflow-wrap:anywhere}
.exp-cita{font-style:italic;border-left:3px solid #6B4C9A;padding-left:8px;color:#333}
.exp-cita mark{background:#ece4f6;color:inherit;font-style:normal;font-weight:bold;padding:0 2px}
.exp-dato{color:#555;font-size:.93em}
.exp-btn{font-family:inherit;font-size:.95em;border:1px solid #1F5135;background:#fff;color:#1F5135;border-radius:6px;padding:6px 10px;cursor:pointer;margin:8px 6px 0 0}
.exp-btn:hover{background:#eef3ef}
.exp-btn.exp-prim{background:#1F5135;color:#fff}
.exp-btn.exp-prim:hover{background:#2a6a47}
.exp-nota{margin:12px 0 0;font-size:.95em;line-height:1.45;color:#444}
.exp-filas{display:flex;flex-direction:column;gap:4px;margin-top:6px}
.exp-fila{display:grid;grid-template-columns:112px 1fr;gap:8px;align-items:center;cursor:pointer;border:0;background:none;padding:2px 0;font-family:inherit;font-size:.95em;text-align:left;width:100%;color:inherit}
.exp-fila:hover .exp-barra,.exp-fila.exp-activa .exp-barra{background:#6B4C9A}
.exp-fila.exp-activa .exp-et{font-weight:bold;color:#6B4C9A}
.exp-et{white-space:nowrap;color:#333}
.exp-pista{display:block;background:#ede9e0;border-radius:4px;height:14px;overflow:hidden}
.exp-barra{display:block;background:#1F5135;height:100%;border-radius:4px;transition:background .15s}
.exp-der{display:block;min-width:0}
.exp-val{display:block;font-size:.85em;color:#444;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.exp-detalle{margin-top:12px;background:#fff;border:1px solid #e3e1da;border-radius:8px;padding:10px 12px}
.exp-detalle ul{margin:6px 0 0;padding-left:18px}
.exp-detalle li{margin:3px 0}
.exp-sp{font-style:italic;color:#1F5135;text-decoration:underline;cursor:pointer;background:none;border:0;padding:0;font-family:inherit;font-size:1em;text-align:left}
@media (max-width:420px){.exp-caja{padding:10px}.exp-fila{grid-template-columns:102px 1fr}.exp-et{font-size:.92em}.exp-tit{font-size:1.15em}}
`;
  document.head.appendChild(css);

  function irAlMapa(prep, despues) {
    if (typeof verVista !== 'function') return;
    verVista('mapa');
    setTimeout(() => {
      const lim = el('limpiar');
      if (lim && typeof lim.onclick === 'function') lim.onclick();
      prep();
      if (typeof filtrar === 'function') filtrar();
      despues();
    }, 100);
  }
  function verFicha(n) {
    if (typeof abrirFicha === 'function') { abrirFicha(n); return; }
    irAlMapa(() => { el('f_nombre').value = D.nombres[n]; }, () => { if (typeof encuadrar === 'function') encuadrar(11); });
  }
  const esEspecie = n => T[n] && T[n][5] && T[n][4];
  const sensible = n => !!T[n][10] || String(T[n][7] || '').split(/;\s*/).includes('I');

  // ---------- 1) Del documento al mapa ----------
  if (cDoc) {
    const lit = D.fuentes.indexOf('LITERATURA');
    const cand = [];
    const tieneLit = new Uint8Array(D.nombres.length), tieneOtra = new Uint8Array(D.nombres.length);
    let nLit = 0;
    for (let i = 0; i < N; i++) {
      if (D.ev[i] !== 1 || D.dup[i]) continue;
      const n = D.nom[i];
      if (D.fue[i] === lit) { tieneLit[n] = 1; nLit++; } else tieneOtra[n] = 1;
      if (D.fue[i] !== lit || sensible(n)) continue;
      const d = DET[i];
      if (esEspecie(n) && d && d[12] && String(d[12]).trim() && d[7] >= 0 && REFS[d[7]]) cand.push(i);
    }
    let soloLit = 0;
    for (let n = 0; n < D.nombres.length; n++) if (esEspecie(n) && tieneLit[n] && !tieneOtra[n]) soloLit++;

    const recorte = (s, max) => { s = String(s).replace(/\s+/g, ' ').trim(); if (s.length <= max) return s;
      const c = s.slice(0, max), k = c.lastIndexOf(' '); return (k > max * 0.6 ? c.slice(0, k) : c) + ' …'; };
    const marcar = (txt, nombre) => {
      let h = e(txt);
      const pal = String(nombre || '').split(/\s+/).filter(w => /^[A-Za-zÀ-ÿ.-]+$/.test(w)).slice(0, 2);
      const intentos = [pal.join(' '), pal[1] || ''].filter(x => x && x.length > 3);
      for (const q of intentos) { const qe = e(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); const re = new RegExp(qe, 'i');
        if (re.test(h)) return h.replace(re, m => '<mark>' + m + '</mark>'); }
      return h;
    };
    let actual = -1;
    function mostrarDoc() {
      if (!cand.length) { cDoc.innerHTML = ''; return; }
      let i = azar(cand); if (cand.length > 1) while (i === actual) i = azar(cand); actual = i;
      const d = DET[i], n = D.nom[i], sp = D.nombres[n], dep = D.dep[i] >= 0 ? D.deps[D.dep[i]] : '';
      const pag = String(d[13] || '').split(';')[0].trim();
      const org = D.org[i];
      let reg = '<p><b>Especie:</b> <i>' + e(sp) + '</i></p><p><b>Departamento:</b> ' + (dep ? e(dep) : 'sin dato') + '</p>';
      if (D.amin[i] > 0) reg += '<p><b>Altitud:</b> ' + fmt(D.amin[i]) + (D.amax[i] > D.amin[i] ? '–' + fmt(D.amax[i]) : '') + ' m</p>';
      if (org === 1 || org === 2) {
        reg += '<p class="exp-dato">' + (org === 1 ? 'El documento trae coordenadas, así que el registro aparece como un punto en el mapa.'
          : 'El documento no trae coordenadas: el punto se ubicó en el centro poblado mencionado y tiene una incertidumbre de unos 10 km.') + '</p>'
          + '<button class="exp-btn exp-prim" id="exp_doc_mapa">Verlo en el mapa</button>';
      } else {
        reg += '<p class="exp-dato">Sin coordenadas, el registro cuenta para la riqueza de especies del departamento, pero no aparece como punto en el mapa.</p>';
      }
      cDoc.innerHTML = '<div class="exp-caja">'
        + '<h3 class="exp-tit">Del documento al mapa</h3>'
        + '<p class="exp-sub">Así se convierte una mención en un libro o artículo en un registro de la plataforma. Ejemplo elegido al azar entre ' + fmt(cand.length) + ' menciones con su cita textual.</p>'
        + '<div class="exp-pasos">'
        + '<div class="exp-paso"><span class="exp-num">1</span><span class="exp-ptit">El documento</span><p>' + e(REFS[d[7]]) + '</p>' + (pag ? '<p class="exp-dato">Página: ' + e(pag.replace(/^p\.\s*/i, '')) + '</p>' : '') + '</div>'
        + '<div class="exp-paso"><span class="exp-num">2</span><span class="exp-ptit">La mención</span><p class="exp-cita">«' + marcar(recorte(d[12], 220), d[1]) + '»</p>'
        + (d[1] ? '<p class="exp-dato">Nombre tal como aparece: <i>' + e(d[1]) + '</i></p>' : '') + '</div>'
        + '<div class="exp-paso"><span class="exp-num">3</span><span class="exp-ptit">El registro</span>' + reg + '</div>'
        + '</div>'
        + '<button class="exp-btn" id="exp_doc_otro">Otro ejemplo</button>'
        + '<p class="exp-nota">¿Por qué importa? Muchas colectas publicadas en monografías, revisiones y floras no están en las bases digitales. En esta plataforma la literatura aporta ' + fmt(nLit) + ' registros con presencia explícita, sin contar duplicados'
        + (soloLit ? ', y ' + fmt(soloLit) + ' especies se conocen en el Perú solo por esa vía' : '') + '. Sin leer los documentos, esa información quedaría fuera del mapa.</p>'
        + '</div>';
      el('exp_doc_otro').onclick = mostrarDoc;
      const b = el('exp_doc_mapa');
      if (b) b.onclick = () => irAlMapa(() => { el('f_nombre').value = sp; },
        () => setTimeout(() => { if (typeof mapa !== 'undefined' && mapa.setView) mapa.setView([D.lat[i], D.lon[i]], 11, { animate: false }); }, 900));
    }
    mostrarDoc();
  }

  // ---------- 2) Viaje por la altitud ----------
  if (cAlt) {
    const PASO = 500;
    let maxA = 0, sinAlt = 0;
    for (let i = 0; i < N; i++) {
      if (D.ev[i] !== 1 || D.dup[i]) continue;
      if (D.amin[i] > 0) { const a = Math.max(D.amin[i], D.amax[i]); if (a > maxA) maxA = a; } else sinAlt++;
    }
    const nB = Math.max(1, Math.ceil((maxA + 1) / PASO));
    const regs = new Array(nB).fill(0), esp = [], vistos = [];
    for (let b = 0; b < nB; b++) { esp.push([]); vistos.push(new Uint8Array(D.nombres.length)); }
    for (let i = 0; i < N; i++) {
      if (D.ev[i] !== 1 || D.dup[i] || !(D.amin[i] > 0)) continue;
      const lo = D.amin[i], hi = D.amax[i];
      if (hi < lo) continue;
      const n = D.nom[i], ok = esEspecie(n);
      for (let b = Math.floor(lo / PASO); b <= Math.floor(hi / PASO) && b < nB; b++) {
        regs[b]++;
        if (ok && !vistos[b][n]) { vistos[b][n] = 1; esp[b].push(n); }
      }
    }
    let ult = nB - 1; while (ult > 0 && !regs[ult]) ult--;
    const maxEsp = Math.max(1, ...esp.slice(0, ult + 1).map(a => a.length));
    let sel = -1;
    function pintarAlt() {
      let filas = '';
      for (let b = 0; b <= ult; b++) {
        const v = esp[b].length, pc = Math.round(v / maxEsp * 100);
        filas += '<button class="exp-fila' + (b === sel ? ' exp-activa' : '') + '" data-b="' + b + '" aria-label="Franja de ' + fmt(b * PASO) + ' a ' + fmt((b + 1) * PASO) + ' m: ' + pl(v, 'especie', 'especies') + '">'
          + '<span class="exp-et">' + fmt(b * PASO) + '–' + fmt((b + 1) * PASO) + ' m</span>'
          + '<span class="exp-der"><span class="exp-pista"><span class="exp-barra" style="width:' + Math.max(pc, v ? 1 : 0) + '%"></span></span>'
          + '<span class="exp-val">' + pl(v, 'especie', 'especies') + ' · ' + pl(regs[b], 'registro', 'registros') + '</span></span></button>';
      }
      let det = '';
      if (sel >= 0) {
        const lista = esp[sel].slice(), ej = [];
        while (ej.length < 5 && lista.length) ej.push(lista.splice(Math.floor(Math.random() * lista.length), 1)[0]);
        ej.sort((a, b) => D.nombres[a].localeCompare(D.nombres[b], 'es'));
        det = '<div class="exp-detalle"><b>Entre ' + fmt(sel * PASO) + ' y ' + fmt((sel + 1) * PASO) + ' m</b>: ' + pl(esp[sel].length, 'especie', 'especies') + ' y ' + pl(regs[sel], 'registro', 'registros') + '.'
          + (ej.length ? '<div style="margin-top:6px">Algunas especies de esta franja:</div><ul>' + ej.map(n => '<li><button class="exp-sp" data-n="' + n + '">' + e(D.nombres[n]) + '</button></li>').join('') + '</ul>' : '')
          + '<button class="exp-btn" id="exp_alt_otras">Otras especies</button><button class="exp-btn exp-prim" id="exp_alt_mapa">Ver esta franja en el mapa</button></div>';
      }
      cAlt.innerHTML = '<div class="exp-caja">'
        + '<h3 class="exp-tit">Viaje por la altitud</h3>'
        + '<p class="exp-sub">Número de especies registradas en cada franja de 500 m, desde la llanura amazónica hasta la alta montaña. Un registro con un rango de altitud cuenta en todas las franjas que toca. Toque una franja para ver ejemplos.</p>'
        + '<div class="exp-filas">' + filas + '</div>' + det
        + '<p class="exp-nota">' + fmt(sinAlt) + ' registros no tienen dato de altitud y no se incluyen en este gráfico. Un registro con un rango de altitud cuenta en todas las franjas que toca; por eso las cifras difieren de la figura de altitud en Estadísticas.</p>'
        + '</div>';
    }
    cAlt.addEventListener('click', ev => {
      const f = ev.target.closest('.exp-fila');
      if (f) { const b = +f.dataset.b; sel = sel === b ? -1 : b; pintarAlt(); return; }
      const s = ev.target.closest('.exp-sp');
      if (s) { verFicha(+s.dataset.n); return; }
      if (ev.target.id === 'exp_alt_otras') { pintarAlt(); return; }
      if (ev.target.id === 'exp_alt_mapa' && sel >= 0) {
        const lo = sel * PASO, hi = (sel + 1) * PASO - 1;
        irAlMapa(() => { el('f_h1').value = lo; el('f_h2').value = hi; }, () => { if (typeof encuadrar === 'function') encuadrar(11); });
      }
    });
    pintarAlt();
  }
})();
