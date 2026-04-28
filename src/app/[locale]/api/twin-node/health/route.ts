import { NextResponse } from "next/server";
import { twinNodeService } from "@/lib/services/twin-node.service";

export async function GET() {
  try {
    const health = await twinNodeService.getHealth();
    return NextResponse.json({ success: true, data: health });
  } catch (error) {
    console.error("Get health error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
