import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

/**
 * POST /api/generate-product-image
 * multipart/form-data body:
 *  - image: File              — the user's phone photo (the subject)
 *  - productName: string      — used in the prompt
 *  - productSubtitle: string  — optional, adds descriptive context
 *  - background: white|black|transparent|lifestyle
 *  - reference0..reference3: string (URL)  — up to 4 sibling product images
 *    used as visual style references so the catalog stays cohesive
 *  - apiKey: string           — OpenAI key, sent per request
 *
 * Calls OpenAI gpt-image-1 image-edit endpoint with the subject + references,
 * stores result in Vercel Blob, returns permanent URL.
 */

const BACKGROUND_PROMPTS: Record<string, string> = {
  white:
    "pure clean white seamless background, soft shadow underneath, e-commerce hero shot",
  black:
    "deep matte black seamless background, dramatic single soft rim light, high contrast, premium feel",
  transparent:
    "fully transparent background, hard cut-out around the product, no shadow",
  lifestyle:
    "natural lifestyle setting, shallow depth of field, warm golden-hour lighting, magazine-quality composition with the product clearly the subject in the foreground",
};

async function urlToFile(url: string): Promise<{ blob: Blob; name: string } | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const blob = await res.blob();
    // OpenAI requires png/webp/jpg
    if (!/^image\/(png|jpeg|webp)/.test(blob.type)) return null;
    const ext = blob.type.split("/")[1] ?? "png";
    const name = `ref-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    return { blob, name };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const image = form.get("image");
    const background = String(form.get("background") ?? "white");
    const productName = String(form.get("productName") ?? "product");
    const productSubtitle = String(form.get("productSubtitle") ?? "");
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

    // Collect reference URLs (sibling products)
    const referenceUrls: string[] = [];
    for (let i = 0; i < 4; i++) {
      const u = form.get(`reference${i}`);
      if (typeof u === "string" && u.trim() && /^https:\/\//.test(u.trim())) {
        referenceUrls.push(u.trim());
      }
    }

    // Fetch reference images server-side (in parallel)
    const refFiles = (
      await Promise.all(referenceUrls.map((u) => urlToFile(u)))
    ).filter((r): r is { blob: Blob; name: string } => r !== null);

    const bgPrompt = BACKGROUND_PROMPTS[background] ?? BACKGROUND_PROMPTS.white;
    const subtitleClause = productSubtitle
      ? ` Product description: ${productSubtitle}.`
      : "";
    const refClause = refFiles.length
      ? ` IMPORTANT: match the exact visual style, lighting setup, framing, color grading and composition language of the reference product photos (passed as additional images), so this image fits seamlessly into the same catalog.`
      : "";

    const prompt = [
      `Generate a professional product photo of: ${productName}.${subtitleClause}`,
      `The first image is the real product — preserve its exact identity, shape, materials, colors, branding and details. Only re-light and re-stage it.`,
      bgPrompt + ".",
      refClause,
      "Crisp focus, square 1:1 framing, no text, no watermark, no logo overlays, no extra props.",
    ].join(" ").trim();

    // ── Build multipart request to OpenAI ─────────────────────────
    const openaiForm = new FormData();
    openaiForm.append("model", "gpt-image-1");
    // First image: the subject (user's phone photo)
    openaiForm.append("image[]", image, image.name || "subject.png");
    // Additional images: style references
    for (const ref of refFiles) {
      openaiForm.append("image[]", ref.blob, ref.name);
    }
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
        { error: `OpenAI ${oaRes.status}: ${errBody.slice(0, 300)}` },
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

    let buffer: Buffer;
    if (first.b64_json) {
      buffer = Buffer.from(first.b64_json, "base64");
    } else {
      const imgRes = await fetch(first.url!);
      buffer = Buffer.from(await imgRes.arrayBuffer());
    }

    const filename = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
    const blob = await put(filename, buffer, {
      access: "public",
      contentType: "image/png",
      addRandomSuffix: true,
    });

    return NextResponse.json({
      url: blob.url,
      referencesUsed: refFiles.length,
    });
  } catch (e: any) {
    console.error("[generate-product-image]", e);
    return NextResponse.json(
      { error: e?.message ?? "generation error" },
      { status: 500 }
    );
  }
}
