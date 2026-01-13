// Generate a simple beep sound using Web Audio API
function generateBeepData() {
  // Create a simple WAV file header and data for a beep sound
  const sampleRate = 44100
  const duration = 0.2 // 200ms
  const frequency = 800 // 800Hz tone
  const numSamples = Math.floor(sampleRate * duration)
  
  // WAV file header (44 bytes)
  const header = new ArrayBuffer(44)
  const view = new DataView(header)
  
  // RIFF chunk descriptor
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }
  
  writeString(0, 'RIFF')
  view.setUint32(4, 36 + numSamples * 2, true) // File size - 8
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true) // Subchunk1Size
  view.setUint16(20, 1, true) // AudioFormat (PCM)
  view.setUint16(22, 1, true) // NumChannels (mono)
  view.setUint32(24, sampleRate, true) // SampleRate
  view.setUint32(28, sampleRate * 2, true) // ByteRate
  view.setUint16(32, 2, true) // BlockAlign
  view.setUint16(34, 16, true) // BitsPerSample
  
  // data subchunk
  writeString(36, 'data')
  view.setUint32(40, numSamples * 2, true) // Subchunk2Size
  
  // Generate audio data
  const audioData = new ArrayBuffer(numSamples * 2)
  const audioView = new DataView(audioData)
  
  for (let i = 0; i < numSamples; i++) {
    const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate)
    const value = Math.floor(sample * 32767) // Convert to 16-bit PCM
    audioView.setInt16(i * 2, value, true)
  }
  
  // Combine header and data
  const wavFile = new Uint8Array(header.byteLength + audioData.byteLength)
  wavFile.set(new Uint8Array(header), 0)
  wavFile.set(new Uint8Array(audioData), header.byteLength)
  
  // Convert to base64
  const base64 = btoa(String.fromCharCode.apply(null, wavFile))
  return 'data:audio/wav;base64,' + base64
}

// Export the generated audio data
export const beepAudioData = generateBeepData()