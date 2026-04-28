import { NextResponse } from "next/server";
import { twinNodeService } from "@/lib/services/twin-node.service";
import { getTwinNodeToken } from "@/lib/server/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ did: string }> },
) {
  try {
    const token = await getTwinNodeToken();
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - No authentication token available",
        },
        { status: 401 },
      );
    }

    const { did } = await context.params;
    const decodedDid = decodeURIComponent(did);

    if (!decodedDid.startsWith("did:")) {
      return NextResponse.json(
        { success: false, error: "Path parameter must be a DID" },
        { status: 400 },
      );
    }

    const document = await twinNodeService.getDidDocument(decodedDid, token);

    return NextResponse.json({ success: true, data: document });
  } catch (error) {
    console.error("Get DID document error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
