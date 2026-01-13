'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileUpload } from '@/components/ui/file-upload'
import { Building, Upload, Globe, Clock, Shield, Database } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'

interface InstitutionSettings {
  institutionName: string
  logo: string
  callSoundUrl: string
  displayBgUrl: string
  language: string
  timezone: string
  autoResetCounters: boolean
  resetTime: string
  enableAuditLog: boolean
  dataRetentionDays: number
  maintenanceMode: boolean
  allowKioskAccess: boolean
  sessionTimeout: number
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<InstitutionSettings>({
    institutionName: 'Queue Management System',
    logo: '',
    callSoundUrl: '',
    displayBgUrl: '',
    language: 'en',
    timezone: 'UTC',
    autoResetCounters: false,
    resetTime: '00:00',
    enableAuditLog: true,
    dataRetentionDays: 90,
    maintenanceMode: false,
    allowKioskAccess: true,
    sessionTimeout: 30
  })
  
  const [isSaving, setIsSaving] = useState(false)
  const [logoFileName, setLogoFileName] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings({
          institutionName: data.institutionName || 'Queue Management System',
          logo: data.logo || '',
          callSoundUrl: data.callSoundUrl || '',
          displayBgUrl: data.displayBgUrl || '',
          language: data.language || 'en',
          timezone: data.timezone || 'UTC',
          autoResetCounters: data.autoResetCounters ?? false,
          resetTime: data.resetTime || '00:00',
          enableAuditLog: data.enableAuditLog ?? true,
          dataRetentionDays: data.dataRetentionDays || 90,
          maintenanceMode: data.maintenanceMode ?? false,
          allowKioskAccess: data.allowKioskAccess ?? true,
          sessionTimeout: data.sessionTimeout || 30
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        alert('Settings saved successfully')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoUpload = async (files: File[]) => {
    try {
      const formData = new FormData()
      formData.append('file', files[0])
      formData.append('type', 'image')
      
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(prev => ({ ...prev, logo: data.file.url }))
        setLogoFileName(files[0].name)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload logo')
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
      throw error
    }
  }

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ar', label: 'Arabic' },
  ]

  const timezones = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'London (GMT/BST)' },
    { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Institution Settings</h1>
          <p className="text-gray-600 mt-2">
            Configure your organization's basic information and system preferences
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Institution Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Institution Information
                </CardTitle>
                <CardDescription>
                  Basic information about your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="institution-name">Institution Name</Label>
                  <Input
                    id="institution-name"
                    value={settings.institutionName}
                    onChange={(e) => setSettings(prev => ({ ...prev, institutionName: e.target.value }))}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="logo-upload">Logo</Label>
                  <div className="mt-2">
                    <FileUpload
                      type="image"
                      maxSize={2 * 1024 * 1024} // 2MB
                      maxFiles={1}
                      onUpload={async (files) => {
                        try {
                          await handleLogoUpload(files)
                          toast({
                            title: "Logo uploaded successfully",
                            description: "Your logo has been updated.",
                          })
                        } catch (error) {
                          toast({
                            title: "Upload failed",
                            description: error instanceof Error ? error.message : 'Failed to upload logo',
                            variant: "destructive",
                          })
                        }
                      }}
                    />
                  </div>
                  {logoFileName && (
                    <p className="text-sm text-green-600 mt-2">
                      Uploaded: {logoFileName}
                    </p>
                  )}
                  {settings.logo && (
                    <div className="mt-4">
                      <Label>Current Logo</Label>
                      <div className="mt-2 flex items-center gap-4">
                        <ImageWithFallback
                          src={settings.logo}
                          alt="Logo preview"
                          className="h-16 w-16 object-contain border rounded"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSettings(prev => ({ ...prev, logo: '' }))}
                        >
                          Remove Logo
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Regional Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Regional Settings
                </CardTitle>
                <CardDescription>
                  Language and timezone preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={settings.language}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={settings.timezone}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Audio Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Audio Files
                </CardTitle>
                <CardDescription>
                  Upload notification sounds and audio files
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="call-sound">Call Notification Sound</Label>
                  <div className="mt-2">
                    <FileUpload
                      type="audio"
                      maxSize={5 * 1024 * 1024} // 5MB
                      maxFiles={1}
                      onUpload={async (files) => {
                        try {
                          const formData = new FormData()
                          formData.append('file', files[0])
                          formData.append('type', 'audio')
                          
                          const response = await fetch('/api/admin/upload', {
                            method: 'POST',
                            body: formData
                          })

                          if (response.ok) {
                            const data = await response.json()
                            setSettings(prev => ({ ...prev, callSoundUrl: data.file.url }))
                            toast({
                              title: "Audio uploaded successfully",
                              description: "Call notification sound has been updated.",
                            })
                          } else {
                            throw new Error('Failed to upload audio')
                          }
                        } catch (error) {
                          toast({
                            title: "Upload failed",
                            description: "Failed to upload audio file",
                            variant: "destructive",
                          })
                        }
                      }}
                    />
                  </div>
                  {settings.callSoundUrl && (
                    <div className="mt-4">
                      <Label>Current Audio</Label>
                      <div className="mt-2 flex items-center gap-4">
                        <audio controls className="h-8">
                          <source src={settings.callSoundUrl} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSettings(prev => ({ ...prev, callSoundUrl: '' }))}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Display Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Display Background
                </CardTitle>
                <CardDescription>
                  Upload background image for display screens
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="display-bg">Display Background Image</Label>
                  <div className="mt-2">
                    <FileUpload
                      type="image"
                      maxSize={10 * 1024 * 1024} // 10MB
                      maxFiles={1}
                      onUpload={async (files) => {
                        try {
                          const formData = new FormData()
                          formData.append('file', files[0])
                          formData.append('type', 'image')
                          
                          const response = await fetch('/api/admin/upload', {
                            method: 'POST',
                            body: formData
                          })

                          if (response.ok) {
                            const data = await response.json()
                            setSettings(prev => ({ ...prev, displayBgUrl: data.file.url }))
                            toast({
                              title: "Background uploaded successfully",
                              description: "Display background has been updated.",
                            })
                          } else {
                            throw new Error('Failed to upload background')
                          }
                        } catch (error) {
                          toast({
                            title: "Upload failed",
                            description: "Failed to upload background image",
                            variant: "destructive",
                          })
                        }
                      }}
                    />
                  </div>
                  {settings.displayBgUrl && (
                    <div className="mt-4">
                      <Label>Current Background</Label>
                      <div className="mt-2 flex items-center gap-4">
                        <ImageWithFallback
                          src={settings.displayBgUrl}
                          alt="Display background preview"
                          className="h-16 w-24 object-cover border rounded"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSettings(prev => ({ ...prev, displayBgUrl: '' }))}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Media Management Link */}
          <Card>
            <CardHeader>
              <CardTitle>Media Library</CardTitle>
              <CardDescription>
                Access the full media library to manage all uploaded files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <a href="/admin/media">
                  <Upload className="h-4 w-4 mr-2" />
                  Open Media Library
                </a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Counter Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Counter Management
                </CardTitle>
                <CardDescription>
                  Automatic ticket counter reset settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-reset">Auto Reset Counters</Label>
                    <p className="text-sm text-gray-500">
                      Reset all service counters automatically
                    </p>
                  </div>
                  <Switch
                    id="auto-reset"
                    checked={settings.autoResetCounters}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoResetCounters: checked }))}
                  />
                </div>

                {settings.autoResetCounters && (
                  <div>
                    <Label htmlFor="reset-time">Reset Time</Label>
                    <Input
                      id="reset-time"
                      type="time"
                      value={settings.resetTime}
                      onChange={(e) => setSettings(prev => ({ ...prev, resetTime: e.target.value }))}
                      className="mt-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>
                  Control system availability and access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                    <p className="text-sm text-gray-500">
                      Temporarily disable customer-facing features
                    </p>
                  </div>
                  <Switch
                    id="maintenance-mode"
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="kiosk-access">Allow Kiosk Access</Label>
                    <p className="text-sm text-gray-500">
                      Enable customer kiosk for ticket issuance
                    </p>
                  </div>
                  <Switch
                    id="kiosk-access"
                    checked={settings.allowKioskAccess}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allowKioskAccess: checked }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security and session management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                <Input
                  id="session-timeout"
                  type="number"
                  min="5"
                  max="480"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) || 30 }))}
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Users will be logged out after this period of inactivity
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Configure data retention and audit logging
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="audit-log">Enable Audit Log</Label>
                  <p className="text-sm text-gray-500">
                    Track all administrative actions
                  </p>
                </div>
                <Switch
                  id="audit-log"
                  checked={settings.enableAuditLog}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableAuditLog: checked }))}
                />
              </div>

              <div>
                <Label htmlFor="data-retention">Data Retention (days)</Label>
                <Input
                  id="data-retention"
                  type="number"
                  min="7"
                  max="365"
                  value={settings.dataRetentionDays}
                  onChange={(e) => setSettings(prev => ({ ...prev, dataRetentionDays: parseInt(e.target.value) || 90 }))}
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Tickets and audit logs older than this will be automatically deleted
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}