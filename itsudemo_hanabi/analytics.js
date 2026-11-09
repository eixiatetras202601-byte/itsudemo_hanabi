/*
 * analytics.js — Google アナリティクス 4（GA4）の計測（公式の Google タグ gtag.js を使用）
 * このサイトに追加したファイルです。既存のゲームのファイルは、読み込みの行と game_start の呼び出しだけを追加しています。
 *
 *   page_view  … ページを開いたときに1回。GA4 の config が自動で送ります（手動では送らないので二重送信になりません）。
 *                このゲームは URL が変わらない1ページ構成なので、ページを開いたときの1回だけです。
 *   game_start … ゲームの開始が確定した処理から GameAnalytics.gameStart(key) を呼びます。
 *                同じ key（そのプレイのデータ）では1回しか送りません。key なしの場合は 0.8 秒以内の重複を無視します。
 *
 * 測定 ID は analytics.config.js の1か所だけで設定します。
 * 測定 ID が仮の値（G-XXXXXXXXX）または空のあいだは、gtag.js を読み込まず、Google へは何も送信しません。
 * gtag.js が読み込めない（オフライン・広告ブロッカーなど）ときも、ゲームはそのまま動きます。
 * 送るのはイベント名と GA4 が自動で付ける情報（ページ・ブラウザの種類など）だけです。氏名・メールアドレス・入力文字などは送りません。
 * Google シグナルと広告のパーソナライズは無効にしています。
 *
 *   analytics.config.js で設定できる項目：
 *     measurementId   … GA4 の測定 ID（必須）
 *     debug           … true にすると GA4 の DebugView に表示（確認用。公開時は書かない）
 *     waitForConsent  … true にすると GameAnalytics.setConsent(true) が呼ばれるまで何も送らない（同意画面を作る場合）
 */
(function () {
  'use strict';
  var C = window.GA4_CONFIG || {};
  var id = String(C.measurementId || '').trim();
  var enabled = /^G-[A-Z0-9]{4,}$/i.test(id) && !/^G-X+$/i.test(id);
  var CONSENT_KEY = 'ga4:consent', CID_KEY = 'ga4:cid';
  var consent = true;
  if (C.waitForConsent) {
    consent = null;                                  // waiting
    try { var c = localStorage.getItem(CONSENT_KEY); if (c === '1') consent = true; else if (c === '0') consent = false; } catch (e) {}
  }
  var pending = [];                                  // events kept while waiting for consent (memory only)
  var started = false;
  var seen = typeof WeakSet === 'function' ? new WeakSet() : null;
  var lastKeyless = 0;
  var sentLog = [];                                  // event names handed to gtag (for checking; not sent anywhere)

  // GA4 normally keeps its random client ID in a first-party cookie. That works in a browser and in the Android app
  // (page at https://localhost), but not in the iOS app, whose page uses the capacitor:// scheme where cookies are not kept.
  // There the client ID is kept in the app's own storage instead. It identifies the installation only, not the person.
  function httpPage() { return /^https?:$/.test(location.protocol); }
  function cookiesUsable() { return httpPage() && navigator.cookieEnabled !== false; }
  function clientId() {
    try {
      var v = localStorage.getItem(CID_KEY);
      if (!v) {
        var r = (window.crypto && crypto.getRandomValues) ? crypto.getRandomValues(new Uint32Array(1))[0] : Math.floor(Math.random() * 4294967295);
        v = r + '.' + Math.floor(Date.now() / 1000);
        localStorage.setItem(CID_KEY, v);
      }
      return v;
    } catch (e) { return undefined; }
  }

  function start() {
    if (started || !enabled || consent !== true) return;
    started = true;
    try {
      window['ga-disable-' + id] = false;
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      var cfg = {
        send_page_view: true,                        // the one page_view per app launch
        allow_google_signals: false,                 // no cross-device / advertising features
        allow_ad_personalization_signals: false
      };
      if (C.appName) cfg.page_title = C.appName;
      if (!cookiesUsable()) {                        // iOS app (capacitor://) or cookies switched off
        cfg.client_storage = 'none';
        var cid = clientId(); if (cid) cfg.client_id = cid;
      }
      if (!httpPage()) cfg.page_location = 'https://localhost' + (location.pathname || '/');   // iOS app: same page address as the Android app
      if (C.debug === true) cfg.debug_mode = true;   // shows in GA4 DebugView — test builds only
      window.gtag('config', id, cfg);
      sentLog.push('page_view');
      // Load the official tag once (skip if a Google tag for this ID is already on the page).
      if (!document.querySelector('script[src*="googletagmanager.com/gtag/js?id=' + id + '"]')) {
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
        s.onerror = function () { /* offline or blocked: the game keeps running, nothing is sent */ };
        (document.head || document.documentElement).appendChild(s);
      }
      var q = pending; pending = [];
      q.forEach(function (e) { send(e.name, e.params); });
    } catch (e) { /* analytics must never break the game */ }
  }

  function send(name, params) {
    if (!enabled || consent === false) return false;
    if (consent !== true) { pending.push({ name: name, params: params }); if (pending.length > 20) pending.shift(); return false; }
    start();
    try { window.gtag('event', name, params || {}); sentLog.push(name); return true; } catch (e) { return false; }
  }

  function gameStart(key) {
    if (key && (typeof key === 'object' || typeof key === 'function') && seen) {
      if (seen.has(key)) return false;               // this play was already counted
      seen.add(key);
    } else {
      var now = Date.now();
      if (now - lastKeyless < 800) return false;     // double tap / double binding
      lastKeyless = now;
    }
    return send('game_start');
  }

  function setConsent(granted) {
    consent = !!granted;
    try { localStorage.setItem(CONSENT_KEY, consent ? '1' : '0'); } catch (e) {}
    if (consent) { if (enabled) window['ga-disable-' + id] = false; start(); }
    else { pending = []; if (enabled) window['ga-disable-' + id] = true; }
  }

  window.GameAnalytics = {
    gameStart: gameStart, setConsent: setConsent,
    enabled: enabled, measurementId: enabled ? id : '',
    get consent() { return consent; }, get sent() { return sentLog.slice(); }
  };
  start();
})();
