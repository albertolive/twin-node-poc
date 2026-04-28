import { cookies } from "next/headers";
import { twinNodeAuth } from "./twin-node-auth";

/**
 * Get the twin node authentication token.
 * Priority:
 * 1. Service token (from env vars) - if configured
 * 2. User token (from cookies) - if user is logged in
 * Returns null if neither is available.
 */
export async function getTwinNodeToken(): Promise<string | null> {
  // First, try service authentication (if configured via env vars)
  const serviceToken = await twinNodeAuth.getToken();
  if (serviceToken) {
    return serviceToken;
  }

  // Fallback to user authentication (from cookies)
  const cookieStore = await cookies();
  return cookieStore.get("twin_node_token")?.value || null;
}

/**
 * Get the twin node authentication token from cookies (legacy method).
 * @deprecated Use getTwinNodeToken() instead, which supports both service and user auth.
 */
export async function getTwinNodeTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("twin_node_token")?.value || null;
}
