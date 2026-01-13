import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, stat } from 'fs/promises'
import { join, extname } from 'path'
import { v4 as uuidv4 } from 'uuid'

// Allowed file types and their max sizes
const ALLOWED_FILE_TYPES = {
  image: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    maxSize: 5 * 1024 * 1024, // 5MB
    folder: 'images'
  },
  audio: {
    extensions: ['.mp3', '.wav', '.ogg', '.m4a', '.aac'],
    maxSize: 10 * 1024 * 1024, // 10MB
    folder: 'audio'
  },
  document: {
    extensions: ['.pdf', '.doc', '.docx', '.txt'],
    maxSize: 5 * 1024 * 1024, // 5MB
    folder: 'documents'
  },
  video: {
    extensions: ['.mp4', '.webm', '.ogg'],
    maxSize: 50 * 1024 * 1024, // 50MB
    folder: 'videos'
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string || 'image'
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const fileConfig = ALLOWED_FILE_TYPES[type as keyof typeof ALLOWED_FILE_TYPES]
    if (!fileConfig) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed types: image, audio, document, video' },
        { status: 400 }
      )
    }

    // Validate file extension
    const fileExtension = extname(file.name).toLowerCase()
    if (!fileConfig.extensions.includes(fileExtension)) {
      return NextResponse.json(
        { 
          error: `Invalid file extension. Allowed extensions for ${type}: ${fileConfig.extensions.join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > fileConfig.maxSize) {
      return NextResponse.json(
        { 
          error: `File too large. Maximum size for ${type}: ${Math.round(fileConfig.maxSize / 1024 / 1024)}MB` 
        },
        { status: 400 }
      )
    }

    // Generate unique filename
    const uniqueId = uuidv4()
    const fileName = `${uniqueId}${fileExtension}`
    
    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', fileConfig.folder)
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Save file
    const filePath = join(uploadDir, fileName)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    await writeFile(filePath, buffer)

    // Return file information
    const fileUrl = `/uploads/${fileConfig.folder}/${fileName}`
    
    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        originalName: file.name,
        fileName: fileName,
        url: fileUrl,
        size: file.size,
        type: file.type,
        category: type,
        uploadedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

// Handle GET request to list uploaded files
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'image'
    
    const fileConfig = ALLOWED_FILE_TYPES[type as keyof typeof ALLOWED_FILE_TYPES]
    if (!fileConfig) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      )
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads', fileConfig.folder)
    
    // For now, return a simple structure. In a real app, you might want to 
    // store file metadata in a database
    return NextResponse.json({
      files: [],
      uploadDir: `/uploads/${fileConfig.folder}`,
      allowedTypes: fileConfig.extensions,
      maxSize: fileConfig.maxSize
    })

  } catch (error) {
    console.error('List files error:', error)
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    )
  }
}