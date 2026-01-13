import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Check file type
    if (!file.type.includes('image')) {
      return NextResponse.json(
        { error: 'Please select an image file (PNG, JPG, etc.)' },
        { status: 400 }
      )
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 2MB' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `logo-${timestamp}.${extension}`
    const filepath = path.join(uploadsDir, filename)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Save the logo path to settings
    const logoUrl = `/uploads/${filename}`
    
    let settings = await db.settings.findFirst()
    
    if (settings) {
      settings = await db.settings.update({
        where: { id: settings.id },
        data: { logo: logoUrl }
      })
    } else {
      settings = await db.settings.create({
        data: {
          institutionName: 'Queue Management System',
          logo: logoUrl,
          language: 'en',
          timezone: 'UTC',
          displayTheme: 'default'
        }
      })
    }

    return NextResponse.json({
      message: 'Logo uploaded successfully',
      logoUrl,
      settings
    })
  } catch (error) {
    console.error('Error uploading logo:', error)
    return NextResponse.json(
      { error: 'Failed to upload logo' },
      { status: 500 }
    )
  }
}