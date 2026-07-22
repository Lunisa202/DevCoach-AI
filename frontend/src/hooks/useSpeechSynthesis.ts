import { useState, useCallback, useRef } from 'react'

interface UseSpeechSynthesisReturn {
  speak: (text: string) => Promise<void>
  stop: () => void
  isSpeaking: boolean
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!window.speechSynthesis) {
        reject(new Error('SpeechSynthesis no disponible'))
        return
      }

      // Cancelar cualquier speech anterior
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'es-ES'
      utterance.rate = 0.95
      utterance.pitch = 1

      // Intentar usar una voz en español
      const voices = window.speechSynthesis.getVoices()
      const spanishVoice = voices.find(v => v.lang.startsWith('es'))
      if (spanishVoice) {
        utterance.voice = spanishVoice
      }

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => {
        setIsSpeaking(false)
        resolve()
      }
      utterance.onerror = (event) => {
        setIsSpeaking(false)
        if (event.error !== 'canceled') {
          reject(new Error(`Speech error: ${event.error}`))
        } else {
          resolve()
        }
      }

      utteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    })
  }, [])

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [])

  return { speak, stop, isSpeaking }
}
