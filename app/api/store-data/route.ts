import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

function filePath(slug: string): string {
  // Sanitize slug to prevent path traversal
  const safe = slug.replace(/[^a-z0-9_-]/gi, "");
  return path.join(DATA_DIR, `products-${safe}.json`);
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "missing slug" }, { status: 400 });

  const file = filePath(slug);
  if (!fs.existsSync(file)) {
    return NextResponse.json({ products: null });
  }
  try {
    const raw = fs.readFileSync(file, "utf-8");
    return NextResponse.json({ products: JSON.parse(raw) });
  } catch {
    return NextResponse.json({ products: null });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "missing slug" }, { status: 400 });

  const body = await request.json();
  if (!Array.isArray(body.products)) {
    return NextResponse.json({ error: "products must be array" }, { status: 400 });
  }

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const file = filePath(slug);
  fs.writeFileSync(file, JSON.stringify(body.products, null, 2), "utf-8");
  return NextResponse.json({ ok: true });
}
