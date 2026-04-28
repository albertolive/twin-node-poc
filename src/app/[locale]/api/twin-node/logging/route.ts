import { NextResponse } from "next/server";
import { twinNodeService } from "@/lib/services/twin-node.service";
import { getTwinNodeToken } from "@/lib/server/session";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const requested = Number(searchParams.get("pageSize"));
    const pageSize =
      Number.isFinite(requested) && requested > 0
        ? Math.min(Math.floor(requested), MAX_PAGE_SIZE)
        : DEFAULT_PAGE_SIZE;

    const logs = await twinNodeService.getLogging(token, pageSize);
    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error("Get logging error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
