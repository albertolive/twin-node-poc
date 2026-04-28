# Twin Node POC - Manual Review Checklist

This document provides a comprehensive list of all files related to the Twin Node POC functionality, organized by category for systematic manual review.

## 📋 Review Order

Review files in this order to understand the complete flow:
1. **Documentation** - Understand the system architecture
2. **Core Services** - Understand the business logic
3. **Server Utilities** - Understand authentication management
4. **API Routes** - Understand the endpoints
5. **Validation** - Understand input validation
6. **UI Components** - Understand the user interface
7. **Configuration** - Understand dependencies and setup

---

## 📚 Documentation Files

### Primary Documentation
- **`TWIN_NODE_SETUP.md`** (207 lines)
  - Complete setup guide
  - Authentication modes (Service Account vs User Auth)
  - Environment variable configuration
  - API endpoints documentation
  - Troubleshooting guide

- **`README.md`** (22 lines)
  - Quick overview
  - Quickstart instructions
  - Basic usage

---

## 🔧 Core Service Files

### Main Service
- **`src/lib/services/twin-node.service.ts`** (289 lines)
  - Core service for Twin Node API interactions
  - Singleton pattern implementation
  - Methods:
    - `login()` - Authenticate with Twin Node
    - `getNodeInfo()` - Get public node information
    - `getAgent()` - Fetch identity profile by DID
    - `verifyToken()` - Verify JWT token validity
  - Private helpers:
    - `call()` - Generic HTTP request handler
    - `resolvePath()` - Path parameter resolution
    - `extractAccessTokenFromResponse()` - Cookie extraction
    - `decodeJwtPayload()` - JWT payload decoding
    - `pickIdentity()` - Identity extraction from JWT

---

## 🔐 Server-Side Authentication

### Authentication Manager
- **`src/lib/server/twin-node-auth.ts`** (198 lines)
  - Server-side service account authentication manager
  - Singleton pattern
  - Automatic authentication on first use
  - Token caching and refresh logic
  - Methods:
    - `getToken()` - Get valid service token (auto-authenticates if needed)
    - `isServiceAuthConfigured()` - Check if service credentials are set
    - `getIdentity()` - Get service identity (DID)
    - `clearAuth()` - Clear authentication state
    - `getStatus()` - Get authentication status for debugging

### Session Helper
- **`src/lib/server/session.ts`** (31 lines)
  - Unified token access helper
  - Priority: Service token → User token → null
  - Methods:
    - `getTwinNodeToken()` - Get token (tries service first, then user cookie)
    - `getTwinNodeTokenFromCookie()` - Legacy method (deprecated)

---

## 🌐 API Routes

### Public Endpoints
- **`src/app/[locale]/api/twin-node/info/route.ts`** (26 lines)
  - `GET /api/twin-node/info`
  - Public endpoint (no authentication required)
  - Returns node information (name, version)
  - Uses: `twinNodeService.getNodeInfo()`

### Authentication Endpoints
- **`src/app/[locale]/api/twin-node/login/route.ts`** (67 lines)
  - `POST /api/twin-node/login`
  - User authentication endpoint
  - Validates input with Zod schema
  - Sets HttpOnly cookie `twin_node_token`
  - Returns: `{success, identity, expiry}`
  - Uses: `twinNodeService.login()`, `loginSchema`

- **`src/app/[locale]/api/twin-node/logout/route.ts`**
  - `POST /api/twin-node/logout`
  - Clears user authentication cookie
  - Deletes `twin_node_token` cookie

- **`src/app/[locale]/api/twin-node/verify/route.ts`** (45 lines)
  - `GET /api/twin-node/verify`
  - Verifies authentication token
  - Tries service token first, then user token
  - Returns: `{valid, expiry, identity, error?}`
  - Clears invalid user tokens
  - Uses: `getTwinNodeToken()`, `twinNodeService.verifyToken()`

### Protected Endpoints
- **`src/app/[locale]/api/twin-node/agent/route.ts`** (64 lines)
  - `GET /api/twin-node/agent?id=<did>`
  - Fetches public identity profile by DID
  - Requires authentication (service or user token)
  - Returns: `{success, data}` or `{success: false, error}`
  - Uses: `getTwinNodeToken()`, `twinNodeService.getAgent()`
  - Error handling for missing endpoint (502 status)

---

## ✅ Validation Files

- **`src/validations/twin-node.validation.ts`**
  - Zod schema for login validation
  - Custom email validation (allows node-specific formats like `admin@naastwinnodes`)
  - Schema: `loginSchema` with `email` and `password` fields
  - Type: `LoginInput`

---

## 🎨 UI Components & Pages

### Context Provider
- **`src/contexts/TwinNodeAuthContext.tsx`** (219 lines)
  - React context for client-side authentication state
  - Provides: `login()`, `logout()`, `checkAuth()`, `isAuthenticated`, `identity`, `isLoading`, `error`
  - Manages user authentication state
  - Auto-checks auth on mount
  - Used by UI components

