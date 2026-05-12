import { NextResponse } from "next/server";
import { put, list } from "@vercel/blob";

/**
 * GET /api/store-data?slug=<slug>
 * POST /api/store-data?slug=<slug>  body: { products: Product[] }
 *
 * Persists product data to Vercel Blob (a single public JSON per store).
 * This lets the catalog be visible from any browser / device, not just the
 * admin's localStorage. Falls back to returning null if Blob isn't reachable
 * — the client then uses localStorage / defaults.
 */

function safeSlug(slug: string): string {
  return slug.replace(/[^a-z0-9_-]/gi, "");
}

function blobPath(slug: string, kind: string): string {
  const safeKind = kind === "meta" ? "meta" : "products";
  return `store-data/${safeKind}-${safeSlug(slug)}.json`;
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const kind = searchParams.get("kind") ?? "products";
  if (!slug) return NextResponse.json({ error: "missing slug" }, { status: 400 });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ data: null });
  }

  try {
    const path = blobPath(slug, kind);
    const { blobs } = await list({ prefix: path, limit: 1 });
    const blob = blobs.find((b) => b.pathname === path) ?? blobs[0];
    if (!blob) return NextResponse.json({ data: null });

    const res = await fetch(`${blob.url}?ts=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ data: null });
    const data = await res.json();
    return NextResponse.json(
      { data },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[store-data GET]", e);
    return NextResponse.json({ data: null });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const kind = searchParams.get("kind") ?? "products";
  if (!slug) return NextResponse.json({ error: "missing slug" }, { status: 400 });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Vercel Blob not configured (BLOB_READ_WRITE_TOKEN missing)" },
      { status: 500 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // Accept either {products: [...]} (legacy) or {data: ...}
  const payload = body?.data !== undefined ? body.data : body?.products;
  if (kind === "products" && !Array.isArray(payload)) {
    return NextResponse.json({ error: "products must be array" }, { status: 400 });
  }
  if (payload === undefined || payload === null) {
    return NextResponse.json({ error: "missing data payload" }, { status: 400 });
  }

  try {
    const path = blobPath(slug, kind);
    const blob = await put(path, JSON.stringify(payload, null, 2), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
    });
    return NextResponse.json({ ok: true, url: blob.url });
  } catch (e: any) {
    console.error("[store-data POST]", e);
    return NextResponse.json(
      { error: e?.message ?? "blob write error" },
      { status: 500 }
    );
  }
}
