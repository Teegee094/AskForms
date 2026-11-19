/**
 * AskForms Zero-Setup Popout Widget (Chat Window & Slide-Over Cart Drawer)
 * Drop a single <script src="https://your-host/widget.js" data-form="YOUR_FORM_ID" data-mode="drawer|popover" data-label="Get a Quote" defer></script>
 * onto any website (Webflow, WordPress, Squarespace, Wix, Shopify, HTML).
 * Any link to href="#askforms" or element with [data-askforms] also opens the popout automatically.
 */
(function () {
  if (window.__AskFormsWidgetLoaded) return;
  window.__AskFormsWidgetLoaded = true;

  var scriptEl =
    document.currentScript ||
    document.querySelector('script[data-form][src*="widget.js"]') ||
    document.querySelector('script[data-askforms-script]');

  var scriptSrc = (scriptEl && scriptEl.getAttribute('src')) || '';
  var hostOrigin = window.location.origin;
  try {
    if (scriptSrc) hostOrigin = new URL(scriptSrc, window.location.origin).origin;
  } catch (e) {}

  var defaultFormId = (scriptEl && scriptEl.getAttribute('data-form')) || 'audit-intake';
  var defaultMode = (scriptEl && scriptEl.getAttribute('data-mode')) || 'drawer'; // 'drawer' | 'popover'
  var launcherLabel = (scriptEl && scriptEl.getAttribute('data-label')) || 'Get a Quote';
  var accentColor = (scriptEl && scriptEl.getAttribute('data-accent')) || '#14383e';
  var position = (scriptEl && scriptEl.getAttribute('data-position')) || 'right'; // 'right' | 'left'
  var showLauncher = !scriptEl || scriptEl.getAttribute('data-launcher') !== 'false';
  var panelTitle = (scriptEl && scriptEl.getAttribute('data-title')) || launcherLabel;

  var isOpen = false;
  var activeFormId = defaultFormId;
  var activeMode = defaultMode;

  var style = document.createElement('style');
  style.id = 'askforms-widget-styles';
  style.textContent = [
    '.af-launcher{position:fixed;bottom:24px;' + (position === 'left' ? 'left:24px;' : 'right:24px;') + 'z-index:2147483640;height:52px;padding:0 22px;border-radius:9999px;border:1px solid rgba(255,255,255,0.16);background:' + accentColor + ';color:#ffffff;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:14.5px;font-weight:700;letter-spacing:-0.01em;box-shadow:0 12px 32px -6px rgba(14,42,47,0.34),0 2px 6px rgba(14,42,47,0.14);display:inline-flex;align-items:center;gap:10px;cursor:pointer;transition:transform 0.18s cubic-bezier(0.22,1,0.36,1),box-shadow 0.18s ease,opacity 0.18s ease;}',
    '.af-launcher:hover{transform:translateY(-2px);box-shadow:0 16px 38px -6px rgba(14,42,47,0.42),0 3px 8px rgba(14,42,47,0.18);}',
    '.af-launcher svg{flex-shrink:0;transition:transform 0.2s ease;}',
    '.af-backdrop{position:fixed;inset:0;background:rgba(14,42,47,0.38);backdrop-filter:blur(3px);z-index:2147483641;opacity:0;pointer-events:none;transition:opacity 0.24s ease;}',
    '.af-backdrop.af-open{opacity:1;pointer-events:auto;}',
    /* Slide-over Shopping-Cart Drawer Mode */
    '.af-panel{position:fixed;z-index:2147483642;background:#ffffff;color:#14383e;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 60px -12px rgba(14,42,47,0.28),0 4px 16px rgba(14,42,47,0.1);transition:transform 0.28s cubic-bezier(0.22,1,0.36,1),opacity 0.22s ease;opacity:0;pointer-events:none;}',
    '.af-panel.af-mode-drawer{top:12px;bottom:12px;' + (position === 'left' ? 'left:12px;transform:translateX(-106%);' : 'right:12px;transform:translateX(106%);') + 'width:min(440px,calc(100vw - 24px));border-radius:20px;border:1px solid rgba(20,56,62,0.1);}',
    '.af-panel.af-mode-drawer.af-open{transform:translateX(0);opacity:1;pointer-events:auto;}',
    /* Floating Chat Window Popover Mode */
    '.af-panel.af-mode-popover{bottom:88px;' + (position === 'left' ? 'left:24px;' : 'right:24px;') + 'width:min(400px,calc(100vw - 32px));height:min(600px,calc(100vh - 116px));border-radius:22px;border:1px solid rgba(20,56,62,0.12);transform:translateY(18px) scale(0.97);}',
    '.af-panel.af-mode-popover.af-open{transform:translateY(0) scale(1);opacity:1;pointer-events:auto;}',
    '.af-head{padding:16px 20px;background:' + accentColor + ';color:#ffffff;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-shrink:0;}',
    '.af-head-left{display:flex;align-items:center;gap:10px;min-width:0;}',
    '.af-head-title{font-size:15px;font-weight:700;letter-spacing:-0.015em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.af-head-sub{font-size:11.5px;color:rgba(230,255,250,0.75);font-weight:500;}',
    '.af-close{width:32px;height:32px;border-radius:999px;border:0;background:rgba(255,255,255,0.12);color:#ffffff;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:background 0.14s ease;}',
    '.af-close:hover{background:rgba(255,255,255,0.22);}',
    '.af-frame-wrap{flex:1;min-height:0;overflow-y:auto;background:#ffffff;scrollbar-width:none;-ms-overflow-style:none;}',
    '.af-frame-wrap::-webkit-scrollbar{display:none;}',
    '.af-iframe{width:100%;height:100%;min-height:480px;border:0;display:block;background:transparent;}'
  ].join('\n');
  document.head.appendChild(style);

  var markSvg =
    '<svg width="18" height="17" viewBox="0 0 256 240" fill="none" aria-hidden="true">' +
    '<rect x="0" y="0" width="252" height="32" rx="16" fill="currentColor"/>' +
    '<rect x="0" y="56" width="252" height="32" rx="16" fill="currentColor"/>' +
    '<path d="M16 112H236A16 16 0 0 1 236 144H229.1L204.8 124.8A27 27 0 0 0 161.1 144H16A16 16 0 0 1 16 112Z" fill="currentColor"/>' +
    '<rect x="0" y="168" width="154" height="32" rx="16" fill="currentColor"/>' +
    '<path d="M188 146L236 184L188 222" stroke="#4FD1C5" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';

  var closeSvg =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  var backdrop = document.createElement('div');
  backdrop.className = 'af-backdrop';

  var panel = document.createElement('aside');
  panel.className = 'af-panel af-mode-' + (activeMode === 'popover' ? 'popover' : 'drawer');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', panelTitle);
  panel.innerHTML =
    '<div class="af-head">' +
    '  <div class="af-head-left">' +
    markSvg +
    '    <div>' +
    '      <div class="af-head-title" id="af-panel-title">' + panelTitle + '</div>' +
    '      <div class="af-head-sub">Direct enquiry · Instant response</div>' +
    '    </div>' +
    '  </div>' +
    '  <button type="button" class="af-close" aria-label="Close">' + closeSvg + '</button>' +
    '</div>' +
    '<div class="af-frame-wrap">' +
    '  <iframe class="af-iframe" id="af-widget-iframe" title="' + panelTitle + '"></iframe>' +
    '</div>';

  var launcher = null;
  if (showLauncher) {
    launcher = document.createElement('button');
    launcher.type = 'button';
    launcher.className = 'af-launcher';
    launcher.setAttribute('aria-expanded', 'false');
    launcher.innerHTML = markSvg + '<span>' + launcherLabel + '</span>';
    document.body.appendChild(launcher);
  }

  document.body.appendChild(backdrop);
  document.body.appendChild(panel);

  var iframe = panel.querySelector('#af-widget-iframe');
  var loadedSrc = '';

  function ensureFrameLoaded(formId) {
    var targetSrc = hostOrigin + '/embed/' + encodeURIComponent(formId || defaultFormId);
    if (loadedSrc !== targetSrc) {
      loadedSrc = targetSrc;
      iframe.src = targetSrc;
    }
  }

  function openWidget(opts) {
    opts = opts || {};
    if (opts.formId) activeFormId = opts.formId;
    if (opts.mode) {
      activeMode = opts.mode;
      panel.className = 'af-panel af-mode-' + (activeMode === 'popover' ? 'popover' : 'drawer');
    }
    if (opts.title) {
      var titleEl = panel.querySelector('#af-panel-title');
      if (titleEl) titleEl.textContent = opts.title;
    }
    ensureFrameLoaded(activeFormId);
    isOpen = true;
    panel.classList.add('af-open');
    if (activeMode === 'drawer') {
      backdrop.classList.add('af-open');
    } else {
      backdrop.classList.remove('af-open');
    }
    if (launcher) launcher.setAttribute('aria-expanded', 'true');
  }

  function closeWidget() {
    isOpen = false;
    panel.classList.remove('af-open');
    backdrop.classList.remove('af-open');
    if (launcher) launcher.setAttribute('aria-expanded', 'false');
  }

  function toggleWidget(opts) {
    if (isOpen && (!opts || !opts.mode || opts.mode === activeMode)) closeWidget();
    else openWidget(opts);
  }

  if (launcher) {
    launcher.addEventListener('click', function () {
      toggleWidget();
    });
  }

  panel.querySelector('.af-close').addEventListener('click', closeWidget);
  backdrop.addEventListener('click', closeWidget);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) closeWidget();
  });

  // Automatically bind any link to #askforms / #askforms-<formId> or [data-askforms] on the client site
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-askforms], a[href^="#askforms"]');
    if (!trigger) return;
    e.preventDefault();
    var attrForm = trigger.getAttribute('data-askforms');
    var attrMode = trigger.getAttribute('data-askforms-mode');
    var attrTitle = trigger.getAttribute('data-askforms-title');
    var href = trigger.getAttribute('href') || '';
    var hashForm = href.indexOf('#askforms-') === 0 ? href.slice('#askforms-'.length) : '';
    openWidget({
      formId: attrForm || hashForm || defaultFormId,
      mode: attrMode || activeMode,
      title: attrTitle || undefined,
    });
  });

  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'formflow:resize' && iframe) {
      iframe.style.height = Math.max(460, Number(e.data.height) + 16) + 'px';
    }
  });

  window.AskForms = {
    open: openWidget,
    close: closeWidget,
    toggle: toggleWidget,
  };
})();
