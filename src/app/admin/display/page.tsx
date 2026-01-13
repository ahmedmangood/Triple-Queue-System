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
import { Monitor, Upload, Palette, Settings } from 'lucide-react'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'

interface DisplaySettings {
  displayTheme: string
  displayBgUrl: string
  showLogo: boolean
  showAds: boolean
  adContent: string
  transitionEffect: string
  fontSize: string
  fontFamily: string
  autoRefresh: boolean
  refreshInterval: number
}

export default function DisplayPage() {
  const [settings, setSettings] = useState<DisplaySettings>({
    displayTheme: 'default',
    displayBgUrl: '',
    showLogo: true,
    showAds: false,
    adContent: '',
    transitionEffect: 'fade',
    fontSize: 'medium',
    fontFamily: 'default',
    autoRefresh: true,
    refreshInterval: 5
  })
  
  const [isSaving, setIsSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings({
          displayTheme: data.displayTheme || 'default',
          displayBgUrl: data.displayBgUrl || '',
          showLogo: data.showLogo ?? true,
          showAds: data.showAds ?? false,
          adContent: data.adContent || '',
          transitionEffect: data.transitionEffect || 'fade',
          fontSize: data.fontSize || 'medium',
          fontFamily: data.fontFamily || 'default',
          autoRefresh: data.autoRefresh ?? true,
          refreshInterval: data.refreshInterval || 5
        })
      }
    } catch (error) {
      console.error('Error fetching display settings:', error)
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
        alert('Display settings saved successfully')
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.includes('image')) {
      alert('Please select an image file (PNG, JPG, etc.)')
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/admin/background/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(prev => ({ ...prev, displayBgUrl: data.bgUrl }))
        alert('Background uploaded successfully')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to upload background')
      }
    } catch (error) {
      console.error('Error uploading background:', error)
      alert('Failed to upload background')
    }
  }

  const themes = [
    { value: 'default', label: 'Default', colors: { primary: '#3B82F6', secondary: '#64748B' } },
    { value: 'dark', label: 'Dark', colors: { primary: '#1F2937', secondary: '#9CA3AF' } },
    { value: 'blue', label: 'Blue', colors: { primary: '#2563EB', secondary: '#60A5FA' } },
    { value: 'green', label: 'Green', colors: { primary: '#059669', secondary: '#34D399' } },
    { value: 'purple', label: 'Purple', colors: { primary: '#7C3AED', secondary: '#A78BFA' } },
  ]

  const transitions = [
    { value: 'fade', label: 'Fade' },
    { value: 'slide', label: 'Slide' },
    { value: 'zoom', label: 'Zoom' },
    { value: 'flip', label: 'Flip' },
  ]

  const fontSizes = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'xlarge', label: 'Extra Large' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Display Settings</h1>
          <p className="text-gray-600 mt-2">
            Configure how information appears on display screens
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Monitor className="h-4 w-4 mr-2" />
            {previewMode ? 'Exit Preview' : 'Preview'}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="appearance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Theme Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Theme Selection
                </CardTitle>
                <CardDescription>
                  Choose the color scheme for your display screens
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {themes.map((theme) => (
                    <div
                      key={theme.value}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        settings.displayTheme === theme.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSettings(prev => ({ ...prev, displayTheme: theme.value }))}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: theme.colors.primary }}
                        />
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: theme.colors.secondary }}
                        />
                        <span className="font-medium">{theme.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Background Image */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Background Image
                </CardTitle>
                <CardDescription>
                  Upload a custom background for display screens
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="bg-upload">Upload Background</Label>
                  <Input
                    id="bg-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="mt-2"
                  />
                </div>
                {settings.displayBgUrl && (
                  <div className="mt-4">
                    <Label>Current Background</Label>
                    <div className="mt-2 rounded-lg overflow-hidden border">
                      <ImageWithFallback
                        src={settings.displayBgUrl}
                        alt="Background preview"
                        className="w-full h-32 object-cover"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setSettings(prev => ({ ...prev, displayBgUrl: '' }))}
                    >
                      Remove Background
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Typography */}
            <Card>
              <CardHeader>
                <CardTitle>Typography</CardTitle>
                <CardDescription>
                  Configure text appearance and fonts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="font-size">Font Size</Label>
                  <Select
                    value={settings.fontSize}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, fontSize: value }))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontSizes.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="font-family">Font Family</Label>
                  <Select
                    value={settings.fontFamily}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, fontFamily: value }))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="serif">Serif</SelectItem>
                      <SelectItem value="mono">Monospace</SelectItem>
                      <SelectItem value="modern">Modern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Transition Effects */}
            <Card>
              <CardHeader>
                <CardTitle>Transition Effects</CardTitle>
                <CardDescription>
                  Choose animation effects for screen updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={settings.transitionEffect}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, transitionEffect: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {transitions.map((transition) => (
                      <SelectItem key={transition.value} value={transition.value}>
                        {transition.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Logo Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Logo Settings</CardTitle>
                <CardDescription>
                  Configure logo display on screens
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-logo">Show Logo</Label>
                    <p className="text-sm text-gray-500">
                      Display institution logo on display screens
                    </p>
                  </div>
                  <Switch
                    id="show-logo"
                    checked={settings.showLogo}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showLogo: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Advertisement Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Advertisement Settings</CardTitle>
                <CardDescription>
                  Configure promotional content display
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-ads">Show Ads</Label>
                    <p className="text-sm text-gray-500">
                      Display promotional content
                    </p>
                  </div>
                  <Switch
                    id="show-ads"
                    checked={settings.showAds}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showAds: checked }))}
                  />
                </div>
                {settings.showAds && (
                  <div>
                    <Label htmlFor="ad-content">Ad Content</Label>
                    <Textarea
                      id="ad-content"
                      value={settings.adContent}
                      onChange={(e) => setSettings(prev => ({ ...prev, adContent: e.target.value }))}
                      placeholder="Enter promotional content or HTML..."
                      className="mt-2"
                      rows={4}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Auto Refresh */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Auto Refresh
                </CardTitle>
                <CardDescription>
                  Configure automatic screen updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-refresh">Auto Refresh</Label>
                    <p className="text-sm text-gray-500">
                      Automatically refresh display content
                    </p>
                  </div>
                  <Switch
                    id="auto-refresh"
                    checked={settings.autoRefresh}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoRefresh: checked }))}
                  />
                </div>
                {settings.autoRefresh && (
                  <div>
                    <Label htmlFor="refresh-interval">Refresh Interval (seconds)</Label>
                    <Input
                      id="refresh-interval"
                      type="number"
                      min="1"
                      max="60"
                      value={settings.refreshInterval}
                      onChange={(e) => setSettings(prev => ({ ...prev, refreshInterval: parseInt(e.target.value) || 5 }))}
                      className="mt-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}