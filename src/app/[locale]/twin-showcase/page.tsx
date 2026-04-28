'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTwinNodeAuth } from '@/contexts/TwinNodeAuthContext';

export default function TwinShowcasePage() {
  const { isAuthenticated, isLoading, logout, identity } = useTwinNodeAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<Record<string, unknown> | null>(
    null,
  );
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [nodeInfo, setNodeInfo] = useState<Record<string, unknown> | null>(
    null,
  );
  const [loadingNodeInfo, setLoadingNodeInfo] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/twin-showcase/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/twin-showcase/login');
  };

  const handleLoadNodeInfo = async () => {
    setLoadingNodeInfo(true);
    try {
      const response = await fetch('/api/twin-node/info');
      const data = (await response.json()) as {
        success: boolean;
        data?: unknown;
      };
      if (data.success && data.data) {
        // Type guard: ensure data.data is an object
        if (
          typeof data.data === 'object'
          && data.data !== null
          && !Array.isArray(data.data)
        ) {
          setNodeInfo(data.data as Record<string, unknown>);
        }
      }
    } catch (error) {
      console.error('Error loading node info:', error);
    } finally {
      setLoadingNodeInfo(false);
    }
  };

  const handleLoadAgent = async () => {
    if (!identity) {
      return;
    }

    setLoadingProfile(true);
    try {
      const response = await fetch(
        `/api/twin-node/agent?id=${encodeURIComponent(identity)}`,
      );
      const data = (await response.json()) as {
        success: boolean;
        data?: unknown;
      };
      if (data.success && data.data) {
        // Type guard: ensure data.data is an object
        if (
          typeof data.data === 'object'
          && data.data !== null
          && !Array.isArray(data.data)
        ) {
          setProfileData(data.data as Record<string, unknown>);
        }
      }
    } catch (error) {
      console.error('Error loading agent:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              Twin Node Showcase
            </h1>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Logout
            </button>
          </div>
          <p className="text-gray-600">
            Welcome to the Twin Node POC showcase. This demonstrates how to
            connect to and interact with a Twin Node.
          </p>
        </div>

        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Your Identity
          </h2>
          <div className="rounded-md bg-gray-100 p-4">
            <code className="text-sm text-gray-800">
              {identity || 'No identity found'}
            </code>
          </div>
        </div>

        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Node Information
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Public endpoint - no authentication required
              </p>
            </div>
            <button
              type="button"
              onClick={handleLoadNodeInfo}
              disabled={loadingNodeInfo}
              className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {loadingNodeInfo ? 'Loading...' : 'Load Node Info'}
            </button>
          </div>
          {nodeInfo && (
            <div className="mt-4 rounded-md bg-gray-100 p-4">
              <pre className="overflow-auto text-sm text-gray-800">
                {JSON.stringify(nodeInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Identity Profile (public)
            </h2>
            <button
              type="button"
              onClick={handleLoadAgent}
              disabled={loadingProfile}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loadingProfile ? 'Loading...' : 'Load Profile'}
            </button>
          </div>
          {profileData && (
            <div className="mt-4 rounded-md bg-gray-100 p-4">
              <pre className="overflow-auto text-sm text-gray-800">
                {JSON.stringify(profileData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            About This Showcase
          </h2>
          <div className="space-y-4 text-gray-700">
            <p>
              This is a simplified proof of concept showcasing how to connect to
              a Twin Node. It demonstrates:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                Accessing public endpoints (like
                <code>/info</code>
                ) without authentication
              </li>
              <li>Authentication with a Twin Node for protected endpoints</li>
              <li>Retrieving your digital identity (DID)</li>
              <li>Fetching agent profile information</li>
              <li>Basic session management</li>
            </ul>
            <p className="mt-4 text-sm text-gray-600">
              This POC is designed for teams who want to explore Twin Node
              capabilities without deploying their own node first.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
