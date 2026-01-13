'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Image as ImageIcon, 
  Music, 
  Video, 
  FileText, 
  Download, 
  Trash2, 
  Eye,
  Search,
  Grid,
  List,
  MoreHorizontal
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'

interface FileInfo {
  name: string
  url: string
  size: number
  createdAt: string
  modifiedAt: string
  type: string
  extension: string
}

interface FileGalleryProps {
  type: 'image' | 'audio' | 'document' | 'video'
  onSelect?: (file: FileInfo) => void
  multiSelect?: boolean
  maxSelection?: number
}

const FILE_TYPE_CONFIG = {
  image: {
    icon: ImageIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'Images'
  },
  audio: {
    icon: Music,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'Audio Files'
  },
  document: {
    icon: FileText,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    label: 'Documents'
  },
  video: {
    icon: Video,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    label: 'Videos'
  }
}

export function FileGallery({ 
  type, 
  onSelect, 
  multiSelect = false, 
  maxSelection = 10 
}: FileGalleryProps) {
  const [files, setFiles] = useState<FileInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [previewFile, setPreviewFile] = useState<FileInfo | null>(null)
  const [deletingFile, setDeletingFile] = useState<string | null>(null)
  
  const config = FILE_TYPE_CONFIG[type]
  const Icon = config.icon

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const fetchFiles = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/files/${type}`)
      if (!response.ok) throw new Error('Failed to fetch files')
      
      const data = await response.json()
      setFiles(data.files || [])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  const deleteFile = async (fileName: string) => {
    try {
      setDeletingFile(fileName)
      const response = await fetch(`/api/admin/files/${type}/${fileName}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete file')
      
      setFiles(prev => prev.filter(f => f.name !== fileName))
      setSelectedFiles(prev => prev.filter(f => f !== fileName))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete file')
    } finally {
      setDeletingFile(null)
    }
  }

  const toggleFileSelection = (fileName: string) => {
    if (selectedFiles.includes(fileName)) {
      setSelectedFiles(prev => prev.filter(f => f !== fileName))
    } else if (selectedFiles.length < maxSelection) {
      setSelectedFiles(prev => [...prev, fileName])
    }
  }

  const handleFileClick = (file: FileInfo) => {
    if (onSelect) {
      if (multiSelect) {
        toggleFileSelection(file.name)
        if (selectedFiles.includes(file.name)) {
          onSelect(file)
        }
      } else {
        onSelect(file)
      }
    } else {
      setPreviewFile(file)
    }
  }

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  useEffect(() => {
    fetchFiles()
  }, [type])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading files...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchFiles}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon className={cn('h-5 w-5', config.color)} />
              <CardTitle className="text-lg">{config.label}</CardTitle>
              <Badge variant="secondary">{files.length}</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Files */}
      {filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Icon className={cn('h-12 w-12 mx-auto mb-4 opacity-50', config.color)} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No files found' : `No ${type.toLowerCase()} files uploaded`}
            </h3>
            <p className="text-gray-500">
              {searchQuery ? 'Try a different search term' : 'Upload your first file to get started'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredFiles.map((file) => (
                <Card 
                  key={file.name} 
                  className={cn(
                    'cursor-pointer hover:shadow-md transition-shadow',
                    selectedFiles.includes(file.name) && 'ring-2 ring-primary'
                  )}
                  onClick={() => handleFileClick(file)}
                >
                  <CardContent className="p-4">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                      {type === 'image' ? (
                        <ImageWithFallback 
                          src={file.url} 
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Icon className={cn('h-12 w-12', config.color)} />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      <p className="text-xs text-gray-400">{formatDate(file.createdAt)}</p>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPreviewFile(file)
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <a 
                              href={file.url} 
                              download={file.name}
                              className="flex items-center"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteFile(file.name)
                            }}
                            disabled={deletingFile === file.name}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <div className="divide-y">
                {filteredFiles.map((file) => (
                  <div 
                    key={file.name}
                    className={cn(
                      'p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer',
                      selectedFiles.includes(file.name) && 'bg-primary/5'
                    )}
                    onClick={() => handleFileClick(file)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={cn('p-2 rounded', config.bgColor)}>
                        <Icon className={cn('h-4 w-4', config.color)} />
                      </div>
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.size)} • {formatDate(file.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPreviewFile(file)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a href={file.url} download={file.name}>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteFile(file.name)
                        }}
                        disabled={deletingFile === file.name}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewFile?.name}</DialogTitle>
          </DialogHeader>
          {previewFile && (
            <div className="space-y-4">
              {type === 'image' ? (
                <div className="flex justify-center">
                  <ImageWithFallback 
                    src={previewFile.url} 
                    alt={previewFile.name}
                    className="max-w-full max-h-96 object-contain rounded-lg"
                  />
                </div>
              ) : type === 'audio' ? (
                <div className="flex justify-center">
                  <audio controls className="w-full max-w-md">
                    <source src={previewFile.url} type={previewFile.type} />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              ) : type === 'video' ? (
                <div className="flex justify-center">
                  <video controls className="max-w-full max-h-96 rounded-lg">
                    <source src={previewFile.url} type={previewFile.type} />
                    Your browser does not support the video element.
                  </video>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Preview not available for this file type</p>
                </div>
              )}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Size: {formatFileSize(previewFile.size)}</span>
                <span>Created: {formatDate(previewFile.createdAt)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}