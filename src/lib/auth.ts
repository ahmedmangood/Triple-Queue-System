import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export interface Staff {
  id: string
  username: string
  name: string
  email: string
  role: string
  isActive: boolean
  services: Array<{
    service: {
      id: string
      name: string
      code: string
      color: string
      description?: string
      nameAr?: string
      nameUr?: string
      nameBn?: string
      descriptionAr?: string
      descriptionUr?: string
      descriptionBn?: string
      isActive: boolean
      currentNumber: number
    }
  }>
}

export async function getStaffFromRequest(request: NextRequest): Promise<Staff | null> {
  try {
    const sessionToken = request.cookies.get('staff-session')?.value

    if (!sessionToken) {
      return null
    }

    // Decode session token (simple implementation)
    const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8')
    const [staffId, timestamp] = decoded.split(':')

    if (!staffId || !timestamp) {
      return null
    }

    // Check if session is not too old (8 hours)
    const sessionAge = Date.now() - parseInt(timestamp)
    if (sessionAge > 8 * 60 * 60 * 1000) {
      return null
    }

    // Get staff from database
    const staff = await db.staff.findUnique({
      where: { id: staffId },
      include: {
        services: {
          include: {
            service: true
          }
        }
      }
    })

    if (!staff || !staff.isActive) {
      return null
    }

    // Return staff data without password
    const { password: _, ...staffData } = staff
    return staffData as Staff
  } catch (error) {
    console.error('Error authenticating staff:', error)
    return null
  }
}

export async function requireAuth(request: NextRequest): Promise<{ staff: Staff; response?: never } | { staff?: never; response: Response }> {
  const staff = await getStaffFromRequest(request)

  if (!staff) {
    return {
      response: new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }

  return { staff }
}