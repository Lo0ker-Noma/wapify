/* Wapufy embed — vanilla JS, drop-in store renderer.
 *
 * Usage:
 *   <div id="store-root"></div>
 *   <script>window.WAPUFY_CONFIG = { products:[...], settings:{...}, meta:{...} };</script>
 *   <script src="https://wapify.vercel.app/embed.js"></script>
 */
(function () {
  "use strict";

  var cfg = window.WAPUFY_CONFIG || {};
  var rootId = cfg.rootId || "store-root";
  var root = document.getElementById(rootId);
  if (!root) {
    console.warn("[wapufy] element #" + rootId + " not found");
    return;
  }

  var baseUrl = (cfg.baseUrl || "https://wapify.vercel.app").replace(/\/+$/, "");
  var lnAddress = (cfg.settings && cfg.settings.lightningAddress) || "";
  var wapuUsername = (cfg.settings && cfg.settings.wapuUsername) || "";
  var products = Array.isArray(cfg.products) ? cfg.products : [];
  var meta = cfg.meta || {};
  var theme = cfg.theme || {
    accent: "#00ff9d",
    accent2: "#9945ff",
    bitcoin: "#f7931a",
    bg: "#0a0a0a",
    fg: "#ffffff",
    fgMuted: "#a0a0a0",
    cardBg: "#111111",
    border: "rgba(255,255,255,0.06)",
  };
  if (!theme.bitcoin) theme.bitcoin = "#f7931a";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function fmt(n) {
    return Number(n).toLocaleString("es-AR");
  }

  // Scoped CSS
  var styleId = "wapufy-embed-style";
  if (!document.getElementById(styleId)) {
    var style = document.createElement("style");
    style.id = styleId;
    style.textContent =
      ".wf-root{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:" +
      theme.fg +
      ";background:" +
      theme.bg +
      ";padding:32px 20px;border-radius:16px;border:1px solid " +
      theme.border +
      "}" +
      ".wf-kicker{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11px;letter-spacing:2px;color:" +
      theme.accent +
      ";text-transform:uppercase;margin-bottom:8px;display:block}" +
      ".wf-title{font-size:clamp(28px,5vw,44px);font-weight:700;letter-spacing:-1px;margin:0 0 8px}" +
      ".wf-sub{font-size:15px;color:" +
      theme.fgMuted +
      ";max-width:560px;margin:0 0 24px;line-height:1.5}" +
      ".wf-grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));margin-top:8px}" +
      ".wf-card{background:" +
      theme.cardBg +
      ";border:1px solid " +
      theme.border +
      ";border-radius:12px;padding:14px;transition:border-color .2s}" +
      ".wf-card:hover{border-color:" +
      theme.accent +
      "}" +
      ".wf-img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:8px;display:block;margin-bottom:12px;background:#222}" +
      ".wf-name{font-size:15px;font-weight:600;margin:0 0 4px}" +
      ".wf-subtitle{font-size:12px;color:" +
      theme.fgMuted +
      ";font-style:italic;margin:0 0 8px;line-height:1.4}" +
      ".wf-price{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:14px;font-weight:600;color:" +
      theme.bitcoin +
      ";margin:0 0 12px}" +
      ".wf-btn{display:block;text-align:center;padding:10px 14px;border-radius:8px;background:" +
      theme.accent +
      ";color:#000;font-weight:600;font-size:13px;text-decoration:none;border:none;cursor:pointer}" +
      ".wf-btn:hover{filter:brightness(1.1)}" +
      ".wf-tag{display:inline-block;font-size:10px;font-weight:700;padding:2px 8px;border-radius:100px;background:" +
      theme.accent +
      ";color:#000;letter-spacing:.5px;margin-bottom:6px}" +
      ".wf-foot{margin-top:24px;padding-top:16px;border-top:1px solid " +
      theme.border +
      ";font-size:11px;color:" +
      theme.fgMuted +
      ";text-align:center}" +
      ".wf-foot a{color:" +
      theme.accent +
      ";text-decoration:none}";
    document.head.appendChild(style);
  }

  function checkoutUrl(p) {
    var u =
      baseUrl +
      "/checkout?sats=" +
      encodeURIComponent(p.price) +
      "&product=" +
      encodeURIComponent(p.name);
    if (lnAddress) u += "&ln=" + encodeURIComponent(lnAddress);
    if (wapuUsername) u += "&wapu=" + encodeURIComponent(wapuUsername);
    return u;
  }

  var html = '<div class="wf-root">';
  if (meta.heroKicker)
    html += '<span class="wf-kicker">' + esc(meta.heroKicker) + "</span>";
  html +=
    '<h2 class="wf-title">' +
    esc(meta.heroTitle || meta.name || "Tienda") +
    "</h2>";
  var sub = meta.heroSubtitle || meta.bio;
  if (sub) html += '<p class="wf-sub">' + esc(sub) + "</p>";

  html += '<div class="wf-grid">';
  for (var i = 0; i < products.length; i++) {
    var p = products[i];
    html += '<div class="wf-card">';
    html +=
      '<img class="wf-img" src="' +
      esc(p.img) +
      '" alt="' +
      esc(p.name) +
      '" loading="lazy"/>';
    if (p.tag) html += '<span class="wf-tag">' + esc(p.tag) + "</span>";
    html += '<h3 class="wf-name">' + esc(p.name) + "</h3>";
    if (p.subtitle)
      html += '<p class="wf-subtitle">' + esc(p.subtitle) + "</p>";
    html += '<div class="wf-price">⚡ ' + fmt(p.price) + " sats</div>";
    html +=
      '<a class="wf-btn" href="' +
      esc(checkoutUrl(p)) +
      '" target="_blank" rel="noopener">Comprar con Lightning ⚡</a>';
    html += "</div>";
  }
  html += "</div>";

  html +=
    '<div class="wf-foot">⚡ Pagos con Lightning · Powered by <a href="' +
    baseUrl +
    '" target="_blank" rel="noopener">Wapufy</a></div>';
  html += "</div>";

  root.innerHTML = html;
})();
