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

  var isSamsung = /SamsungBrowser/i.test(ua);
  var isEdge = /Edg(e|A|iOS)?\//i.test(ua);
  var isFirefox = /Firefox|FxiOS/i.test(ua);
  var isInApp = /FBAN|FBAV|Instagram|Line\/|WhatsApp|Snapchat|TikTok|Twitter|LinkedInApp|MicroMessenger/i.test(ua);
  var isChromeLike = /Chrome|CriOS/i.test(ua) && !isEdge && !isSamsung;
  var isSafari = /Safari/i.test(ua) && !/Chrome|CriOS|Chromium|Edg|FxiOS|SamsungBrowser|Android/i.test(ua);
  var NAME = (window.PWA_NAME || 'ASPM');

  function steps() {
    var A = 'Añadir a pantalla de inicio';
    if (isInApp) return { can: false, list: [
      'Estás en el navegador interno de otra app, que no permite instalar.',
      'Toca el menú <b>⋯</b> o <b>⋮</b> y elige <b>Abrir en Safari</b> / <b>Abrir en el navegador</b>.',
      'Después sigue los pasos de instalación desde ahí.'] };
    if (isIOS) return { can: false, list: [
      isSafari ? 'Estás en <b>Safari</b>: perfecto.' : 'Mejor con <b>Safari</b>; en Chrome/Edge también funciona desde el menú Compartir.',
      'Toca el botón <b>Compartir</b> ' + shareIcon + ' (abajo en el centro; arriba a la derecha en iPad).',
      'Desliza hacia abajo y toca <b>' + A + '</b> ' + plusIcon + '.',
      'Toca <b>Añadir</b>. El icono de ' + NAME + ' aparecerá en tu pantalla de inicio.'] };
    if (isAndroid) {
      if (deferred) return { can: true, list: [
        'Pulsa <b>Instalar ahora</b> y confirma <b>Instalar</b>.',
        'Encontrarás el icono de ' + NAME + ' en tu pantalla de inicio.'] };
      if (isSamsung) return { can: false, list: [
        'Abre el menú <b>☰</b> de Samsung Internet.',
        'Toca <b>Añadir página a</b> → <b>Pantalla de inicio</b> (o <b>Instalar app</b> si aparece).',
        'Confirma con <b>Añadir</b>.'] };
      if (isFirefox) return { can: false, list: [
        'Abre el menú <b>⋮</b> de Firefox.',
        'Toca <b>Instalar</b> (o <b>Añadir a pantalla de inicio</b>).',
        'Confirma con <b>Añadir</b>.'] };
      return { can: false, list: [
        'Abre el menú <b>⋮</b> de tu navegador.',
        'Toca <b>Instalar aplicación</b> o <b>' + A + '</b>.',
        'Confirma con <b>Instalar</b>.'] };
    }
    // Escritorio
    if (deferred) return { can: true, list: [
      'Pulsa <b>Instalar ahora</b>.',
      'En la ventana del navegador pulsa <b>Instalar</b> (o <b>Next</b> y luego <b>Install</b>).',
      NAME + ' se abrirá como una aplicación en su propia ventana.'] };
    if (isSafari) return { can: false, list: [
      'En la barra de menús de Safari abre <b>Archivo</b> → <b>Añadir al Dock…</b> (o botón <b>Compartir</b> ' + shareIcon + ' → <b>Añadir al Dock</b>).',
      'Confirma con <b>Añadir</b>.',
      NAME + ' aparecerá en tu Dock como una app (requiere macOS Sonoma o posterior).'] };
    if (isEdge) return { can: false, list: [
      'Abre el menú <b>⋯</b> de Edge → <b>Aplicaciones</b> → <b>Instalar este sitio como una aplicación</b>.',
      'Confirma con <b>Instalar</b>.', 'Si ya instalaste ' + NAME + ' antes, ábrela desde tus aplicaciones (chrome://apps) o desinstálala para poder instalarla de nuevo.'] };
    if (isChromeLike) return { can: false, list: [
      'Busca el icono de instalar ⊕ al final de la barra de direcciones, o abre el menú <b>⋮</b> → <b>Transmitir, guardar y compartir</b> → <b>Instalar página como aplicación</b>.',
      'Confirma con <b>Instalar</b>.', 'Si ya instalaste ' + NAME + ' antes, ábrela desde tus aplicaciones (chrome://apps) o desinstálala para poder instalarla de nuevo.'] };
    if (isFirefox) return { can: false, list: [
      'Firefox de escritorio no puede instalar webs como aplicaciones.',
      'Abre esta página en <b>Chrome</b>, <b>Edge</b> o <b>Safari</b> y sigue los pasos allí.'] };
    return { can: false, list: [
      'Abre el menú de tu navegador y busca <b>Instalar aplicación</b> o <b>Añadir al Dock</b>.',
      'Si no aparece, usa Chrome, Edge o Safari.'] };
  }

  var ov;
  function close() { if (ov) { ov.remove(); ov = null; } }
  function open() {
    close(); hideBanner();
    var s = steps();
    ov = document.createElement('div'); ov.className = 'aspm-i-ov';
    ov.innerHTML = '<div class="aspm-i-box" role="dialog" aria-modal="true" aria-label="Instalar app">' +
      '<h3>Instala la app de ' + NAME + '</h3>'+'<p class="s">Acceso directo desde tu pantalla de inicio, sin ocupar espacio.</p>' +
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
    banner.innerHTML = '<img src="icons/icon-192-v2.png" alt=""><div class="t"><b>Instala la app de ' + NAME + '</b>Añádela a tu pantalla de inicio</div>' +
      '<button class="aspm-i-btn" data-open>Cómo instalar</button><button class="aspm-i-x" aria-label="Cerrar" data-x>×</button>';
    banner.addEventListener('click', function (e) {
      if (e.target.hasAttribute('data-open')) open();
      else if (e.target.hasAttribute('data-x')) { hideBanner(); dismiss(); }
    });
    document.body.appendChild(banner);
  }


  /* Diagnóstico: abre la web con ?pwa-debug al final de la dirección para ver qué falla */
  function diagnose() {
    var out = [], link = document.querySelector('link[rel=manifest]');
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') out.push('❌ La web no está en HTTPS (obligatorio para instalar)');
    var ai = document.querySelector('link[rel=apple-touch-icon]');
    out.push(ai ? '✅ apple-touch-icon presente en el HTML' : '❌ Falta apple-touch-icon');
    if (!link) { out.push('❌ Falta <link rel="manifest">'); return Promise.resolve(out); }
    return fetch(link.href, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) { out.push('❌ manifest no encontrado (' + r.status + '): ' + link.href); throw 0; }
      out.push('✅ manifest OK'); return r.json();
    }).then(function (m) {
      return Promise.all((m.icons || []).map(function (i) {
        var u = new URL(i.src, link.href).href;
        return fetch(u, { cache: 'no-store' }).then(function (r) { out.push((r.ok ? '✅ ' : '❌ ') + 'icono ' + i.sizes + (r.ok ? ' OK' : ' NO CARGA (' + r.status + '): ' + u)); })
          .catch(function () { out.push('❌ icono no carga: ' + u); });
      }));
    }).catch(function () {}).then(function () {
      out.push(deferred ? '✅ El navegador permite instalar ahora' : '⚠️ El navegador NO ofrece instalar: si lo anterior está en ✅, la app ya está instalada en este navegador (desinstálala en chrome://apps y recarga)');
      return out;
    });
  }
  if (/pwa-debug/.test(location.search + location.hash)) {
    window.addEventListener('load', function () { setTimeout(function () {
      diagnose().then(function (o) {
        var d = document.createElement('pre');
        d.style.cssText = 'position:fixed;left:8px;right:8px;top:8px;z-index:100000;background:#111;color:#fff;padding:12px;border-radius:10px;font:12px/1.5 monospace;white-space:pre-wrap;max-height:70vh;overflow:auto';
        d.textContent = 'DIAGNÓSTICO INSTALACIÓN\n' + o.join('\n') + '\n\n(toca para cerrar)';
        d.onclick = function () { d.remove(); }; document.body.appendChild(d);
      });
    }, 3500); });
  }

  document.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('[data-install]'); if (t) { e.preventDefault(); open(); } });
  window.ASPM_showInstall = open;
  window.addEventListener('load', function () { setTimeout(showBanner, 2500); });
})();
