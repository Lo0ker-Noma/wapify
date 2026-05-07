import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

/**
 * Client upload token handler for @vercel/blob.
 * The browser calls upload(name, file, { handleUploadUrl: '/api/upload' }),
 * which posts here to get a signed token and then PUTs directly to blob storage.
 *
 * Requires BLOB_READ_WRITE_TOKEN env var (auto-set by Vercel when a Blob store
 * is connected to the project).
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("[upload] BLOB_READ_WRITE_TOKEN not set");
    return NextResponse.json(
      {
        error:
          "Vercel Blob no está configurado. Conectá un Blob store al proyecto en Vercel → Storage → Create Database → Blob, y volvé a intentar tras el redeploy.",
      },
      { status: 500 }
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => ({
        allowedContentTypes: [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
          "image/avif",
        ],
        addRandomSuffix: true,
        maximumSizeInBytes: 5 * 1024 * 1024, // 5 MB
        tokenPayload: JSON.stringify({ pathname }),
      }),
      onUploadCompleted: async ({ blob }) => {
        // No DB to update — products live in localStorage on the admin's device.
        // Just log for visibility in Vercel logs.
        console.log("[blob upload]", blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "upload error" },
      { status: 400 }
    );
  }
}
