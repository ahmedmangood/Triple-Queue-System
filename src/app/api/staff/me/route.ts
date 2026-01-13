import { NextRequest, NextResponse } from 'next/server'
import { getStaffFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const staff = await getStaffFromRequest(request)

    if (!staff) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(staff)
  } catch (error) {
    console.error('Error fetching staff data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}