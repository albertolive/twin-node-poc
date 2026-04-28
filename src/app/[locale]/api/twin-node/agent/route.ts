import { NextResponse } from "next/server";
import { twinNodeService } from "@/lib/services/twin-node.service";
import { getTwinNodeToken } from "@/lib/server/session";

export async function GET(request: Request) {
  try {
    // Try service token first, then user token
    const token = await getTwinNodeToken();

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - No authentication token available",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("id");

    if (!agentId) {
      return NextResponse.json(
        {
          success: false,
          error: "Identity is required",
        },
        { status: 400 }
      );
    }

    const agent = await twinNodeService.getAgent(agentId, token);

    return NextResponse.json({
      success: true,
      data: agent,
    });
  } catch (error) {
    console.error("Get agent error:", error);

    if (
      error instanceof Error &&
      error.message.includes("identity profile endpoint")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
