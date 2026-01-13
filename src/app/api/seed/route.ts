import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    // Check if services already exist
    const existingServices = await db.service.findMany()
    
    if (existingServices.length === 0) {
      // Create sample services only if none exist
      const customerService = await db.service.create({
        data: {
          name: 'Customer Service',
          code: 'A',
          color: '#3B82F6',
          description: 'General customer service and inquiries',
          nameAr: 'خدمة العملاء',
          nameUr: 'کسٹمر سروس',
          nameBn: 'গ্রাহক পরিষেবা',
          descriptionAr: 'خدمة العملاء العامة والاستفسارات',
          descriptionUr: 'جنرل کسٹمر سروس اور استفسارات',
          descriptionBn: 'সাধারণ গ্রাহক পরিষেবা এবং অনুসন্ধান',
          isActive: true,
          currentNumber: 0
        }
      })

      const techSupport = await db.service.create({
        data: {
          name: 'Technical Support',
          code: 'B',
          color: '#10B981',
          description: 'Technical support and troubleshooting',
          nameAr: 'الدعم الفني',
          nameUr: 'ٹیکنیکل سپورٹ',
          nameBn: 'প্রযুক্তিগত সহায়তা',
          descriptionAr: 'الدعم الفني واستكشاف الأخطاء وإصلاحها',
          descriptionUr: 'ٹیکنیکل سپورٹ اور ٹرابل شوٹنگ',
          descriptionBn: 'প্রযুক্তিগত সহায়তা এবং সমস্যা সমাধান',
          isActive: true,
          currentNumber: 0
        }
      })

      // Create sample staff
      const staff1 = await db.staff.create({
        data: {
          username: 'john.doe',
          password: 'password123', // In production, this should be hashed
          name: 'John Doe',
          email: 'john.doe@example.com',
          role: 'STAFF',
          isActive: true
        }
      })

      const staff2 = await db.staff.create({
        data: {
          username: 'jane.smith',
          password: 'password123', // In production, this should be hashed
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          role: 'STAFF',
          isActive: true
        }
      })

      // Assign services to staff
      await db.staffService.create({
        data: {
          staffId: staff1.id,
          serviceId: customerService.id
        }
      })

      await db.staffService.create({
        data: {
          staffId: staff2.id,
          serviceId: techSupport.id
        }
      })

      return NextResponse.json({
        message: 'Sample data created successfully',
        services: [
          { id: customerService.id, name: customerService.name, code: customerService.code },
          { id: techSupport.id, name: techSupport.name, code: techSupport.code }
        ],
        staff: [
          { id: staff1.id, name: staff1.name, username: staff1.username },
          { id: staff2.id, name: staff2.name, username: staff2.username }
        ]
      })
    } else {
      return NextResponse.json({
        message: 'Sample data already exists',
        services: existingServices.map(s => ({ id: s.id, name: s.name, code: s.code }))
      })
    }
  } catch (error) {
    console.error('Error creating sample data:', error)
    return NextResponse.json(
      { error: 'Failed to create sample data' },
      { status: 500 }
    )
  }
}