import { useSearchParams } from 'react-router-dom'
import { ChatInterviewPage } from './ChatInterviewPage'
import { VoiceInterviewPage } from './VoiceInterviewPage'

export function InterviewPage() {
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode') ?? 'chat'

  if (mode === 'voice') {
    return <VoiceInterviewPage />
  }

  return <ChatInterviewPage />
}
