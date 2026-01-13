import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const staff = await db.staff.findMany({
      include: {
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to match the frontend structure
    const transformedStaff = staff.map(member => ({
      ...member,
      services: member.services.map(ss => ss.service)
    }))

    return NextResponse.json(transformedStaff)
  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, name, email, password, role, counterNumber, isActive, serviceIds } = body

    if (!username || !name || !email || !password) {
      return NextResponse.json(
        { error: 'Username, name, email, and password are required' },
        { status: 400 }
      )
    }

    // Check if username or email already exists
    const existingStaff = await db.staff.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    })

    if (existingStaff) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 400 }
      )
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create staff member
    const staffMember = await db.staff.create({
      data: {
        username,
        name,
        email,
        password: hashedPassword,
        role: role || 'STAFF',
        counterNumber: counterNumber ? parseInt(counterNumber) : null,
        isActive: isActive ?? true
      }
    })

    // Assign services if provided
    if (serviceIds && serviceIds.length > 0) {
      await db.staffService.createMany({
        data: serviceIds.map((serviceId: string) => ({
          staffId: staffMember.id,
          serviceId
        }))
      })
    }

    // Fetch the complete staff member with services
    const completeStaffMember = await db.staff.findUnique({
      where: { id: staffMember.id },
      include: {
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        }
      }
    })

    // Transform the data
    const transformedStaff = {
      ...completeStaffMember,
      services: completeStaffMember?.services.map(ss => ss.service) || []
    }

    // Log the action
    await db.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'staff',
        entityId: staffMember.id,
        details: JSON.stringify({ name, username, role }),
        userId: 'admin' // Will be replaced with actual user ID from auth
      }
    })

    return NextResponse.json(transformedStaff, { status: 201 })
  } catch (error) {
    console.error('Error creating staff member:', error)
    return NextResponse.json(
      { error: 'Failed to create staff member' },
      { status: 500 }
    )
  }
}