import { NextRequest, NextResponse } from 'next/server'
import { readdir, unlink, stat } from 'fs/promises'
import { join } from 'path'

// File type configurations
const FILE_TYPES = {
  image: { folder: 'images', extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'] },
  audio: { folder: 'audio', extensions: ['.mp3', '.wav', '.ogg', '.m4a', '.aac'] },
  document: { folder: 'documents', extensions: ['.pdf', '.doc', '.docx', '.txt'] },
  video: { folder: 'videos', extensions: ['.mp4', '.webm', '.ogg'] }
}

// GET /api/admin/files/[type] - List files of a specific type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params
    const [type] = resolvedParams.path
    
    if (!type || !FILE_TYPES[type as keyof typeof FILE_TYPES]) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      )
    }

    const fileConfig = FILE_TYPES[type as keyof typeof FILE_TYPES]
    const uploadDir = join(process.cwd(), 'public', 'uploads', fileConfig.folder)
    
    let files: any[] = []
    
    try {
      const fileNames = await readdir(uploadDir)
      
      for (const fileName of fileNames) {
        const filePath = join(uploadDir, fileName)
        const fileStat = await stat(filePath)
        const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase()
        
        if (fileConfig.extensions.includes(extension)) {
          files.push({
            name: fileName,
            url: `/uploads/${fileConfig.folder}/${fileName}`,
            size: fileStat.size,
            createdAt: fileStat.birthtime.toISOString(),
            modifiedAt: fileStat.mtime.toISOString(),
            type: type,
            extension: extension
          })
        }
      }
      
      // Sort by creation date (newest first)
      files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      
    } catch (error) {
      // Directory doesn't exist or is empty
      files = []
    }

    return NextResponse.json({
      success: true,
      files: files,
      type: type,
      totalFiles: files.length
    })

  } catch (error) {
    console.error('List files error:', error)
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/files/[type]/[filename] - Delete a specific file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params
    const [type, filename] = resolvedParams.path
    
    if (!type || !filename) {
      return NextResponse.json(
        { error: 'Missing file type or filename' },
        { status: 400 }
      )
    }

    if (!FILE_TYPES[type as keyof typeof FILE_TYPES]) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      )
    }

    const fileConfig = FILE_TYPES[type as keyof typeof FILE_TYPES]
    const filePath = join(process.cwd(), 'public', 'uploads', fileConfig.folder, filename)
    
    try {
      await unlink(filePath)
      return NextResponse.json({
        success: true,
        message: 'File deleted successfully',
        filename: filename
      })
    } catch (error) {
      return NextResponse.json(
        { error: 'File not found or could not be deleted' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('Delete file error:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}