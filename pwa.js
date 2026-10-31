/* ASPM — instalación de la app con instrucciones paso a paso (iPhone, Android, escritorio) */
(function () {
  'use strict';
  var KEY = 'aspm-install-dismissed';
  var ua = navigator.userAgent || '';
  var isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isAndroid = /Android/i.test(ua);
  var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  var deferred = null;

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
  if (isStandalone) return;

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();          // evitamos la ventana nativa directa: mostramos primero nuestras instrucciones
    deferred = e;
  });
  window.addEventListener('appinstalled', function () { close(); hideBanner(); try { localStorage.setItem(KEY, String(Date.now() + 3.15e11)); } catch (e) {} });

  var css = '\
  .aspm-i-banner{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:99998;width:min(560px,calc(100% - 32px));background:#203746;color:#fff;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.3);padding:12px 14px;display:flex;align-items:center;gap:12px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}\
  .aspm-i-banner img{width:44px;height:44px;border-radius:10px;background:#fff;flex:none}\
  .aspm-i-banner .t{flex:1;min-width:0;font-size:14px;line-height:1.3}.aspm-i-banner .t b{display:block;font-size:15px}\
  .aspm-i-btn{background:#d5171f;color:#fff;border:0;border-radius:10px;padding:10px 14px;font:600 14px inherit;font-family:inherit;cursor:pointer;white-space:nowrap}\
  .aspm-i-x{background:transparent;border:0;color:#fff;opacity:.7;font-size:22px;line-height:1;cursor:pointer;padding:4px 6px}\
  .aspm-i-ov{position:fixed;inset:0;z-index:99999;background:rgba(15,25,32,.6);display:flex;align-items:flex-end;justify-content:center;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}\
  .aspm-i-box{background:#fff;color:#203746;width:min(520px,100%);border-radius:20px 20px 0 0;padding:22px 22px calc(22px + env(safe-area-inset-bottom,0px));max-height:90vh;overflow:auto}\
  @media(min-width:640px){.aspm-i-ov{align-items:center}.aspm-i-box{border-radius:20px}}\
  .aspm-i-box h3{margin:0 0 4px;font-size:20px}.aspm-i-box p.s{margin:0 0 16px;color:#5b6b76;font-size:14px}\
  .aspm-i-box ol{margin:0 0 18px;padding:0;list-style:none;counter-reset:s}\
  .aspm-i-box li{counter-increment:s;display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid #eef1f3;font-size:15px;line-height:1.4}\
  .aspm-i-box li:before{content:counter(s);flex:none;width:26px;height:26px;border-radius:50%;background:#203746;color:#fff;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center}\
  .aspm-i-box svg{vertical-align:-4px;margin:0 2px}\
  .aspm-i-row{display:flex;gap:10px}.aspm-i-row .aspm-i-btn{flex:1;padding:13px}.aspm-i-sec{background:#eef1f3;color:#203746}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var shareIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#007aff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/></svg>';
  var plusIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#203746" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';

  function steps() {
    if (isIOS) return { can: false, list: [
      'Abre esta página en <b>Safari</b> (no en el navegador de Instagram, WhatsApp, etc.).',
      'Toca el botón <b>Compartir</b> ' + shareIcon + ' (abajo en el centro, o arriba a la derecha en iPad).',
      'Desliza hacia abajo y toca <b>Añadir a pantalla de inicio</b> ' + plusIcon + '.',
      'Toca <b>Añadir</b>. ¡Listo! El icono de ASPM aparecerá en tu pantalla de inicio.'] };
    if (isAndroid) return { can: !!deferred, list: [
      'Pulsa el botón <b>Instalar ahora</b> de abajo y confirma <b>Instalar</b>.',
      'Si no aparece: abre el menú <b>⋮</b> de Chrome y elige <b>Instalar aplicación</b> o <b>Añadir a pantalla de inicio</b>.',
      'Encontrarás el icono de ASPM en tu pantalla de inicio.'] };
    return { can: !!deferred, list: [
      'Pulsa el botón <b>Instalar ahora</b> de abajo y confirma <b>Instalar</b> en la ventana del navegador.',
      'Si no aparece: en Chrome/Edge busca el icono de instalar ⊕ en la barra de direcciones, o menú <b>⋮</b> → <b>Instalar ASPM</b>.',
      'En Safari (Mac): menú <b>Archivo</b> → <b>Añadir al Dock</b>.',
      'ASPM se abrirá como una aplicación propia.'] };
  }

  var ov;
  function close() { if (ov) { ov.remove(); ov = null; } }
  function open() {
    close(); hideBanner();
    var s = steps();
    ov = document.createElement('div'); ov.className = 'aspm-i-ov';
    ov.innerHTML = '<div class="aspm-i-box" role="dialog" aria-modal="true" aria-label="Instalar ASPM">' +
      '<h3>Instala la app de ASPM</h3><p class="s">Acceso directo desde tu pantalla de inicio, sin ocupar espacio.</p>' +
      '<ol>' + s.list.map(function (x) { return '<li><span>' + x + '</span></li>'; }).join('') + '</ol>' +
      '<div class="aspm-i-row">' + (s.can ? '<button class="aspm-i-btn" data-go>Instalar ahora</button>' : '') +
      '<button class="aspm-i-btn aspm-i-sec" data-cl>' + (s.can ? 'Ahora no' : 'Entendido') + '</button></div></div>';
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.hasAttribute('data-cl')) { close(); dismiss(); }
      else if (e.target.hasAttribute('data-go') && deferred) { var d = deferred; deferred = null; close(); d.prompt(); d.userChoice.finally(function () {}); }
    });
    document.body.appendChild(ov);
  }

  var banner;
  function hideBanner() { if (banner) { banner.remove(); banner = null; } }
  function dismiss() { try { localStorage.setItem(KEY, String(Date.now() + 7 * 864e5)); } catch (e) {} }
  function showBanner() {
    try { if (Number(localStorage.getItem(KEY)) > Date.now()) return; } catch (e) {}
    banner = document.createElement('div'); banner.className = 'aspm-i-banner';
    banner.innerHTML = '<img src="icons/icon-192-v2.png" alt=""><div class="t"><b>Instala la app de ASPM</b>Añádela a tu pantalla de inicio</div>' +
      '<button class="aspm-i-btn" data-open>Cómo instalar</button><button class="aspm-i-x" aria-label="Cerrar" data-x>×</button>';
    banner.addEventListener('click', function (e) {
      if (e.target.hasAttribute('data-open')) open();
      else if (e.target.hasAttribute('data-x')) { hideBanner(); dismiss(); }
    });
    document.body.appendChild(banner);
  }

  document.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('[data-install]'); if (t) { e.preventDefault(); open(); } });
  window.ASPM_showInstall = open;
  window.addEventListener('load', function () { setTimeout(showBanner, 2500); });
})();
