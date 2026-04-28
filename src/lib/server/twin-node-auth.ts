/**
 * Server-side authentication manager for Twin Node.
 * Automatically authenticates using environment variables on first use.
 * This allows the frontend to be agnostic and always connected to the node.
 */

import { twinNodeService } from "../services/twin-node.service";

type ServiceAuthState = {
  token: string | null;
  expiry: number | null;
  identity: string | null;
  isAuthenticating: boolean;
  lastError: string | null;
};

class TwinNodeAuthManager {
  private static instance: TwinNodeAuthManager | null = null;
  private authState: ServiceAuthState = {
    token: null,
    expiry: null,
    identity: null,
    isAuthenticating: false,
    lastError: null,
  };
  private authPromise: Promise<void> | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): TwinNodeAuthManager {
    if (!TwinNodeAuthManager.instance) {
      TwinNodeAuthManager.instance = new TwinNodeAuthManager();
    }
    return TwinNodeAuthManager.instance;
  }

  /**
   * Get service account credentials from environment variables.
   * Returns null if not configured (allows fallback to user authentication).
   */
  private getServiceCredentials(): { email: string; password: string } | null {
    const email = process.env.TWIN_NODE_SERVICE_EMAIL;
    const password = process.env.TWIN_NODE_SERVICE_PASSWORD;

    if (!email || !password) {
      return null;
    }

    return { email, password };
  }

  /**
   * Check if service authentication is configured.
   */
  public isServiceAuthConfigured(): boolean {
    return this.getServiceCredentials() !== null;
  }

  /**
   * Check if the current token is valid and not expired.
   */
  private isTokenValid(): boolean {
    if (!this.authState.token || !this.authState.expiry) {
      return false;
    }

    // Refresh token if it expires within 5 minutes
    const bufferTime = 5 * 60 * 1000; // 5 minutes
    return this.authState.expiry > Date.now() + bufferTime;
  }

  /**
   * Authenticate with Twin Node using service credentials.
   * This is called automatically on first use if credentials are configured.
   */
  private async authenticate(): Promise<void> {
    const credentials = this.getServiceCredentials();
    if (!credentials) {
      this.authState.lastError = "Service credentials not configured";
      throw new Error("Service credentials not configured");
    }

    if (this.authState.isAuthenticating && this.authPromise) {
      // If already authenticating, wait for that promise
      return this.authPromise;
    }

    this.authState.isAuthenticating = true;
    this.authPromise = (async () => {
      try {
        const result = await twinNodeService.login(
          credentials.email,
          credentials.password
        );

        if (!result.success || !result.token) {
          const error = result.error || "Authentication failed";
          this.authState.lastError = error;
          throw new Error(error);
        }

        this.authState = {
          token: result.token,
          expiry: result.expiry || null,
          identity: result.identity || null,
          isAuthenticating: false,
          lastError: null,
        };

        if (process.env.NODE_ENV === "development") {
          console.log(
            `[TwinNodeAuth] Service authenticated successfully. Identity: ${this.authState.identity}`
          );
        }
      } catch (error) {
        this.authState.isAuthenticating = false;
        this.authState.lastError =
          error instanceof Error ? error.message : "Unknown error";
        throw error;
      } finally {
        this.authPromise = null;
      }
    })();

    return this.authPromise;
  }

  /**
   * Get a valid authentication token.
   * Automatically authenticates if needed and credentials are configured.
   * Returns null if service auth is not configured (allows fallback to user auth).
   */
  public async getToken(): Promise<string | null> {
    // If service auth is not configured, return null (fallback to user auth)
    if (!this.isServiceAuthConfigured()) {
      return null;
    }

    // If token is valid, return it
    if (this.isTokenValid()) {
      return this.authState.token;
    }

    // Otherwise, authenticate (or wait for ongoing authentication)
    try {
      await this.authenticate();
      return this.authState.token;
    } catch (error) {
      console.error("[TwinNodeAuth] Failed to authenticate:", error);
      return null;
    }
  }

  /**
   * Get the service identity (DID) if authenticated.
   */
  public getIdentity(): string | null {
    return this.authState.identity;
  }

  /**
   * Clear the authentication state (useful for testing or re-authentication).
   */
  public clearAuth(): void {
    this.authState = {
      token: null,
      expiry: null,
      identity: null,
      isAuthenticating: false,
      lastError: null,
    };
    this.authPromise = null;
  }

  /**
   * Get authentication status for debugging.
   */
  public getStatus(): {
    isConfigured: boolean;
    isAuthenticated: boolean;
    hasValidToken: boolean;
    identity: string | null;
    lastError: string | null;
  } {
    return {
      isConfigured: this.isServiceAuthConfigured(),
      isAuthenticated: !!this.authState.token,
      hasValidToken: this.isTokenValid(),
      identity: this.authState.identity,
      lastError: this.authState.lastError,
    };
  }
}

export const twinNodeAuth = TwinNodeAuthManager.getInstance();
