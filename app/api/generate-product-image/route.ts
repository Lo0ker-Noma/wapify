import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

/**
 * POST /api/generate-product-image
 * multipart/form-data body:
 *  - image: File (the user's phone photo)
 *  - background: "white" | "black" | "transparent" | "lifestyle"
 *  - productName: string (used to enrich the prompt)
 *  - apiKey: string (OpenAI key, sent per-request — never stored server-side)
 *
 * Calls OpenAI's gpt-image-1 image edit endpoint with a curated prompt that
 * turns a casual phone shot into an e-commerce-ready studio photo.
 * The result is uploaded to Vercel Blob so the URL is permanent.
 */

const BACKGROUND_PROMPTS: Record<string, string> = {
  white:
    "pure clean white seamless background, studio lighting, soft shadows underneath the product, e-commerce hero shot, sharp focus on the product, no other objects",
  black:
    "deep matte black seamless background, dramatic studio lighting with a single soft rim light, high contrast, premium feel, e-commerce hero shot, sharp focus on the product",
  transparent:
    "fully transparent background, hard cut-out around the product, no shadow, ready to be composited, studio lighting, sharp focus",
  lifestyle:
    "natural lifestyle setting with shallow depth of field, warm golden hour lighting, magazine-quality composition, the product clearly the subject in the foreground",
};

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const image = form.get("image");
    const background = String(form.get("background") ?? "white");
    const productName = String(form.get("productName") ?? "product");
    const apiKey = String(form.get("apiKey") ?? "");

    if (!(image instanceof File)) {
      return NextResponse.json({ error: "missing image file" }, { status: 400 });
    }
    if (!apiKey || !apiKey.startsWith("sk-")) {
      return NextResponse.json(
        { error: "missing or invalid OpenAI API key" },
        { status: 400 }
      );
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "Vercel Blob not configured (BLOB_READ_WRITE_TOKEN missing)" },
        { status: 500 }
      );
    }

    const bgPrompt = BACKGROUND_PROMPTS[background] ?? BACKGROUND_PROMPTS.white;
    const prompt = [
      `Professional product photo of ${productName}.`,
      "Keep the exact same product, identity, shape, colors and details — only re-light and re-stage it.",
      bgPrompt,
      "Crisp focus, no text, no watermark, no logo overlays, no extra props.",
      "Square 1:1 framing.",
    ].join(" ");

    // ── Call OpenAI gpt-image-1 image edit endpoint ─────────────────
    const openaiForm = new FormData();
    openaiForm.append("model", "gpt-image-1");
    openaiForm.append("image", image, image.name || "input.png");
    openaiForm.append("prompt", prompt);
    openaiForm.append("n", "1");
    openaiForm.append("size", "1024x1024");
    if (background === "transparent") {
      openaiForm.append("background", "transparent");
    }

    const oaRes = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: openaiForm,
    });

    if (!oaRes.ok) {
      const errBody = await oaRes.text().catch(() => "");
      console.error("[openai image] error", oaRes.status, errBody);
      return NextResponse.json(
        { error: `OpenAI ${oaRes.status}: ${errBody.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const oaJson = (await oaRes.json()) as {
      data?: Array<{ b64_json?: string; url?: string }>;
    };
    const first = oaJson.data?.[0];
    if (!first?.b64_json && !first?.url) {
      return NextResponse.json(
        { error: "OpenAI response missing image data" },
        { status: 502 }
      );
    }

    // gpt-image-1 returns b64_json by default
    let buffer: Buffer;
    if (first.b64_json) {
      buffer = Buffer.from(first.b64_json, "base64");
    } else {
      const imgRes = await fetch(first.url!);
      buffer = Buffer.from(await imgRes.arrayBuffer());
    }

    // Upload to Vercel Blob so the URL is permanent
    const ext = background === "transparent" ? "png" : "png";
    const filename = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const blob = await put(filename, buffer, {
      access: "public",
      contentType: "image/png",
      addRandomSuffix: true,
    });

    return NextResponse.json({ url: blob.url });
  } catch (e: any) {
    console.error("[generate-product-image]", e);
    return NextResponse.json(
      { error: e?.message ?? "generation error" },
      { status: 500 }
    );
  }
}
