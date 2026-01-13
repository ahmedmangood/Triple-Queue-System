'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Volume2, Upload, Play, Pause, Music, Bell } from 'lucide-react'

interface SoundSettings {
  callSoundUrl: string
  volume: number
  enableSound: boolean
  repeatSound: boolean
  soundDelay: number
  defaultSound: string
}

const defaultSounds = [
  { value: 'ding', label: 'Ding', url: '/sounds/ding.mp3' },
  { value: 'bell', label: 'Bell', url: '/sounds/bell.mp3' },
  { value: 'chime', label: 'Chime', url: '/sounds/chime.mp3' },
  { value: 'notification', label: 'Notification', url: '/sounds/notification.mp3' },
  { value: 'beep', label: 'Beep', url: '/sounds/beep.mp3' },
]

export default function SoundPage() {
  const [settings, setSettings] = useState<SoundSettings>({
    callSoundUrl: '',
    volume: 75,
    enableSound: true,
    repeatSound: false,
    soundDelay: 1,
    defaultSound: 'ding'
  })
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings({
          callSoundUrl: data.callSoundUrl || '',
          volume: data.volume || 75,
          enableSound: data.enableSound ?? true,
          repeatSound: data.repeatSound ?? false,
          soundDelay: data.soundDelay || 1,
          defaultSound: data.defaultSound || 'ding'
        })
      }
    } catch (error) {
      console.error('Error fetching sound settings:', error)
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
        alert('Sound settings saved successfully')
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

  const handleSoundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.includes('audio')) {
      alert('Please select an audio file (MP3, WAV, etc.)')
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setUploadedFileName(file.name)
    
    // In a real implementation, you would upload to a storage service
    // For now, we'll simulate with a local URL
    const audioUrl = URL.createObjectURL(file)
    setSettings(prev => ({ ...prev, callSoundUrl: audioUrl }))
  }

  const playSound = async (soundUrl: string) => {
    if (isPlaying) return
    
    setIsPlaying(true)
    try {
      const audio = new Audio(soundUrl)
      audio.volume = settings.volume / 100
      
      audio.onended = () => {
        setIsPlaying(false)
      }
      
      audio.onerror = () => {
        setIsPlaying(false)
        alert('Failed to play sound')
      }
      
      await audio.play()
    } catch (error) {
      setIsPlaying(false)
      console.error('Error playing sound:', error)
    }
  }

  const testCurrentSound = () => {
    const soundUrl = settings.callSoundUrl || 
      defaultSounds.find(s => s.value === settings.defaultSound)?.url || ''
    
    if (soundUrl) {
      playSound(soundUrl)
    } else {
      alert('No sound selected')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sound & Notifications</h1>
          <p className="text-gray-600 mt-2">
            Configure audio notifications for ticket calls
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <Tabs defaultValue="sound-selection" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sound-selection">Sound Selection</TabsTrigger>
          <TabsTrigger value="playback">Playback Settings</TabsTrigger>
          <TabsTrigger value="test">Test Sound</TabsTrigger>
        </TabsList>

        <TabsContent value="sound-selection" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Default Sounds */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Default Sounds
                </CardTitle>
                <CardDescription>
                  Choose from our built-in sound library
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="default-sound">Select Default Sound</Label>
                  <Select
                    value={settings.defaultSound}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, defaultSound: value }))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {defaultSounds.map((sound) => (
                        <SelectItem key={sound.value} value={sound.value}>
                          <div className="flex items-center gap-2">
                            <span>{sound.label}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                playSound(sound.url)
                              }}
                              disabled={isPlaying}
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Custom Sound Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Custom Sound
                </CardTitle>
                <CardDescription>
                  Upload your own notification sound (MP3, WAV - Max 5MB)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="sound-upload">Upload Custom Sound</Label>
                  <Input
                    id="sound-upload"
                    type="file"
                    accept="audio/*"
                    onChange={handleSoundUpload}
                    className="mt-2"
                  />
                  {uploadedFileName && (
                    <p className="text-sm text-green-600 mt-2">
                      Uploaded: {uploadedFileName}
                    </p>
                  )}
                </div>
                
                {settings.callSoundUrl && (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Bell className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">Custom sound uploaded</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => playSound(settings.callSoundUrl)}
                      disabled={isPlaying}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSettings(prev => ({ ...prev, callSoundUrl: '' }))}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="playback" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Volume Control */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5" />
                  Volume Control
                </CardTitle>
                <CardDescription>
                  Adjust the notification volume
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="volume">Volume</Label>
                    <span className="text-sm text-gray-600">{settings.volume}%</span>
                  </div>
                  <Slider
                    id="volume"
                    min={0}
                    max={100}
                    step={5}
                    value={[settings.volume]}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, volume: value[0] }))}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Sound Behavior */}
            <Card>
              <CardHeader>
                <CardTitle>Sound Behavior</CardTitle>
                <CardDescription>
                  Configure how and when sounds play
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable-sound">Enable Sound</Label>
                    <p className="text-sm text-gray-500">
                      Play sound when calling tickets
                    </p>
                  </div>
                  <Switch
                    id="enable-sound"
                    checked={settings.enableSound}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableSound: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="repeat-sound">Repeat Sound</Label>
                    <p className="text-sm text-gray-500">
                      Play sound multiple times
                    </p>
                  </div>
                  <Switch
                    id="repeat-sound"
                    checked={settings.repeatSound}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, repeatSound: checked }))}
                  />
                </div>

                <div>
                  <Label htmlFor="sound-delay">Sound Delay (seconds)</Label>
                  <Input
                    id="sound-delay"
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={settings.soundDelay}
                    onChange={(e) => setSettings(prev => ({ ...prev, soundDelay: parseFloat(e.target.value) || 1 }))}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Sound</CardTitle>
              <CardDescription>
                Test your current sound settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  onClick={testCurrentSound}
                  disabled={isPlaying || !settings.enableSound}
                  size="lg"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Playing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Test Current Sound
                    </>
                  )}
                </Button>
                
                <div className="text-sm text-gray-600">
                  {settings.enableSound ? (
                    <span>Volume: {settings.volume}%</span>
                  ) : (
                    <span className="text-red-600">Sound is disabled</span>
                  )}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Current Settings:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Sound: {settings.callSoundUrl ? 'Custom uploaded' : defaultSounds.find(s => s.value === settings.defaultSound)?.label}</li>
                  <li>• Volume: {settings.volume}%</li>
                  <li>• Status: {settings.enableSound ? 'Enabled' : 'Disabled'}</li>
                  <li>• Repeat: {settings.repeatSound ? 'Yes' : 'No'}</li>
                  <li>• Delay: {settings.soundDelay}s</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}