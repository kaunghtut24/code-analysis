import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useLLMConfig } from '@/hooks/useLLMConfig'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import MobileHeader from './MobileHeader'
import LLMConfigDisplay from './analyzer/LLMConfigDisplay'
import CodeInput from './analyzer/CodeInput'
import ChatInterface from './analyzer/ChatInterface'
import { codeAnalysisService } from '@/services/codeAnalysisService'

export default function CodeAnalyzer({ githubToken, openaiKey, setSidebarOpen }) {
  const [code, setCode] = useState('')
  const [analysisType, setAnalysisType] = useState('general')
  const [loading, setLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [sessionId] = useState(() => `session_${Date.now()}`)

  const { toast } = useToast()
  const llmConfig = useLLMConfig()
  const { copiedStates, copyToClipboard } = useCopyToClipboard()

  useEffect(() => {
    // Check for URL parameters (from repository explorer)
    const params = new URLSearchParams(window.location.search)
    const repo = params.get('repo')
    const file = params.get('file')

    if (repo && file && githubToken) {
      fetchFileContent(repo, file)
    }
  }, [githubToken])

  const fetchFileContent = async (repoName, filePath) => {
    setLoading(true)
    try {
      const data = await codeAnalysisService.fetchFileContent(repoName, filePath, githubToken)
      setCode(data.content)
      toast({
        title: "File Loaded",
        description: `Loaded ${data.name} from ${repoName}`
      })
    } catch (error) {
      const { errorTitle, errorDescription } = codeAnalysisService.getErrorDetails(error.message)
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const analyzeCode = async () => {
    if (!code.trim()) {
      toast({
        title: "Error",
        description: "Please enter some code to analyze",
        variant: "destructive"
      })
      return
    }

    if (!llmConfig.hasValidConfig()) {
      toast({
        title: "Error",
        description: "Please configure your AI provider API key in Settings",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const requestData = {
        code,
        type: analysisType,
        session_id: sessionId,
        ...llmConfig.getLlmConfig()
      }

      const data = await codeAnalysisService.analyzeCode(requestData)

      // Add to chat history
      setChatMessages(prev => [
        ...prev,
        {
          type: 'user',
          content: `Analyze this ${analysisType} code`,
          timestamp: new Date(),
          provider: data.provider,
          model: data.model
        },
        {
          type: 'assistant',
          content: data.analysis,
          timestamp: new Date(),
          provider: data.provider,
          model: data.model
        }
      ])

      toast({
        title: "Analysis Complete",
        description: `Analysis completed using ${data.provider}/${data.model}`
      })
    } catch (error) {
      const { errorTitle, errorDescription } = codeAnalysisService.getErrorDetails(error.message)
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return

    if (!llmConfig.hasValidConfig()) {
      toast({
        title: "Error",
        description: "Please configure your AI provider API key in Settings",
        variant: "destructive"
      })
      return
    }

    const userMessage = {
      type: 'user',
      content: chatInput,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setLoading(true)

    try {
      const requestData = {
        message: chatInput,
        session_id: sessionId,
        ...llmConfig.getLlmConfig()
      }

      const data = await codeAnalysisService.sendChatMessage(requestData)
      setChatMessages(prev => [
        ...prev,
        {
          type: 'assistant',
          content: data.response,
          timestamp: new Date(),
          provider: data.provider,
          model: data.model
        }
      ])
    } catch (error) {
      const { errorTitle, errorDescription } = codeAnalysisService.getErrorDetails(error.message)
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <MobileHeader setSidebarOpen={setSidebarOpen} title="Code Analyzer" />

      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Code Analyzer</h1>
              <p className="text-gray-600 text-sm sm:text-base">Analyze, debug, and improve your code with AI assistance</p>
            </div>

            <LLMConfigDisplay
              llmProvider={llmConfig.llmProvider}
              llmModel={llmConfig.llmModel}
              customModel={llmConfig.customModel}
              useCustomModel={llmConfig.useCustomModel}
              temperature={llmConfig.temperature}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            <CodeInput
              code={code}
              onCodeChange={setCode}
              analysisType={analysisType}
              onAnalysisTypeChange={setAnalysisType}
              onAnalyze={analyzeCode}
              loading={loading}
              hasValidConfig={llmConfig.hasValidConfig()}
              isApiKeyRequired={llmConfig.isApiKeyRequired()}
            />

            <ChatInterface
              chatMessages={chatMessages}
              chatInput={chatInput}
              onChatInputChange={setChatInput}
              onSendMessage={sendChatMessage}
              loading={loading}
              hasValidConfig={llmConfig.hasValidConfig()}
              isApiKeyRequired={llmConfig.isApiKeyRequired()}
              copiedStates={copiedStates}
              onCopy={copyToClipboard}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

