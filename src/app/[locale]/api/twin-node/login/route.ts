import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { twinNodeService } from '@/lib/services/twin-node.service';
import { loginSchema } from '@/validations/twin-node.validation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    const result = await twinNodeService.login(
      validatedData.email,
      validatedData.password,
    );

    if (!result.success || !result.token) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Authentication failed',
        },
        { status: 401 },
      );
    }

    const maxAgeSeconds = result.expiry
      ? Math.max(300, Math.floor((result.expiry - Date.now()) / 1000))
      : 3600;

    // Set token in HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set('twin_node_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: maxAgeSeconds,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      identity: result.identity,
      expiry: result.expiry,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.message,
        },
        { status: 400 },
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 },
    );
  }
}
