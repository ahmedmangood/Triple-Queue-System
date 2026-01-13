'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileUpload } from '@/components/ui/file-upload'
import { FileGallery } from '@/components/admin/file-gallery'
import { 
  Image as ImageIcon, 
  Music, 
  Video, 
  FileText, 
  Upload,
  FolderOpen,
  Settings
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface UploadedFile {
  name: string
  originalName: string
  fileName: string
  url: string
  size: number
  type: string
  category: string
  uploadedAt: string
}

export default function MediaManagement() {
  const [activeTab, setActiveTab] = useState('images')
  const [uploadTab, setUploadTab] = useState('upload')

  const handleFileUpload = async (files: File[]) => {
    const formData = new FormData()
    
    // Determine file type based on the first file
    const fileType = files[0].type.startsWith('image/') ? 'image' :
                    files[0].type.startsWith('audio/') ? 'audio' :
                    files[0].type.startsWith('video/') ? 'video' : 'document'
    
    formData.append('type', fileType)
    
    // Upload files one by one for now (can be parallelized)
    for (const file of files) {
      formData.append('file', file)
      
      try {
        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Upload failed')
        }
        
        const result = await response.json()
        toast({
          title: "Upload successful",
          description: `${file.name} has been uploaded successfully.`,
        })
        
        // Clear the form data for next file
        formData.delete('file')
        
      } catch (error) {
        console.error('Upload error:', error)
        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : 'Failed to upload file',
          variant: "destructive",
        })
        throw error
      }
    }
  }

  const handleFileSelect = (file: any) => {
    // Copy file URL to clipboard
    navigator.clipboard.writeText(file.url)
    toast({
      title: "URL copied",
      description: "File URL has been copied to clipboard.",
    })
  }

  const fileTypes = [
    {
      id: 'images',
      label: 'Images',
      icon: ImageIcon,
      description: 'JPG, PNG, GIF, WebP, SVG',
      maxSize: '5MB'
    },
    {
      id: 'audio',
      label: 'Audio',
      icon: Music,
      description: 'MP3, WAV, OGG, M4A, AAC',
      maxSize: '10MB'
    },
    {
      id: 'video',
      label: 'Video',
      icon: Video,
      description: 'MP4, WebM, OGG',
      maxSize: '50MB'
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      description: 'PDF, DOC, DOCX, TXT',
      maxSize: '5MB'
    }
  ]

  const currentFileType = fileTypes.find(type => type.id === activeTab.slice(0, -1)) || fileTypes[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Media Management</h1>
          <p className="text-gray-600 mt-2">
            Upload and manage your media files including images, audio, video, and documents.
          </p>
        </div>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* File Type Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          {fileTypes.map((type) => {
            const Icon = type.icon
            return (
              <TabsTrigger key={type.id} value={type.id} className="flex items-center space-x-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{type.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {fileTypes.map((fileType) => (
          <TabsContent key={fileType.id} value={fileType.id} className="space-y-6">
            {/* File Type Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-lg ${
                    fileType.id === 'images' ? 'bg-blue-50' :
                    fileType.id === 'audio' ? 'bg-green-50' :
                    fileType.id === 'video' ? 'bg-purple-50' : 'bg-orange-50'
                  }`}>
                    <fileType.icon className={`h-6 w-6 ${
                      fileType.id === 'images' ? 'text-blue-600' :
                      fileType.id === 'audio' ? 'text-green-600' :
                      fileType.id === 'video' ? 'text-purple-600' : 'text-orange-600'
                    }`} />
                  </div>
                  <div>
                    <CardTitle>{fileType.label}</CardTitle>
                    <p className="text-sm text-gray-600">
                      Supported formats: {fileType.description} • Max size: {fileType.maxSize}
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Upload and Gallery Tabs */}
            <Tabs value={uploadTab} onValueChange={setUploadTab}>
              <TabsList>
                <TabsTrigger value="upload" className="flex items-center space-x-2">
                  <Upload className="h-4 w-4" />
                  <span>Upload</span>
                </TabsTrigger>
                <TabsTrigger value="gallery" className="flex items-center space-x-2">
                  <FolderOpen className="h-4 w-4" />
                  <span>Gallery</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-6">
                <FileUpload
                  type={fileType.id.slice(0, -1) as 'image' | 'audio' | 'document' | 'video'}
                  multiple={true}
                  maxFiles={10}
                  maxSize={
                    fileType.id === 'images' ? 5 * 1024 * 1024 :
                    fileType.id === 'audio' ? 10 * 1024 * 1024 :
                    fileType.id === 'video' ? 50 * 1024 * 1024 : 5 * 1024 * 1024
                  }
                  onUpload={handleFileUpload}
                />
              </TabsContent>

              <TabsContent value="gallery">
                <FileGallery 
                  type={fileType.id.slice(0, -1) as 'image' | 'audio' | 'document' | 'video'}
                  onSelect={handleFileSelect}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}