### Pages
- **`src/app/[locale]/twin-showcase/login/page.tsx`**
  - Login page component
  - Form with email/password inputs
  - Uses: `useTwinNodeAuth()` context
  - Redirects to `/twin-showcase` on success
  - Shows error messages

- **`src/app/[locale]/twin-showcase/page.tsx`**
  - Main showcase dashboard
  - Displays user identity (DID)
  - "Load Node Info" button - fetches `/api/twin-node/info`
  - "Load Profile" button - fetches `/api/twin-node/agent?id=<did>`
  - Logout functionality
  - Protected route (redirects to login if not authenticated)
  - Uses: `useTwinNodeAuth()` context

---

## ⚙️ Configuration Files

### Package Configuration
- **`package.json`**
  - Dependencies: Next.js, React, TypeScript, Zod, etc.
  - Scripts: `dev`, `build`, `start`, `test`, etc.
  - Check for required dependencies

### Environment Variables
- **`.env.local`** (create if not exists)
  - `TWIN_NODE_URL` - Twin Node base URL (defaults to staging)
  - `TWIN_NODE_SERVICE_EMAIL` - Optional: Service account email
  - `TWIN_NODE_SERVICE_PASSWORD` - Optional: Service account password
  - Other Next.js/boilerplate env vars

### TypeScript Configuration
- **`tsconfig.json`**
  - TypeScript compiler options
  - Path aliases (e.g., `@/lib`, `@/app`)

---

## 🔍 Review Checklist

### Core Service (`twin-node.service.ts`)
- [ ] Singleton pattern correctly implemented
- [ ] Base URL configuration (server-side only)
- [ ] Path parameter resolution works for DIDs
- [ ] JWT decoding handles both browser and Node.js
- [ ] Error handling is comprehensive
- [ ] Token extraction from cookies works
- [ ] Identity extraction from JWT works correctly

### Authentication Manager (`twin-node-auth.ts`)
- [ ] Service credentials read from environment
- [ ] Token validation includes 5-minute buffer
- [ ] Automatic authentication on first use
- [ ] Token refresh logic works
- [ ] Error handling for failed authentication
- [ ] Singleton pattern prevents multiple auth attempts

### Session Helper (`session.ts`)
- [ ] Priority order: Service → User → null
- [ ] Cookie reading works correctly
- [ ] Returns null when no token available

### API Routes
- [ ] **Info Route**: Public access, no auth required
- [ ] **Login Route**: Validates input, sets cookie, returns identity
- [ ] **Logout Route**: Clears cookie correctly
- [ ] **Verify Route**: Tries service token first, then user token
- [ ] **Agent Route**: Requires auth, handles missing endpoint gracefully

### Validation
- [ ] Email validation allows node-specific formats
- [ ] Password validation requires non-empty string
- [ ] Error messages are clear

### UI Components
- [ ] Login page validates input
- [ ] Login page shows errors
- [ ] Login page redirects on success
- [ ] Showcase page requires authentication
- [ ] Showcase page displays identity
- [ ] Showcase page loads node info correctly
- [ ] Showcase page loads profile correctly
- [ ] Logout works correctly

### Security
- [ ] HttpOnly cookies used for tokens
- [ ] Secure flag set in production
- [ ] SameSite protection enabled
- [ ] No sensitive data in client-side code
- [ ] Service credentials only in server-side code

### Error Handling
- [ ] All API routes handle errors gracefully
- [ ] Error messages are user-friendly
- [ ] Server errors are logged
- [ ] Client errors are displayed appropriately

---

## 🧪 Testing Checklist

### Manual Testing
- [ ] Public `/info` endpoint works without auth
- [ ] Login with valid credentials works
- [ ] Login with invalid credentials fails gracefully
- [ ] Token verification works with user token
- [ ] Token verification works with service token (if configured)
- [ ] Agent profile fetch works with authentication
- [ ] Agent profile fetch fails without authentication
- [ ] Logout clears cookie
- [ ] Service auth works automatically (if configured)
- [ ] User auth works manually (if service auth not configured)

### Edge Cases
- [ ] Expired token handling
- [ ] Missing token handling
- [ ] Invalid token format handling
- [ ] Network error handling
- [ ] Node endpoint not available handling
- [ ] Missing DID parameter handling

---

## 📝 Notes

- All API routes are under `[locale]/api/twin-node/` for i18n support
- Service authentication is optional - falls back to user auth if not configured
- Token priority: Service token takes precedence over user token
- DIDs are not URL-encoded in path parameters (they contain colons)
- JWT decoding works in both browser and Node.js environments

---

## 🔗 Related Files (Non-Critical)

These files are part of the boilerplate but may be relevant:
- `src/middleware.ts` - Next.js middleware (i18n routing, auth protection)
- `src/utils/AppConfig.ts` - App configuration (locales, etc.)
- `src/libs/I18nRouting.ts` - i18n routing configuration

---

**Last Updated**: After refactoring to support service account authentication
**Total Files to Review**: ~15 core files + documentation

