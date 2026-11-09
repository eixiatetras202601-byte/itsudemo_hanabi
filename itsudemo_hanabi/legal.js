/*
 * legal.js — 「利用規約」「プライバシーポリシー」の表示（このサイトに追加したファイル）
 *
 * 本文は terms.html と privacy.html（それぞれ単独のページとしても開けます）から読み込み、
 * ゲームの上にダイアログで表示します。ゲームの画面や動きは変えません。
 *   閉じる：「閉じる」ボタン／Esc キー／ダイアログの外側をクリック
 *   本文が長いときは、ダイアログの中だけがスクロールします（スマートフォン対応）
 *   読み込めないとき（HTML を直接ファイルとして開いた場合など）は、ページを別のタブで開くリンクを出します
 *
 *   LegalDocs.open('terms' | 'privacy')   … ダイアログを開く
 */
(function () {
  'use strict';
  if (window.LegalDocs) return;                      // load once
  var PAGES = {
    terms: { file: 'terms.html', title: '利用規約' },
    privacy: { file: 'privacy.html', title: 'プライバシーポリシー' }
  };
  var THEME = {"bg": "#0b0f1c", "fg": "var(--paper,#f2ece0)", "raised": "rgba(242,236,224,.06)", "line": "rgba(232,185,106,.34)", "accent": "var(--kin-soft,#f5dda9)", "muted": "var(--mist,rgba(242,236,224,.62))", "radius": "6px"};
  var cache = {};

  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'on') for (var ev in attrs.on) e.addEventListener(ev, attrs.on[ev]);
      else if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }

  function style() {
    if (document.getElementById('legal-style')) return;
    var t = THEME;
    var css =
      '.lg-root{--lg-bg:' + (t.bg || '#151b22') + ';--lg-fg:' + (t.fg || '#f3eee6') + ';--lg-raised:' + (t.raised || 'rgba(255,255,255,.06)') +
      ';--lg-line:' + (t.line || 'rgba(255,255,255,.22)') + ';--lg-accent:' + (t.accent || '#f0b46a') + ';--lg-muted:' + (t.muted || 'rgba(243,238,230,.72)') +
      ';--lg-radius:' + (t.radius || '14px') + ';--lg-font:' + (t.font || 'inherit') + '}' +
      'dialog.lg-dlg{box-sizing:border-box;width:min(680px,calc(100vw - 24px));max-width:none;height:auto;max-height:calc(100dvh - 24px - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px));' +
      'margin:auto;padding:0;border:1px solid var(--lg-line);border-radius:var(--lg-radius);background:var(--lg-bg);color:var(--lg-fg);font-family:var(--lg-font);' +
      'box-shadow:0 24px 80px rgba(0,0,0,.55);overflow:hidden;text-align:left;letter-spacing:normal}' +
      'dialog.lg-dlg[open]{display:flex;flex-direction:column}' +
      'dialog.lg-dlg::backdrop{background:rgba(0,0,0,.62)}' +
      '.lg-head{flex:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 12px 12px 20px;border-bottom:1px solid var(--lg-line)}' +
      '.lg-head h2{margin:0;font-size:18px;font-weight:700;line-height:1.4;letter-spacing:.04em}' +
      '.lg-close{flex:none;min-height:44px;min-width:44px;padding:8px 14px;border-radius:10px;border:1px solid var(--lg-line);background:transparent;color:var(--lg-fg);font:inherit;font-size:14px;cursor:pointer}' +
      '.lg-body{flex:1 1 auto;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:6px 20px 24px;font-size:14.5px;line-height:1.85}' +
      '.lg-body h2{font-size:15.5px;margin:1.6em 0 .4em;padding-bottom:.25em;border-bottom:1px solid var(--lg-line);line-height:1.5}' +
      '.lg-body h3{font-size:14.5px;margin:1.2em 0 .3em}' +
      '.lg-body p,.lg-body li{overflow-wrap:anywhere}.lg-body ul,.lg-body ol{padding-left:1.4em}' +
      '.lg-body a{color:var(--lg-accent);text-decoration:underline;text-underline-offset:3px}' +
      '.lg-body table{border-collapse:collapse;width:100%;font-size:13.5px;margin:.6em 0}' +
      '.lg-body th,.lg-body td{border:1px solid var(--lg-line);padding:6px 8px;text-align:left;vertical-align:top}' +
      '.lg-body th{background:var(--lg-raised);font-weight:600}' +
      '.lg-body .meta,.lg-body .note{color:var(--lg-muted);font-size:13px}' +
      '.lg-body .ph{background:rgba(255,205,90,.22);border-radius:3px;padding:0 .2em}' +
      '.lg-body .copyright{margin-top:2em;text-align:center;color:var(--lg-muted);font-size:13px}' +
      '.lg-root :focus-visible{outline:2px solid var(--lg-accent);outline-offset:2px}' +
      '@media (max-width:380px){.lg-head{padding-left:16px}.lg-head h2{font-size:16px;letter-spacing:0}.lg-body{padding:4px 16px 20px}}' +
      '.lg-btn{box-sizing:border-box;min-height:44px;padding:10px 16px;border-radius:10px;border:1px solid var(--lg-line);background:var(--lg-raised);' +
      'color:var(--lg-fg);font:inherit;font-size:15px;font-weight:600;cursor:pointer;text-align:center}' +
      '#panel .stack{position:relative}.lg-links{position:absolute;top:-8px;right:-6px;margin:0;display:flex;align-items:center;gap:0 2px;font-size:11px;letter-spacing:.1em;color:var(--mist,rgba(242,236,224,.62))}.lg-link{min-height:30px;padding:0 6px;background:none;border:0;color:inherit;font:inherit;letter-spacing:inherit;text-decoration:underline;text-underline-offset:3px;text-decoration-color:rgba(242,236,224,.3);cursor:pointer}.lg-link:hover{color:var(--paper,#f2ece0)}';
    document.head.appendChild(h('style', { id: 'legal-style', text: css }));
  }

  function load(key) {
    if (cache[key]) return Promise.resolve(cache[key]);
    return fetch(PAGES[key].file).then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.text(); })
      .then(function (text) {
        var doc = new DOMParser().parseFromString(text, 'text/html');
        var main = doc.getElementById('legal-body');
        if (!main) throw new Error('no body');
        var h1 = main.querySelector('h1'); if (h1) h1.parentNode.removeChild(h1);
        main.querySelectorAll('a[href^="http"]').forEach(function (a) { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener'); });
        cache[key] = main.innerHTML;
        return cache[key];
      });
  }

  function open(key) {
    var page = PAGES[key]; if (!page) return;
    style();
    var id = 'lg-t-' + key;
    var back = document.activeElement;
    var close = h('button', { type: 'button', 'class': 'lg-close', text: '閉じる' });
    var body = h('div', { 'class': 'lg-body', tabindex: '0', 'aria-busy': 'true' }, [h('p', { 'class': 'meta', text: '読み込み中…' })]);
    var d = h('dialog', { 'class': 'lg-dlg lg-root', 'aria-labelledby': id, lang: 'ja' }, [
      h('div', { 'class': 'lg-head' }, [h('h2', { id: id, text: page.title }), close]), body
    ]);
    close.addEventListener('click', function () { d.close(); });
    // keys stay inside the dialog: the game must not react to Space / Enter / Esc while it is open
    ['keydown', 'keyup', 'keypress'].forEach(function (t) { d.addEventListener(t, function (e) { e.stopPropagation(); }); });
    ['pointerdown', 'mousedown', 'touchstart', 'wheel'].forEach(function (t) { d.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });
    d.addEventListener('click', function (e) {          // click outside the box (on the backdrop) closes it
      e.stopPropagation();
      if (e.target !== d) return;
      var r = d.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
    });
    d.addEventListener('close', function () {
      if (d.parentNode) d.parentNode.removeChild(d);
      if (back && typeof back.focus === 'function' && document.contains(back)) back.focus();
    });
    document.body.appendChild(d);
    if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
    close.focus();
    load(key).then(function (html) {
      body.innerHTML = html; body.removeAttribute('aria-busy'); body.scrollTop = 0;
    }).catch(function () {
      body.innerHTML = '';
      body.appendChild(h('p', { text: page.title + 'を読み込めませんでした。' }));
      body.appendChild(h('p', {}, [h('a', { href: page.file, target: '_blank', rel: 'noopener', text: page.title + 'を別のタブで開く' })]));
      body.removeAttribute('aria-busy');
    });
    return d;
  }

  function button(key, cls) {
    return h('button', { type: 'button', 'class': cls || 'lg-btn', 'aria-haspopup': 'dialog', text: PAGES[key].title,
      on: { click: function (e) { e.stopPropagation(); open(key); } } });
  }

  window.LegalDocs = { open: open, button: button };

  // いつでも花火：設定パネルの右上（「打ち上げ数」の行の右端）に、2つのリンクを重ねて表示します。
  // パネルの高さや並びは変わりません（位置を固定した表示で、ほかの項目を押し下げない）。打ち上げ中は設定と一緒に隠れます。
  (function () {
    var settings = document.querySelector('#panel .settings');
    if (!settings || document.querySelector('#panel .lg-links')) return;
    style();
    settings.appendChild(h('p', { 'class': 'lg-links lg-root' }, [button('terms', 'lg-link'), h('span', { 'aria-hidden': 'true', text: '・' }), button('privacy', 'lg-link')]));
  })();
})();
