import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const services = await db.service.findMany({
      where: {
        isActive: true
      },
      include: {
        printer: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(services)
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      code, 
      color, 
      description, 
      nameAr, 
      nameUr, 
      nameBn, 
      descriptionAr, 
      descriptionUr, 
      descriptionBn 
    } = body

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      )
    }

    // Check if service code already exists
    const existingService = await db.service.findUnique({
      where: { code }
    })

    if (existingService) {
      return NextResponse.json(
        { error: 'Service code already exists' },
        { status: 400 }
      )
    }

    const service = await db.service.create({
      data: {
        name,
        code,
        color: color || '#3B82F6',
        description,
        nameAr,
        nameUr,
        nameBn,
        descriptionAr,
        descriptionUr,
        descriptionBn
      },
      include: {
        printer: true
      }
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    )
  }
}