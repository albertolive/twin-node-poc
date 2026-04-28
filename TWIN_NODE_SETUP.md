# Twin Node POC Setup Guide

This guide explains how to set up and use the Twin Node Proof of Concept (POC) application.

## Overview

This POC demonstrates how to connect a Next.js frontend to a Twin Node backend. It provides a simplified showcase for teams who want to explore Twin Node capabilities without deploying their own node first.

## Features

- **Authentication**: Login to a Twin Node using email/password
- **Identity Management**: View your digital identity (DID)
- **Identity Profile**: Fetch and display the public profile for your DID
- **Session Management**: Secure token-based authentication with HTTP-only cookies

## Prerequisites

- Node.js 20+ installed
- Access to a Twin Node (e.g., `https://3sixty.staging.twinnodes.com`)
- Credentials for the Twin Node (see "Getting Credentials" below)

## Getting Credentials

When a Twin Node boots up, it automatically creates an admin account with:
- **Email**: `admin@node`
- **Password**: A random password that is **logged in the node's startup logs**

To get the password:
1. Check the node's logs (if you have access)
2. Look for a message during bootstrap that shows the admin password
3. Contact the node administrator if you don't have log access

**Note**: The `/info` endpoint is publicly accessible without authentication, so you can verify the node is running.

## Environment Setup

1. Create a `.env.local` file in the root directory:

```bash
# Twin Node Configuration
TWIN_NODE_URL=https://3sixty.staging.twinnodes.com

# Optional: Service Account Authentication (for automatic backend connection)
# If set, the frontend will automatically authenticate on startup and remain connected
# This makes the frontend agnostic - no user login required
TWIN_NODE_SERVICE_EMAIL=admin@node
TWIN_NODE_SERVICE_PASSWORD=your-node-password-here
```

2. The application will default to `https://3sixty.staging.twinnodes.com` if the environment variables are not set.

### Authentication Modes

The application supports two authentication modes:

#### Mode 1: Service Account (Automatic - Recommended for Backend Services)

If `TWIN_NODE_SERVICE_EMAIL` and `TWIN_NODE_SERVICE_PASSWORD` are set:
- The frontend automatically authenticates on first API call
- No user login required - frontend is always connected
- Token is managed server-side and automatically refreshed
- Perfect for backend services, demos, or when user authentication is not needed

#### Mode 2: User Authentication (Manual Login)

If service credentials are not set:
- Users must manually log in via the login page
- Token is stored in HTTP-only cookies
- Session persists until token expires or user logs out
- Suitable for multi-user applications

### CORS Configuration

If your frontend is hosted on a different domain than the Twin Node, you may need to configure CORS on the node. This is done via environment variables on the node:

```bash
TWIN_NODE_CORS_ORIGINS=https://your-frontend-domain.com
TWIN_NODE_HTTP_METHODS=GET,POST,PUT,PATCH,DELETE,OPTIONS
TWIN_NODE_HTTP_ALLOWED_HEADERS=Content-Type,Authorization
TWIN_NODE_HTTP_EXPOSED_HEADERS=*
```

**Note**: The node administrator needs to configure these settings. For local development, you typically don't need CORS changes.

## Running the Application

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Navigate to the showcase:
   - Login page: `http://localhost:3000/twin-showcase/login`
   - Dashboard: `http://localhost:3000/twin-showcase` (requires authentication)

## Usage

### Public Endpoints

Some endpoints don't require authentication and can be accessed directly:
- `/info` - Get node information (name, version, etc.)

You can test this by calling `GET https://3sixty.staging.twinnodes.com/info` directly.

### Login (For Protected Endpoints)

1. Go to `/twin-showcase/login`
2. Enter your Twin Node credentials (e.g., `admin@node` and the password from node logs)
3. Upon successful login, you'll be redirected to the showcase dashboard
4. Now you can access protected endpoints like identity profile, identity management, etc.

### Showcase Dashboard

The dashboard displays:
- **Your Identity**: Your digital identity (DID) from the Twin Node
- **Identity Profile**: Click "Load Profile" to fetch and display the public profile for your DID
- **About Section**: Information about the showcase

## Architecture

### API Routes

**Public Endpoints (No Authentication Required):**
- `GET /api/twin-node/info` - Get node information (public)

**Protected Endpoints (Authentication Required):**
- `POST /api/twin-node/login` - Authenticate with the Twin Node
- `POST /api/twin-node/logout` - Clear authentication session
- `GET /api/twin-node/verify` - Verify current authentication token
- `GET /api/twin-node/agent` - Fetch the public identity profile by DID

### Services

- `TwinNodeService` (`src/lib/services/twin-node.service.ts`): Core service for Twin Node API interactions
- `TwinNodeAuthContext` (`src/contexts/TwinNodeAuthContext.tsx`): React context for authentication state management

### Authentication Flow

#### Service Account Mode (Automatic)

1. Application starts and reads `TWIN_NODE_SERVICE_EMAIL` and `TWIN_NODE_SERVICE_PASSWORD` from environment
2. On first API call, server automatically authenticates with Twin Node
3. Token is cached server-side and automatically refreshed before expiry
4. All API calls use the service token - no user interaction required
5. Frontend is always connected and ready to use

#### User Authentication Mode (Manual)

1. User submits login credentials (`admin@node` + password from node logs)
2. Frontend calls `/api/twin-node/login`
3. API route authenticates with Twin Node via `/authentication/login`
4. Twin Node returns JWT token in a secure cookie
5. Our API route extracts the token and stores it in an HTTP-only cookie
6. Context updates authentication state
7. User is redirected to showcase dashboard
8. Subsequent API calls include the JWT token in the Authorization header

**Important**: 
- Service account mode makes the frontend agnostic and always connected (similar to how identity-management works)
- User authentication mode requires manual login but supports multiple users
- The Twin Node uses cookie-based authentication. Our implementation extracts the token from the response and manages it via HTTP-only cookies for security

## Extending the POC

You can extend this POC by:

1. **Adding more Twin Node endpoints**: Extend `TwinNodeService` with additional methods
2. **Creating new showcase features**: Add pages demonstrating other Twin Node capabilities
3. **Improving UI**: Enhance the showcase with better styling and UX
4. **Adding error handling**: Implement more robust error handling and user feedback

## Troubleshooting

### Authentication Fails

- Verify the Twin Node URL is correct (test with `/info` endpoint)
- **Get the correct password from the node's startup logs** (it's randomly generated)
- Ensure the Twin Node is accessible from your network
- Check browser console and server logs for error messages
- Verify CORS is configured if frontend is on a different domain
- Check that the node has finished bootstrapping (admin account creation)

### Token Expired

- The application automatically verifies tokens on page load
- If a token is invalid, you'll be redirected to the login page
- Tokens are stored in HTTP-only cookies for security

## Notes

- This is a simplified POC for demonstration purposes
- For production use, consider additional security measures
- The Twin Node URL defaults to the staging environment
- All API calls are made server-side for security (except for client-side token verification)

## Support

For issues or questions:
- Check the Twin Node documentation
- Review the playground example at `https://playground-dev.twindev.org/`
- Contact the Twin Node team for assistance
