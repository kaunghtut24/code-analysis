import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Code, Send, Loader2, MessageSquare, Bot, User, Settings, Brain, Copy, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { API_BASE_URL } from '@/lib/api'
import MobileHeader from './MobileHeader'
import ChatMessage from './ChatMessage'

export default function CodeAnalyzer({ githubToken, openaiKey, setSidebarOpen }) {
  const [code, setCode] = useState('')
  const [analysisType, setAnalysisType] = useState('general')
  const [analysis, setAnalysis] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [sessionId] = useState(() => `session_${Date.now()}`)
  const [copiedStates, setCopiedStates] = useState({})

  // LLM Configuration State
  const [llmProvider, setLlmProvider] = useState('openai')
  const [llmModel, setLlmModel] = useState('gpt-4o-mini')
  const [customModel, setCustomModel] = useState('')
  const [useCustomModel, setUseCustomModel] = useState(false)
  const [customBaseUrl, setCustomBaseUrl] = useState('')
  const [temperature, setTemperature] = useState(0.7)
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    anthropic: '',
    azure: '',
    ollama: '',
    custom: ''
  })
  
  const { toast } = useToast()

  useEffect(() => {
    // Load LLM settings from localStorage
    loadLlmSettings()
    
    // Check for URL parameters (from repository explorer)
    const params = new URLSearchParams(window.location.search)
    const repo = params.get('repo')
    const file = params.get('file')
    
    if (repo && file && githubToken) {
      fetchFileContent(repo, file)
    }
  }, [githubToken])

  const loadLlmSettings = () => {
    const savedProvider = localStorage.getItem('llmProvider') || 'openai'
    const savedModel = localStorage.getItem('llmModel') || 'gpt-4o-mini'
    const savedCustomModel = localStorage.getItem('customModel') || ''
    const savedUseCustomModel = localStorage.getItem('useCustomModel') === 'true'
    const savedCustomBaseUrl = localStorage.getItem('customBaseUrl') || ''
    const savedTemperature = parseFloat(localStorage.getItem('temperature')) || 0.7

    const savedApiKeys = {
      openai: localStorage.getItem('openaiKey') || '',
      anthropic: localStorage.getItem('anthropicKey') || '',
      azure: localStorage.getItem('azureKey') || '',
      ollama: localStorage.getItem('ollamaKey') || '',
      custom: localStorage.getItem('customKey') || ''
    }

    setLlmProvider(savedProvider)
    setLlmModel(savedModel)
    setCustomModel(savedCustomModel)
    setUseCustomModel(savedUseCustomModel)
    setCustomBaseUrl(savedCustomBaseUrl)
    setTemperature(savedTemperature)
    setApiKeys(savedApiKeys)
  }

  const getCurrentApiKey = () => {
    return apiKeys[llmProvider] || ''
  }

  const getLlmConfig = () => {
    return {
      provider: llmProvider,
      model: useCustomModel && customModel ? customModel : llmModel,
      api_key: getCurrentApiKey(),
      base_url: llmProvider === 'custom' && customBaseUrl ? customBaseUrl : undefined,
      temperature: temperature
    }
  }

  const isApiKeyRequired = () => {
    return llmProvider !== 'ollama'
  }

  const hasValidConfig = () => {
    if (isApiKeyRequired()) {
      return getCurrentApiKey().length > 0
    }
    return true // Ollama doesn't need API key
  }

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedStates(prev => ({ ...prev, [id]: true }))
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [id]: false }))
      }, 2000)
      toast({
        title: "Copied!",
        description: "Code copied to clipboard"
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      })
    }
  }

  const fetchFileContent = async (repoName, filePath) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/github/repository/${repoName}/file?path=${filePath}`, {
        headers: {
          'Authorization': `Bearer ${githubToken}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCode(data.content)
        toast({
          title: "File Loaded",
          description: `Loaded ${data.name} from ${repoName}`
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to fetch file content",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
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

    if (!hasValidConfig()) {
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
        ...getLlmConfig()
      }

      const response = await fetch(`${API_BASE_URL}/api/llm/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })
      
      if (response.ok) {
        const data = await response.json()
        setAnalysis(data.analysis)
        
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
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to analyze code",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return

    if (!hasValidConfig()) {
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
        ...getLlmConfig()
      }

      const response = await fetch(`${API_BASE_URL}/api/llm/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })
      
      if (response.ok) {
        const data = await response.json()
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
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to send message",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const analysisTypes = [
    { value: 'general', label: 'General Analysis' },
    { value: 'debug', label: 'Debug Issues' },
    { value: 'improve', label: 'Suggest Improvements' },
    { value: 'correct', label: 'Correct Code' }
  ]

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

            {/* Current LLM Configuration Display */}
            <Card className="w-full lg:w-64">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className="h-4 w-4" />
                  <span className="font-medium text-sm">Current AI Model</span>
                </div>
                <div className="space-y-1">
                  <Badge variant="outline" className="text-xs">
                    {useCustomModel && customModel ? customModel : llmModel}
                  </Badge>
                  <p className="text-xs text-gray-500">
                    Provider: {llmProvider} | Temp: {temperature}
                  </p>
                  {llmProvider === 'ollama' && (
                    <p className="text-xs text-green-600">
                      ✓ Local model (no API key needed)
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Code Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Code className="h-5 w-5" />
              <span>Code Input</span>
            </CardTitle>
            <CardDescription>
              Paste your code here or load from a repository file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Select value={analysisType} onValueChange={setAnalysisType}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Select analysis type" />
                </SelectTrigger>
                <SelectContent>
                  {analysisTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={analyzeCode} disabled={loading || !code.trim() || !hasValidConfig()} className="w-full sm:w-auto">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Code className="h-4 w-4 mr-2" />
                )}
                Analyze Code
              </Button>
            </div>
            
            {!hasValidConfig() && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <Settings className="h-4 w-4 inline mr-1" />
                  {isApiKeyRequired()
                    ? "Please configure your AI provider API key in Settings to enable code analysis."
                    : "Please configure your AI provider in Settings to enable code analysis."
                  }
                </p>
              </div>
            )}
            
            <Textarea
              placeholder="Paste your code here..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="min-h-64 sm:min-h-96 font-mono text-sm"
            />
          </CardContent>
        </Card>

        {/* Analysis Results & Chat */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Analysis & Chat</span>
            </CardTitle>
            <CardDescription>
              AI analysis results and interactive chat
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Chat Messages */}
            <div className="h-64 sm:h-96 overflow-y-auto border rounded-lg p-2 sm:p-4 mobile-scroll">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No analysis yet. Enter some code and click "Analyze Code" to get started.</p>
                </div>
              ) : (
                chatMessages.map((message, index) => (
                  <ChatMessage
                    key={index}
                    message={message}
                    index={index}
                    onCopy={copyToClipboard}
                    copiedStates={copiedStates}
                  />
                ))
              )}
              {loading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-gray-600">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Textarea
                placeholder="Ask a follow-up question..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendChatMessage()
                  }
                }}
                disabled={!hasValidConfig()}
              />
              <Button
                onClick={sendChatMessage}
                disabled={loading || !chatInput.trim() || !hasValidConfig()}
                className="w-full sm:w-auto sm:self-end"
              >
                <Send className="h-4 w-4 mr-2 sm:mr-0" />
                <span className="sm:hidden">Send Message</span>
              </Button>
            </div>
            
            {!hasValidConfig() && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                <p className="text-xs text-yellow-800">
                  {isApiKeyRequired()
                    ? "Configure your AI provider API key in Settings to enable chat functionality."
                    : "Configure your AI provider in Settings to enable chat functionality."
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

