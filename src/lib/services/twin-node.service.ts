// Thin Twin Node client used by the POC API routes.

type LoginRequest = {
  email: string;
  password: string;
};

type LoginResponse = {
  token?: string;
  expiry?: number;
  identity?: string;
  access_token?: string;
};

type BackendError = {
  name?: string;
  message?: string;
  source?: string;
};

type WrappedResponse<T> = {
  body?: T;
  error?: BackendError;
};

type TwinNodeCallOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
  pathParams?: Record<string, string>;
};

class TwinNodeService {
  private static instance: TwinNodeService | null = null;
  private readonly baseUrl: string;

  private constructor() {
    this.baseUrl =
      process.env.TWIN_NODE_URL || "https://3sixty.staging.twinnodes.com";
  }

  public static getInstance(): TwinNodeService {
    if (!TwinNodeService.instance) {
      TwinNodeService.instance = new TwinNodeService();
    }
    return TwinNodeService.instance;
  }

  /**
   * Resolve :param placeholders with the provided values.
   */
  private resolvePath(
    template: string,
    params?: Record<string, string>
  ): string {
    if (!params) {
      return template;
    }
    return template.replace(/:\w+/g, (match) => {
      const key = match.slice(1);
      const value = params[key];
      if (!value) {
        throw new Error(`Missing path param ${key}`);
      }
      // DIDs contain colons; avoid double encoding them.
      if (value.startsWith("did:")) {
        return value;
      }
      return encodeURIComponent(value);
    });
  }

  /**
   * Make a request, parse the response once, and return the unwrapped body.
   */
  private async call<TResponse>(
    path: string,
    { method = "GET", body, token, pathParams }: TwinNodeCallOptions = {}
  ): Promise<{ data: TResponse; rawResponse: Response; parsedBody: unknown }> {
    const url = `${this.baseUrl}${this.resolvePath(path, pathParams)}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    const text = await response.text();
    const parsedBody = text ? this.safeParseJson(text) : undefined;

    if (!response.ok) {
      const possibleError =
        (parsedBody as WrappedResponse<TResponse>)?.error ||
        (parsedBody as BackendError) ||
        {};
      const message =
        possibleError.message ||
        (typeof parsedBody === "string" ? parsedBody : undefined) ||
        response.statusText ||
        "Request failed";
      throw new Error(message, { cause: possibleError });
    }

    // Unwrap { body } if the node responds with that shape; otherwise return the parsed payload.
    const possibleWrapped = parsedBody as
      | WrappedResponse<TResponse>
      | undefined;
    const data = (
      possibleWrapped && possibleWrapped.body !== undefined
        ? possibleWrapped.body
        : parsedBody
    ) as TResponse | undefined;

    if (data === undefined) {
      throw new Error("Empty response from Twin Node");
    }

    return { data, rawResponse: response, parsedBody };
  }

  private safeParseJson(value: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  private extractAccessTokenFromResponse(
    response: Response
  ): string | undefined {
    const headersWithGetSetCookie = response.headers as unknown as {
      getSetCookie?: () => string[];
    };

    const setCookies: string[] =
      headersWithGetSetCookie.getSetCookie?.() ||
      (response.headers.get("set-cookie")
        ? [response.headers.get("set-cookie") as string]
        : []);

    for (const cookie of setCookies) {
      const match = /access_token=([^;]+)/.exec(cookie);
      if (match?.[1]) {
        return match[1];
      }
    }
    return undefined;
  }

  private decodeJwtPayload(
    token: string | undefined
  ): Record<string, unknown> | null {
    if (!token) {
      return null;
    }

    try {
      const [, payload] = token.split(".");
      if (!payload) {
        return null;
      }
      const decode = (input: string) => {
        if (typeof atob === "function") {
          return atob(input);
        }
        return Buffer.from(input, "base64url").toString("utf8");
      };
      return JSON.parse(decode(payload));
    } catch {
      return null;
    }
  }

  async login(
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    expiry?: number;
    identity?: string;
    token?: string;
    error?: string;
  }> {
    try {
      const { data, rawResponse } = await this.call<LoginResponse>(
        "/authentication/login",
        {
          method: "POST",
          body: { email, password } satisfies LoginRequest,
        }
      );

      const token =
        data.token ||
        data.access_token ||
        this.extractAccessTokenFromResponse(rawResponse);

      if (!token) {
        return { success: false, error: "Login returned no access token" };
      }

      const decoded = this.decodeJwtPayload(token);
      const expiryFromJwt =
        typeof decoded?.exp === "number" ? decoded.exp * 1000 : undefined;
      const identityFromJwt = this.pickIdentity(decoded);

      return {
        success: true,
        token,
        expiry: data.expiry || expiryFromJwt,
        identity: data.identity || identityFromJwt,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Authentication failed";
      return { success: false, error: message };
    }
  }

  async getNodeInfo(): Promise<unknown> {
    return (await this.call<unknown>("/info")).data;
  }

  async getHealth(): Promise<unknown> {
    return (await this.call<unknown>("/health")).data;
  }

  // Resolves the W3C DID Document for a given DID via the node's identity resolver.
  async getDidDocument(did: string, token: string): Promise<unknown> {
    return (
      await this.call<unknown>("/identity/:id", {
        token,
        pathParams: { id: did },
      })
    ).data;
  }

  // Returns the authenticated identity's full profile (incl. private fields).
  async getOwnProfile(token: string): Promise<unknown> {
    return (await this.call<unknown>("/identity/profile", { token })).data;
  }

  // Recent log entries (admin-only on the node side).
  async getLogging(
    token: string,
    pageSize: number,
  ): Promise<unknown> {
    const path = `/logging?pageSize=${encodeURIComponent(String(pageSize))}`;
    return (await this.call<unknown>(path, { token })).data;
  }

  // Public identity profile for a DID.
  async getAgent(agentId: string, token: string): Promise<unknown> {
    try {
      return (
        await this.call<unknown>("/identity/profile/:id/public", {
          token,
          pathParams: { id: agentId },
        })
      ).data;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("RestRouteProcessor.routeNotFound")
      ) {
        throw new Error(
          "The identity profile endpoint is not available on this node."
        );
      }
      throw error;
    }
  }

  async verifyToken(token: string): Promise<{
    valid: boolean;
    error?: string;
    expiry?: number;
    identity?: string;
  }> {
    const decoded = this.decodeJwtPayload(token);
    if (!decoded) {
      return { valid: false, error: "Invalid token" };
    }

    const expiry =
      typeof decoded.exp === "number" ? decoded.exp * 1000 : undefined;
    if (expiry && expiry < Date.now()) {
      return { valid: false, error: "Token expired", expiry };
    }

    return { valid: true, expiry, identity: this.pickIdentity(decoded) };
  }

  private pickIdentity(
    payload: Record<string, unknown> | null
  ): string | undefined {
    if (!payload) {
      return undefined;
    }
    const keys = ["identity", "did", "sub", "subject", "user", "email"];
    return keys
      .map((key) => payload[key])
      .find((v) => typeof v === "string") as string | undefined;
  }
}

export const twinNodeService = TwinNodeService.getInstance();
