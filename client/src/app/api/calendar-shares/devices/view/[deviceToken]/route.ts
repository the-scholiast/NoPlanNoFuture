import { NextRequest, NextResponse } from 'next/server';

const RAILWAY_BACKEND_URL = process.env.RAILWAY_BACKEND_URL || 'https://noplannofuture-production.up.railway.app';

/**
 * GET /api/calendar-shares/devices/view/:deviceToken
 * 
 * Proxy endpoint that forwards requests to Railway backend
 * 
 * Query parameters:
 * - startDate: YYYY-MM-DD format
 * - endDate: YYYY-MM-DD format
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { deviceToken: string } }
) {
  try {
    const { deviceToken } = params;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validate required parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return NextResponse.json(
        { error: 'startDate and endDate must be in YYYY-MM-DD format' },
        { status: 400 }
      );
    }

    // Proxy request to Railway backend
    const backendUrl = `${RAILWAY_BACKEND_URL}/api/calendar-shares/devices/view/${deviceToken}?startDate=${startDate}&endDate=${endDate}`;
    
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

