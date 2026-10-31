/* ASPM — App instalable (PWA)
   Registra el service worker y añade el botón «Instalar app» en la barra superior.
   Usa las variables de color de cada página, así que encaja con su estilo. */
(function () {
  'use strict';

  /* ---------- Service worker ---------- */
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }

  /* ---------- Estado de instalación ---------- */
  var deferredPrompt = null;
  var buttons = [];

  function isStandalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
           window.navigator.standalone === true;
  }
  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }
  function isAndroid() { return /Android/i.test(navigator.userAgent); }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
  });
  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    buttons.forEach(function (b) { b.hidden = true; });
    closeSheet();
  });

  /* ---------- Estilos (heredan la paleta de la página) ---------- */
  var css = '' +
    '.pwa-install-btn{display:inline-flex;align-items:center;justify-content:center;gap:.4rem;padding:.2rem .75rem;border:0;border-radius:5px;' +
      'background:var(--accent,#BF0404);color:#fff;font:inherit;font-weight:800;letter-spacing:.1px;line-height:inherit;cursor:pointer;' +
      'transition:background .2s ease,transform .2s ease;-webkit-tap-highlight-color:transparent}' +
    '.pwa-install-btn:hover{background:var(--accent-hover,#D94E4E);transform:translateY(-1px)}' +
    '.pwa-install-btn:focus-visible{outline:2px solid #FFD400;outline-offset:2px}' +
    '.pwa-install-btn[hidden]{display:none!important}' +
    '.pwa-install-btn svg{width:.95em;height:.95em;flex:none}' +
    '.pwa-install-btn.pwa-floating{position:fixed;left:max(1rem,env(safe-area-inset-left));bottom:max(1rem,env(safe-area-inset-bottom));z-index:9998;' +
      'padding:.65rem 1.05rem;border-radius:999px;box-shadow:0 10px 30px -5px rgba(0,0,0,.35);font-size:.9rem}' +
    '.pwa-overlay{position:fixed;inset:0;z-index:10000;display:flex;align-items:flex-end;justify-content:center;background:rgba(13,13,13,.55);' +
      'padding:1rem;opacity:0;transition:opacity .2s ease}' +
    '.pwa-overlay.show{opacity:1}' +
    '.pwa-sheet{width:100%;max-width:440px;background:var(--bg-alt,#fff);color:var(--text-dark,#0D0D0D);border-radius:var(--radius,16px);' +
      'padding:1.5rem 1.4rem 1.3rem;box-shadow:0 25px 60px -10px rgba(0,0,0,.45);transform:translateY(16px);transition:transform .25s ease;' +
      'font-family:inherit;font-size:.95rem;line-height:1.55;max-height:90vh;overflow:auto}' +
    '.pwa-overlay.show .pwa-sheet{transform:none}' +
    '.pwa-sheet-head{display:flex;align-items:center;gap:.85rem;margin-bottom:.9rem}' +
    '.pwa-sheet-head img{width:52px;height:52px;border-radius:12px;flex:none}' +
    '.pwa-sheet h2{font-size:1.1rem;line-height:1.25;margin:0;color:var(--text-dark,#0D0D0D)}' +
    '.pwa-sheet p{margin:.2rem 0 0;color:var(--text-muted,#5A5A5A);font-size:.88rem}' +
    '.pwa-sheet ol{margin:.6rem 0 1rem;padding-left:1.25rem}' +
    '.pwa-sheet li{margin:.35rem 0}' +
    '.pwa-sheet li b{color:var(--accent,#BF0404)}' +
    '.pwa-close{display:block;width:100%;padding:.7rem 1rem;border:0;border-radius:10px;background:var(--accent,#BF0404);color:#fff;' +
      'font:inherit;font-weight:700;cursor:pointer}' +
    '.pwa-close:hover{background:var(--accent-hover,#D94E4E)}' +
    '.pwa-close:focus-visible{outline:2px solid var(--primary,#0D0D0D);outline-offset:2px}' +
    '.pwa-install-btn{white-space:nowrap}' +
    '@media(min-width:700px){.topbar-actions{flex-shrink:0;white-space:nowrap}.topbar-actions>a,.topbar-actions>button{white-space:nowrap}}' +
    '@media(min-width:600px){.pwa-overlay{align-items:center}}' +
    '@media(prefers-reduced-motion:reduce){.pwa-overlay,.pwa-sheet,.pwa-install-btn{transition:none}}';
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------- Hoja con instrucciones (iPhone y navegadores sin instalación directa) ---------- */
  var overlay = null, lastFocus = null;

  function steps() {
    if (isIOS()) {
      return ['Toca el botón <b>Compartir</b> <span aria-hidden="true">(el cuadrado con la flecha hacia arriba)</span> de Safari.',
              'Desplázate y elige <b>«Añadir a pantalla de inicio»</b>.',
              'Pulsa <b>«Añadir»</b>. ¡Listo! ASPM aparecerá como una app más.'];
    }
    if (isAndroid()) {
      return ['Abre el menú <b>⋮</b> de tu navegador (arriba a la derecha).',
              'Elige <b>«Instalar aplicación»</b> o <b>«Añadir a pantalla de inicio»</b>.',
              'Confirma con <b>«Instalar»</b>. ASPM aparecerá junto a tus demás apps.'];
    }
    return ['Busca el icono de <b>instalar</b> en la barra de direcciones de tu navegador (Chrome o Edge), a la derecha.',
            'Pulsa <b>«Instalar»</b>.',
            'ASPM se abrirá en su propia ventana, como una app de escritorio.'];
  }

  function openSheet() {
    if (overlay) return;
    lastFocus = document.activeElement;
    overlay = document.createElement('div');
    overlay.className = 'pwa-overlay';
    overlay.innerHTML =
      '<div class="pwa-sheet" role="dialog" aria-modal="true" aria-labelledby="pwa-title">' +
        '<div class="pwa-sheet-head"><img src="icons/icon-192.png" alt="" width="52" height="52">' +
        '<div><h2 id="pwa-title">Instala la app de ASPM</h2><p>Ábrela desde tu pantalla de inicio, a pantalla completa y más rápido.</p></div></div>' +
        '<ol>' + steps().map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol>' +
        '<button type="button" class="pwa-close">Entendido</button>' +
      '</div>';
    document.body.appendChild(overlay);
    requestAnimationFrame(function () { overlay && overlay.classList.add('show'); });
    var close = overlay.querySelector('.pwa-close');
    close.focus();
    close.addEventListener('click', closeSheet);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeSheet(); });
    document.addEventListener('keydown', onKey);
  }
  function onKey(e) { if (e.key === 'Escape') closeSheet(); }
  function closeSheet() {
    if (!overlay) return;
    document.removeEventListener('keydown', onKey);
    overlay.remove(); overlay = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------- Botón «Instalar app» ---------- */
  function onInstallClick() {
    if (deferredPrompt) {
      var p = deferredPrompt;
      deferredPrompt = null;
      p.prompt();
      if (p.userChoice) p.userChoice.then(function () {}).catch(function () {});
      return;
    }
    openSheet();
  }

  function makeButton(floating) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'pwa-install-btn' + (floating ? ' pwa-floating' : '');
    b.setAttribute('aria-label', 'Instalar la app de ASPM');
    b.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></svg><span>Instalar app</span>';
    b.addEventListener('click', onInstallClick);
    buttons.push(b);
    return b;
  }

  function mount() {
    if (isStandalone()) return; // ya instalada: no mostramos el botón
    var actions = document.querySelector('.topbar-actions');
    if (actions) {
      var btn = makeButton(false);
      var mail = actions.querySelector('a[href^="mailto:"]');
      actions.insertBefore(btn, mail || null);
    } else {
      document.body.appendChild(makeButton(true));
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
