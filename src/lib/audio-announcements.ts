export interface AnnouncementData {
  ticketNumber: string
  serviceCode: string
  serviceName: string
  serviceNameAr?: string
  counterNumber: number
  staffName?: string
}

export class AudioAnnouncementService {
  private static instance: AudioAnnouncementService
  private audioContext: AudioContext | null = null
  private voicesLoaded = false
  private isInitialized = false

  static getInstance(): AudioAnnouncementService {
    if (!AudioAnnouncementService.instance) {
      AudioAnnouncementService.instance = new AudioAnnouncementService()
    }
    return AudioAnnouncementService.instance
  }

  private constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.initializeVoices()
    }
  }

  private async initializeVoices(): Promise<void> {
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    // Load voices
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices()
      if (voices.length > 0) {
        this.voicesLoaded = true
        console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`))
      }
    }

    // Initial load
    loadVoices()
    
    // Listen for voices loaded event
    speechSynthesis.onvoiceschanged = loadVoices
    
    // Fallback timeout
    setTimeout(() => {
      if (!this.voicesLoaded) {
        console.warn('Speech synthesis voices may not be fully loaded')
        this.voicesLoaded = true
      }
    }, 2000)
  }

  async playAnnouncement(data: AnnouncementData): Promise<void> {
    try {
      // Ensure audio context is resumed (browser autoplay policy)
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      // Wait for voices to be loaded
      await this.waitForVoices()
      
      console.log('Starting announcement for ticket:', data.ticketNumber)

      // Generate English announcement
      const englishText = this.generateEnglishText(data)
      console.log('Playing English announcement:', englishText)
      await this.playTextToSpeech(englishText, 'en-US')
      
      // Small pause between languages
      await this.delay(500)
      
      // Generate Arabic announcement
      const arabicText = this.generateArabicText(data)
      console.log('Playing Arabic announcement:', arabicText)
      await this.playTextToSpeech(arabicText, 'ar-SA')
      
      console.log('Announcement completed successfully')
      
    } catch (error) {
      console.error('Error playing announcement:', error)
      // Fallback to simple beep sound
      await this.playFallbackSound()
    }
  }

  private async waitForVoices(): Promise<void> {
    const maxWaitTime = 5000 // 5 seconds max wait
    const startTime = Date.now()
    
    while (!this.voicesLoaded && Date.now() - startTime < maxWaitTime) {
      await this.delay(100)
    }
    
    if (!this.voicesLoaded) {
      console.warn('Proceeding without guaranteed voice loading')
    }
  }

  private generateEnglishText(data: AnnouncementData): string {
    const formattedTicketNumber = `${data.serviceCode}${data.ticketNumber.padStart(3, '0')}`
    return `Customer number ${this.spellOutNumber(formattedTicketNumber)}, please proceed to counter number ${data.counterNumber}.`
  }

  private generateArabicText(data: AnnouncementData): string {
    const formattedTicketNumber = `${data.serviceCode}${data.ticketNumber.padStart(3, '0')}`
    const arabicServiceName = data.serviceNameAr || data.serviceName
    return `العميل رقم ${this.convertToArabicNumbers(formattedTicketNumber)}, يرجى التوجه إلى الرافد رقم ${this.convertToArabicNumbers(data.counterNumber.toString())}.`
  }

  private async playTextToSpeech(text: string, lang: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.speechSynthesis) {
        reject(new Error('Speech synthesis not supported'))
        return
      }

      // Cancel any ongoing speech
      speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      utterance.rate = 0.9
      utterance.pitch = 1.0
      utterance.volume = 1.0

      // Get available voices
      const voices = speechSynthesis.getVoices()
      console.log(`Available voices for ${lang}:`, voices.filter(v => v.lang.startsWith(lang.split('-')[0])).map(v => v.name))

      // Try to find a suitable voice
      if (lang === 'ar-SA') {
        const arabicVoice = voices.find(voice => 
          voice.lang.startsWith('ar') || 
          voice.name.includes('Arabic') ||
          voice.name.includes('العربية')
        )
        if (arabicVoice) {
          utterance.voice = arabicVoice
          console.log('Using Arabic voice:', arabicVoice.name)
        } else {
          console.warn('No Arabic voice found, using default voice')
        }
      } else if (lang === 'en-US') {
        const englishVoice = voices.find(voice => 
          (voice.lang.startsWith('en') && voice.name.includes('Female')) ||
          (voice.lang.startsWith('en-US')) ||
          (voice.lang.startsWith('en-GB'))
        )
        if (englishVoice) {
          utterance.voice = englishVoice
          console.log('Using English voice:', englishVoice.name)
        } else {
          console.warn('No preferred English voice found, using default voice')
        }
      }

      utterance.onstart = () => {
        console.log(`Started speaking: ${text}`)
      }

      utterance.onend = () => {
        console.log(`Finished speaking: ${text}`)
        resolve()
      }
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error, event)
        reject(event.error)
      }

      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.warn('Speech synthesis timeout, cancelling...')
        speechSynthesis.cancel()
        resolve()
      }, 10000) // 10 second timeout

      utterance.onend = () => {
        clearTimeout(timeout)
        resolve()
      }
      
      utterance.onerror = (event) => {
        clearTimeout(timeout)
        reject(event.error)
      }

      speechSynthesis.speak(utterance)
    })
  }

  private spellOutNumber(text: string): string {
    // Convert alphanumeric ticket number to spoken format
    return text.split('').map(char => {
      if (/\d/.test(char)) {
        return this.numberToWords(parseInt(char))
      } else {
        return char
      }
    }).join(' ')
  }

  private numberToWords(num: number): string {
    const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
    return words[num] || num.toString()
  }

  private convertToArabicNumbers(text: string): string {
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
    return text.replace(/[0-9]/g, (digit) => {
      return arabicNumbers[parseInt(digit)]
    })
  }

  private async playFallbackSound(): Promise<void> {
    if (!this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime)
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5)
    
    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + 0.5)

    return new Promise(resolve => setTimeout(resolve, 600))
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Preload voices and initialize audio context
  async preloadVoices(): Promise<void> {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('Speech synthesis not available in this environment')
      return
    }

    try {
      // Resume audio context if suspended
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      // Trigger voice loading
      const voices = speechSynthesis.getVoices()
      
      if (voices.length > 0) {
        this.voicesLoaded = true
        console.log(`Found ${voices.length} voices available`)
        // Log some useful voices
        const englishVoices = voices.filter(v => v.lang.startsWith('en'))
        const arabicVoices = voices.filter(v => v.lang.startsWith('ar'))
        
        if (englishVoices.length > 0) {
          console.log('English voices available:', englishVoices.map(v => v.name))
        }
        if (arabicVoices.length > 0) {
          console.log('Arabic voices available:', arabicVoices.map(v => v.name))
        }
      } else {
        console.log('No voices loaded yet, will try again...')
      }
      
      // Test speech synthesis with a short utterance
      const testUtterance = new SpeechSynthesisUtterance('test')
      testUtterance.volume = 0
      speechSynthesis.speak(testUtterance)
      
    } catch (error) {
      console.error('Error preloading voices:', error)
    }
  }

  // Method to check if speech synthesis is ready
  async isReady(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return false
    }

    await this.waitForVoices()
    return this.voicesLoaded && speechSynthesis.getVoices().length > 0
  }
}

export const audioAnnouncementService = AudioAnnouncementService.getInstance()