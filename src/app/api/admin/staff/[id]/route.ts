import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const staffMember = await db.staff.findUnique({
      where: { id: params.id },
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

    if (!staffMember) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    // Transform the data
    const transformedStaff = {
      ...staffMember,
      services: staffMember.services.map(ss => ss.service)
    }

    return NextResponse.json(transformedStaff)
  } catch (error) {
    console.error('Error fetching staff member:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff member' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { username, name, email, password, role, counterNumber, isActive, serviceIds } = body

    // Check if staff member exists
    const existingStaff = await db.staff.findUnique({
      where: { id: params.id }
    })

    if (!existingStaff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    // Check if username or email conflicts with existing staff
    if (username || email) {
      const conflictingStaff = await db.staff.findFirst({
        where: {
          AND: [
            { id: { not: params.id } },
            {
              OR: [
                ...(username ? [{ username }] : []),
                ...(email ? [{ email }] : [])
              ]
            }
          ]
        }
      })

      if (conflictingStaff) {
        return NextResponse.json(
          { error: 'Username or email already exists' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (username) updateData.username = username
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (password) updateData.password = await bcrypt.hash(password, 10)
    if (role) updateData.role = role
    if (counterNumber !== undefined) {
      updateData.counterNumber = counterNumber ? parseInt(counterNumber) : null
    }
    if (isActive !== undefined) updateData.isActive = isActive

    // Update staff member
    const staffMember = await db.staff.update({
      where: { id: params.id },
      data: updateData
    })

    // Update service assignments if provided
    if (serviceIds !== undefined) {
      // Delete existing service assignments
      await db.staffService.deleteMany({
        where: { staffId: params.id }
      })

      // Create new service assignments
      if (serviceIds.length > 0) {
        await db.staffService.createMany({
          data: serviceIds.map((serviceId: string) => ({
            staffId: params.id,
            serviceId
          }))
        })
      }
    }

    // Fetch the updated staff member with services
    const updatedStaffMember = await db.staff.findUnique({
      where: { id: params.id },
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
      ...updatedStaffMember,
      services: updatedStaffMember?.services.map(ss => ss.service) || []
    }

    // Log the action
    await db.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'staff',
        entityId: staffMember.id,
        details: JSON.stringify({ name, role, isActive }),
        userId: 'admin' // Will be replaced with actual user ID from auth
      }
    })

    return NextResponse.json(transformedStaff)
  } catch (error) {
    console.error('Error updating staff member:', error)
    return NextResponse.json(
      { error: 'Failed to update staff member' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if staff member exists
    const existingStaff = await db.staff.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            tickets: true
          }
        }
      }
    })

    if (!existingStaff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    // Check if staff member has tickets
    if (existingStaff._count.tickets > 0) {
      return NextResponse.json(
        { error: 'Cannot delete staff member with existing tickets' },
        { status: 400 }
      )
    }

    // Delete service assignments
    await db.staffService.deleteMany({
      where: { staffId: params.id }
    })

    // Delete staff member
    await db.staff.delete({
      where: { id: params.id }
    })

    // Log the action
    await db.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'staff',
        entityId: params.id,
        details: JSON.stringify({ name: existingStaff.name }),
        userId: 'admin' // Will be replaced with actual user ID from auth
      }
    })

    return NextResponse.json({ message: 'Staff member deleted successfully' })
  } catch (error) {
    console.error('Error deleting staff member:', error)
    return NextResponse.json(
      { error: 'Failed to delete staff member' },
      { status: 500 }
    )
  }
}