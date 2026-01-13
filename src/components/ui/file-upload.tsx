'use client'

import { useState, useCallback, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  X, 
  File, 
  Image as ImageIcon, 
  Music, 
  Video, 
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  accept?: string
  maxSize?: number
  maxFiles?: number
  type?: 'image' | 'audio' | 'document' | 'video'
  multiple?: boolean
  onUpload: (files: File[]) => Promise<void>
  className?: string
  disabled?: boolean
}

interface UploadProgress {
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
}

const FILE_TYPE_CONFIG = {
  image: {
    accept: '.jpg,.jpeg,.png,.gif,.webp,.svg',
    icon: ImageIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  audio: {
    accept: '.mp3,.wav,.ogg,.m4a,.aac',
    icon: Music,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  document: {
    accept: '.pdf,.doc,.docx,.txt',
    icon: FileText,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  video: {
    accept: '.mp4,.webm,.ogg',
    icon: Video,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  }
}

export function FileUpload({
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 1,
  type = 'image',
  multiple = false,
  onUpload,
  className,
  disabled = false
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const config = FILE_TYPE_CONFIG[type]
  const Icon = config.icon

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFiles = (files: FileList) => {
    const validFiles: File[] = []
    const errors: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Check file size
      if (file.size > maxSize) {
        errors.push(`${file.name} is too large (max ${formatFileSize(maxSize)})`)
        continue
      }

      // Check file type if accept is specified
      if (accept) {
        const acceptedTypes = accept.split(',').map(type => type.trim())
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
        if (!acceptedTypes.some(type => type.includes(fileExtension) || type.includes(file.type))) {
          errors.push(`${file.name} has invalid file type`)
          continue
        }
      }

      validFiles.push(file)
    }

    return { validFiles, errors }
  }

  const handleFiles = useCallback(async (files: FileList) => {
    if (disabled) return

    const { validFiles, errors } = validateFiles(files)
    
    if (errors.length > 0) {
      // Show errors for invalid files
      errors.forEach(error => {
        console.error(error)
      })
    }

    if (validFiles.length === 0) return

    // Check max files limit
    const remainingSlots = maxFiles - uploadProgress.filter(p => p.status !== 'error').length
    const filesToUpload = validFiles.slice(0, remainingSlots)

    if (filesToUpload.length === 0) {
      console.error('Maximum file limit reached')
      return
    }

    // Initialize upload progress
    const newProgress: UploadProgress[] = filesToUpload.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }))

    setUploadProgress(prev => [...prev, ...newProgress])

    // Upload files
    try {
      await onUpload(filesToUpload)
      
      // Update progress to success
      setUploadProgress(prev => 
        prev.map(p => 
          newProgress.some(np => np.file === p.file)
            ? { ...p, status: 'success', progress: 100 }
            : p
        )
      )
    } catch (error) {
      // Update progress to error
      setUploadProgress(prev => 
        prev.map(p => 
          newProgress.some(np => np.file === p.file)
            ? { ...p, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
            : p
        )
      )
    }
  }, [disabled, maxFiles, onUpload, uploadProgress, accept, maxSize])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (disabled) return
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFiles(files)
    }
  }, [disabled, handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFiles])

  const removeFile = (index: number) => {
    setUploadProgress(prev => prev.filter((_, i) => i !== index))
  }

  const clearAll = () => {
    setUploadProgress([])
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <Card 
        className={cn(
          'border-2 border-dashed transition-colors cursor-pointer',
          isDragOver && 'border-primary bg-primary/5',
          disabled && 'opacity-50 cursor-not-allowed',
          config.bgColor
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className={cn('p-4 rounded-full', config.bgColor)}>
              <Icon className={cn('h-8 w-8', config.color)} />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                {isDragOver ? 'Drop files here' : `Upload ${type}s`}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Drag and drop or click to select files
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Max size: {formatFileSize(maxSize)} • Max files: {maxFiles}
              </p>
            </div>
            <Button variant="outline" disabled={disabled}>
              <Upload className="h-4 w-4 mr-2" />
              Choose Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept || config.accept}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Upload Progress</h4>
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Clear All
              </Button>
            </div>
            <div className="space-y-3">
              {uploadProgress.map((progress, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={cn('p-2 rounded', config.bgColor)}>
                    <File className={cn('h-4 w-4', config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate">{progress.file.name}</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant={
                          progress.status === 'success' ? 'default' :
                          progress.status === 'error' ? 'destructive' : 'secondary'
                        }>
                          {progress.status === 'uploading' && `${progress.progress}%`}
                          {progress.status === 'success' && 'Success'}
                          {progress.status === 'error' && 'Error'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {progress.status === 'uploading' && (
                      <Progress value={progress.progress} className="h-2" />
                    )}
                    {progress.status === 'error' && (
                      <p className="text-xs text-red-600 mt-1">{progress.error}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {formatFileSize(progress.file.size)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}