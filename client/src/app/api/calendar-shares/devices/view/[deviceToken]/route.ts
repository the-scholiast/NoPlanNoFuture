import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabaseAdmin';
import { getScheduledTasksForDateRange } from '@/lib/api/timetableUtils';

/**
 * GET /api/calendar-shares/devices/view/:deviceToken
 * 
 * Public endpoint for e-ink devices to fetch calendar data
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

    // Verify device token and get device info
    const { data: device, error: deviceError } = await supabase
      .from('eink_devices')
      .select('user_id, view_type, is_active')
      .eq('device_token', deviceToken)
      .eq('is_active', true)
      .single();

    if (deviceError || !device) {
      return NextResponse.json(
        { error: 'Invalid or inactive device token' },
        { status: 401 }
      );
    }

    // Get scheduled tasks for the date range
    const tasks = await getScheduledTasksForDateRange(
      device.user_id,
      startDate,
      endDate
    );

    // Return data in the expected format
    return NextResponse.json({
      config: {
        view_type: device.view_type,
        user_id: device.user_id
      },
      todos: tasks
    });

  } catch (error: any) {
    console.error('Error in e-ink device API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

