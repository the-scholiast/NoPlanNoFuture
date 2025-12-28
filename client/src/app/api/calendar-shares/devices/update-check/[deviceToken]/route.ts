import { NextRequest, NextResponse } from 'next/server';

const RAILWAY_BACKEND_URL = process.env.RAILWAY_BACKEND_URL || 'https://noplannofuture-production.up.railway.app';

/**
 * GET /api/calendar-shares/devices/update-check/:deviceToken
 * 
 * Proxy endpoint that forwards requests to Railway backend
 * 
 * Checks if a device needs to update
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deviceToken: string }> }
) {
  try {
    const { deviceToken } = await params;

    // Proxy request to Railway backend
    const backendUrl = `${RAILWAY_BACKEND_URL}/api/calendar-shares/devices/update-check/${deviceToken}`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add cache control for public endpoints
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || `Backend returned ${response.status}` };
      }
      return NextResponse.json(
        errorData,
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: unknown) {
    console.error('Error proxying to Railway backend:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

