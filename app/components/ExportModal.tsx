"use client";

import { useMemo, useState } from "react";
import { Product } from "@/lib/products";
import { StoreSettings } from "@/lib/settings";
import { StoreMeta } from "@/lib/store-meta";

type Tab = "snippet" | "json";

export default function ExportModal({
  products,
  settings,
  meta,
  baseUrl,
  onClose,
}: {
  products: Product[];
  settings: StoreSettings;
  meta: StoreMeta;
  baseUrl: string;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("snippet");
  const [copied, setCopied] = useState<Tab | null>(null);

  const config = useMemo(
    () => ({
      products,
      settings: {
        lightningAddress: settings.lightningAddress,
        wapuUsername: settings.wapuUsername,
      },
      meta,
      baseUrl,
    }),
    [products, settings, meta, baseUrl]
  );

  const json = useMemo(() => JSON.stringify(config, null, 2), [config]);

  const snippet = useMemo(
    () =>
      `<!-- Wapufy embed — pegá este snippet donde quieras la tienda -->
<div id="store-root"></div>
<script>
window.WAPUFY_CONFIG = ${json};
</script>
<script src="${baseUrl}/embed.js" defer></script>`,
    [json, baseUrl]
  );

  function copy(text: string, which: Tab) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(which);
      setTimeout(() => setCopied(null), 1600);
    });
  }

  function download(filename: string, content: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const active = tab === "snippet" ? snippet : json;
  const ext = tab === "snippet" ? "html" : "json";
  const mime = tab === "snippet" ? "text/html" : "application/json";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--dark-gray)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: 24,
          width: "100%",
          maxWidth: 720,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 14,
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                marginBottom: 4,
              }}
            >
              Exportar tienda
            </h3>
            <p
              className="muted"
              style={{ fontSize: 13, margin: 0, maxWidth: 540 }}
            >
              Pegá el snippet en cualquier sitio web (HTML, WordPress, Notion
              embed…) y tu tienda se renderiza al instante. Los pagos siguen
              llegando a tu Lightning Address.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--muted)",
              fontSize: 22,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 12,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <TabBtn active={tab === "snippet"} onClick={() => setTab("snippet")}>
            HTML Snippet
          </TabBtn>
          <TabBtn active={tab === "json"} onClick={() => setTab("json")}>
            store-config.json
          </TabBtn>
        </div>

        <textarea
          readOnly
          value={active}
          style={{
            flex: 1,
            minHeight: 280,
            width: "100%",
            background: "var(--black)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 8,
            padding: 14,
            color: "var(--text-secondary)",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            lineHeight: 1.5,
            resize: "vertical",
            outline: "none",
            marginBottom: 14,
          }}
        />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => copy(active, tab)}
            className="btn btn-primary"
          >
            {copied === tab
              ? "✓ Copiado"
              : tab === "snippet"
              ? "Copiar snippet"
              : "Copiar JSON"}
          </button>
          <button
            onClick={() =>
              download(
                tab === "snippet" ? "wapufy-embed.html" : "store-config.json",
                active,
                mime
              )
            }
            className="btn btn-outline"
          >
            ⬇ Descargar .{ext}
          </button>
          {tab === "snippet" && (
            <a
              href={`${baseUrl}/embed.js`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
              style={{ marginLeft: "auto" }}
            >
              Ver embed.js →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        border: "none",
        padding: "10px 14px",
        color: active ? "var(--primary)" : "var(--text-secondary)",
        fontWeight: active ? 700 : 500,
        fontSize: 13,
        cursor: "pointer",
        borderBottom: active ? "2px solid var(--primary)" : "2px solid transparent",
        marginBottom: -1,
      }}
    >
      {children}
    </button>
  );
}
