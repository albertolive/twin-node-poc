import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { twinNodeService } from "@/lib/services/twin-node.service";
import { getTwinNodeToken } from "@/lib/server/session";

export async function GET() {
  try {
    // Try service token first, then user token
    const token = await getTwinNodeToken();

    if (!token) {
      return NextResponse.json(
        {
          valid: false,
          error: "No token found",
        },
        { status: 401 }
      );
    }

    const result = await twinNodeService.verifyToken(token);

    if (!result.valid) {
      // Only clear user cookie if it was a user token
      // Service tokens are managed by the auth manager
      const cookieStore = await cookies();
      const userToken = cookieStore.get("twin_node_token")?.value;
      if (userToken === token) {
        cookieStore.delete("twin_node_token");
      }
    }

    return NextResponse.json(result, { status: result.valid ? 200 : 401 });
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json(
      {
        valid: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
