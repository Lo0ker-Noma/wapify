"use client";

import type { Order } from "./orders";

/**
 * Build a self-contained HTML receipt document for an order.
 * The buyer (popup) and the admin (/pedidos) can both download this. It
 * inlines its own styles so it renders correctly when opened standalone
 * or when the user saves it as PDF via the browser's print dialog.
 */
export function buildReceiptHtml(order: Order, storeName = "LaCrypta"): string {
  const fmtDate = (ts?: number) =>
    ts
      ? new Date(ts).toLocaleString("es-AR", {
          dateStyle: "long",
          timeStyle: "short",
        })
      : "—";

  const shortInvoice = (s: string) =>
    s ? `${s.slice(0, 18)}…${s.slice(-12)}` : "—";

  const buyerLabel = order.buyerName?.trim()
    ? `<div class="row"><span class="lbl">Nombre</span><span class="val">${esc(order.buyerName.trim())}</span></div>`
    : "";

  const buyerNpubRow = order.buyerNpub?.trim()
    ? `<div class="row"><span class="lbl">Identificador Nostr</span><span class="val mono">${esc(order.buyerNpub.trim())}</span></div>`
    : "";

  const noteRow = order.buyerNote?.trim()
    ? `<div class="note">📝 <strong>Nota del cliente:</strong> ${esc(order.buyerNote.trim())}</div>`
    : "";

  const methodLabel = order.paymentMethod === "wapu" ? "Wapu (transferencia interna USDT)" : "Lightning Network";

  // Receiver row — different concept per rail. Lightning shows the LN
  // Address; Wapu shows the @usertag. They're independent systems.
  const receiverRow =
    order.paymentMethod === "wapu"
      ? order.wapuReceiver
        ? `<div class="row"><span class="lbl">Wapu</span><span class="val mono">@${esc(order.wapuReceiver)}</span></div>`
        : ""
      : order.lnAddress
        ? `<div class="row"><span class="lbl">Lightning Address</span><span class="val mono">${esc(order.lnAddress)}</span></div>`
        : "";

  const invoiceRow =
    order.paymentMethod !== "wapu" && order.invoice
      ? `<div class="row"><span class="lbl">Invoice</span><span class="val mono">${esc(shortInvoice(order.invoice))}</span></div>`
      : "";

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Recibo · ${esc(order.productName)} · ${esc(storeName)}</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:#fff;color:#111;margin:0;padding:40px 20px;line-height:1.55}
    .sheet{max-width:560px;margin:0 auto;border:1px solid #e5e5e5;border-radius:14px;overflow:hidden}
    .head{background:linear-gradient(135deg,#0a0a0a,#1a1a1a);color:#fff;padding:24px 28px}
    .store{font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#a0a0a0}
    .title{font-size:24px;font-weight:700;margin-top:6px;letter-spacing:-0.5px}
    .ok{display:inline-flex;align-items:center;gap:6px;background:rgba(0,255,157,0.12);color:#00ff9d;font-size:11px;font-weight:700;padding:4px 10px;border-radius:100px;letter-spacing:1px;text-transform:uppercase;margin-top:10px;border:1px solid rgba(0,255,157,0.4)}
    .body{padding:24px 28px}
    .amount{display:flex;justify-content:space-between;align-items:baseline;padding-bottom:18px;border-bottom:1px solid #eee;margin-bottom:18px}
    .amount .lbl{font-size:11px;text-transform:uppercase;letter-spacing:1.4px;color:#777;font-weight:600}
    .amount .val{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:28px;font-weight:700;color:#f7931a}
    .row{display:flex;justify-content:space-between;gap:16px;padding:8px 0;font-size:14px}
    .row .lbl{color:#777}
    .row .val{color:#111;text-align:right;word-break:break-all;max-width:65%}
    .mono{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px}
    .note{margin-top:18px;padding:12px 14px;background:#fef7e6;border-left:3px solid #f7931a;border-radius:4px;font-size:13px;color:#5a4a17}
    .foot{padding:16px 28px;background:#fafafa;color:#777;font-size:11px;text-align:center;border-top:1px solid #eee}
    .foot strong{color:#111}
    @media print {
      body{padding:0}
      .sheet{border:none;max-width:100%}
    }
    @page { margin: 12mm }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div class="store">Recibo de compra · ${esc(storeName)}</div>
      <div class="title">${esc(order.productName)}</div>
      ${order.status === "paid" ? `<div class="ok">✓ Pago confirmado</div>` : `<div class="ok" style="background:rgba(251,191,36,0.12);color:#fbbf24;border-color:rgba(251,191,36,0.4)">⏳ Pendiente</div>`}
    </div>
    <div class="body">
      <div class="amount">
        <span class="lbl">Total</span>
        <span class="val">⚡ ${order.amountSats.toLocaleString("es-AR")} sats</span>
      </div>
      ${buyerLabel}
      ${buyerNpubRow}
      <div class="row"><span class="lbl">Método</span><span class="val">${methodLabel}</span></div>
      ${receiverRow}
      ${invoiceRow}
      <div class="row"><span class="lbl">ID de orden</span><span class="val mono">${esc(order.id)}</span></div>
      <div class="row"><span class="lbl">Generado</span><span class="val">${fmtDate(order.createdAt)}</span></div>
      ${order.paidAt ? `<div class="row"><span class="lbl">Pagado</span><span class="val">${fmtDate(order.paidAt)}</span></div>` : ""}
      ${noteRow}
    </div>
    <div class="foot">
      Hecho con <strong>Wapufy</strong> — eCommerce soberano con Lightning y Wapu.<br/>
      Guardalo o imprimilo (Cmd/Ctrl+P) para tener constancia del pago.
    </div>
  </div>
</body>
</html>`;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Trigger a download of the receipt as a standalone HTML file. The user
 * can open it in any browser and print to PDF from there.
 */
export function downloadReceipt(order: Order, storeName?: string): void {
  if (typeof window === "undefined") return;
  const html = buildReceiptHtml(order, storeName);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeName = order.productName.replace(/[^a-z0-9\-_]+/gi, "_").slice(0, 40);
  a.download = `recibo-${safeName}-${order.id.slice(-6)}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Open the receipt in a new tab + auto-trigger the print dialog so the
 * buyer can save it as PDF straight away.
 */
export function printReceipt(order: Order, storeName?: string): void {
  if (typeof window === "undefined") return;
  const html = buildReceiptHtml(order, storeName);
  const w = window.open("", "_blank", "width=720,height=920");
  if (!w) {
    downloadReceipt(order, storeName);
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  // Give the browser a tick to layout, then prompt to print
  w.addEventListener("load", () => setTimeout(() => w.print(), 250));
}
