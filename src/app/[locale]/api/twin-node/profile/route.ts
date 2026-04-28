import { NextResponse } from "next/server";
import { twinNodeService } from "@/lib/services/twin-node.service";
import { getTwinNodeToken } from "@/lib/server/session";

export async function GET() {
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

    const profile = await twinNodeService.getOwnProfile(token);
    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error("Get own profile error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
