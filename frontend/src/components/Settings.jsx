import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Eye, EyeOff, Save, Trash2, TestTube, CheckCircle, XCircle, ExternalLink, Settings as SettingsIcon, Brain, Github, Key, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { API_BASE_URL } from '@/lib/api'

import MobileHeader from './MobileHeader'

export default function Settings({ setSidebarOpen }) {
  const [githubToken, setGithubToken] = useState('')
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    anthropic: '',
    azure: '',
    custom: ''
  })
  const [showGithubToken, setShowGithubToken] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  
  // LLM Configuration
  const [providers, setProviders] = useState({})
  const [selectedProvider, setSelectedProvider] = useState('openai')
  const [availableModels, setAvailableModels] = useState([])
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini')
  const [customModel, setCustomModel] = useState('')
  const [useCustomModel, setUseCustomModel] = useState(false)
  const [customBaseUrl, setCustomBaseUrl] = useState('')
  const [temperature, setTemperature] = useState([0.7])
  const [connectionStatus, setConnectionStatus] = useState('not_tested')
  const [testingConnection, setTestingConnection] = useState(false)
  const [loadingProviders, setLoadingProviders] = useState(true)
  const [loadingModels, setLoadingModels] = useState(false)
  
  const { toast } = useToast()

  useEffect(() => {
    loadSettings()
    fetchProviders()
  }, [])

  useEffect(() => {
    if (selectedProvider && providers[selectedProvider]) {
      fetchModels(selectedProvider)
    }
  }, [selectedProvider, providers])

  const loadSettings = () => {
    const savedGithubToken = localStorage.getItem('githubToken') || ''
    const savedApiKeys = {
      openai: localStorage.getItem('openaiKey') || '',
      anthropic: localStorage.getItem('anthropicKey') || '',
      azure: localStorage.getItem('azureKey') || '',
      ollama: localStorage.getItem('ollamaKey') || '',
      custom: localStorage.getItem('customKey') || ''
    }
    const savedProvider = localStorage.getItem('llmProvider') || 'openai'
    const savedModel = localStorage.getItem('llmModel') || 'gpt-4o-mini'
    const savedCustomModel = localStorage.getItem('customModel') || ''
    const savedUseCustomModel = localStorage.getItem('useCustomModel') === 'true'
    const savedCustomBaseUrl = localStorage.getItem('customBaseUrl') || ''
    const savedTemperature = parseFloat(localStorage.getItem('temperature')) || 0.7

    setGithubToken(savedGithubToken)
    setApiKeys(savedApiKeys)
    setSelectedProvider(savedProvider)
    setSelectedModel(savedModel)
    setCustomModel(savedCustomModel)
    setUseCustomModel(savedUseCustomModel)
    setCustomBaseUrl(savedCustomBaseUrl)
    setTemperature([savedTemperature])
  }

  const fetchProviders = async () => {
    setLoadingProviders(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/llm/providers`)
      if (response.ok) {
        const data = await response.json()
        setProviders(data.providers)
      } else {
        toast({
          title: "Error",
          description: "Failed to load AI providers. Please check your connection.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error)
      toast({
        title: "Error",
        description: "Failed to load AI providers. Please check your connection.",
        variant: "destructive"
      })
    } finally {
      setLoadingProviders(false)
    }
  }

  const fetchModels = async (provider) => {
    setLoadingModels(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/llm/models?provider=${provider}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableModels(data.models)
        if (!data.models.includes(selectedModel)) {
          setSelectedModel(data.default_model)
        }
      } else {
        toast({
          title: "Error",
          description: `Failed to load models for ${provider}. Please try again.`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Failed to fetch models:', error)
      toast({
        title: "Error",
        description: `Failed to load models for ${provider}. Please check your connection.`,
        variant: "destructive"
      })
    } finally {
      setLoadingModels(false)
    }
  }

  const saveSettings = () => {
    localStorage.setItem('githubToken', githubToken)
    localStorage.setItem('openaiKey', apiKeys.openai)
    localStorage.setItem('anthropicKey', apiKeys.anthropic)
    localStorage.setItem('azureKey', apiKeys.azure)
    localStorage.setItem('ollamaKey', apiKeys.ollama)
    localStorage.setItem('customKey', apiKeys.custom)
    localStorage.setItem('llmProvider', selectedProvider)
    localStorage.setItem('llmModel', selectedModel)
    localStorage.setItem('customModel', customModel)
    localStorage.setItem('useCustomModel', useCustomModel.toString())
    localStorage.setItem('customBaseUrl', customBaseUrl)
    localStorage.setItem('temperature', temperature[0].toString())

    toast({
      title: "Settings Saved",
      description: "Your configuration has been saved successfully."
    })

    // Reset connection status when settings change
    setConnectionStatus('not_tested')
  }

  const clearSettings = () => {
    localStorage.removeItem('githubToken')
    localStorage.removeItem('openaiKey')
    localStorage.removeItem('anthropicKey')
    localStorage.removeItem('azureKey')
    localStorage.removeItem('ollamaKey')
    localStorage.removeItem('customKey')
    localStorage.removeItem('llmProvider')
    localStorage.removeItem('llmModel')
    localStorage.removeItem('customModel')
    localStorage.removeItem('useCustomModel')
    localStorage.removeItem('customBaseUrl')
    localStorage.removeItem('temperature')

    setGithubToken('')
    setApiKeys({
      openai: '',
      anthropic: '',
      azure: '',
      ollama: '',
      custom: ''
    })
    setSelectedProvider('openai')
    setSelectedModel('gpt-4o-mini')
    setCustomModel('')
    setUseCustomModel(false)
    setCustomBaseUrl('')
    setTemperature([0.7])
    setConnectionStatus('not_tested')

    toast({
      title: "Settings Cleared",
      description: "All settings have been cleared."
    })
  }

  const testConnection = async () => {
    const currentApiKey = apiKeys[selectedProvider] || ''
    if (!currentApiKey && selectedProvider !== 'ollama') {
      toast({
        title: "Error",
        description: "Please enter an API key for the selected provider before testing connection.",
        variant: "destructive"
      })
      return
    }

    setTestingConnection(true)
    setConnectionStatus('testing')

    try {
      const testData = {
        provider: selectedProvider,
        model: useCustomModel && customModel ? customModel : selectedModel,
        api_key: currentApiKey,
        base_url: selectedProvider === 'custom' && customBaseUrl ? customBaseUrl : undefined
      }

      const response = await fetch(`${API_BASE_URL}/api/llm/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      })

      const data = await response.json()

      if (data.success) {
        setConnectionStatus('success')
        toast({
          title: "Connection Successful",
          description: `Successfully connected to ${data.provider}/${data.model}`
        })
      } else {
        setConnectionStatus('failed')
        toast({
          title: "Connection Failed",
          description: data.error || "Failed to connect to AI provider",
          variant: "destructive"
        })
      }
    } catch (error) {
      setConnectionStatus('failed')
      toast({
        title: "Connection Failed",
        description: "Failed to connect to server",
        variant: "destructive"
      })
    } finally {
      setTestingConnection(false)
    }
  }

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'testing':
        return <TestTube className="h-4 w-4 text-blue-500 animate-pulse" />
      default:
        return <TestTube className="h-4 w-4 text-gray-400" />
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'success':
        return 'Connected'
      case 'failed':
        return 'Failed'
      case 'testing':
        return 'Testing...'
      default:
        return 'Not tested'
    }
  }

  const isCustomProvider = selectedProvider === 'custom'
  const currentModel = useCustomModel && customModel ? customModel : selectedModel
  const currentApiKey = apiKeys[selectedProvider] || ''

  const getProviderName = (provider) => {
    const providerNames = {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      azure: 'Azure OpenAI',
      ollama: 'Ollama (Local)',
      custom: 'Custom Provider'
    }
    return providerNames[provider] || provider
  }

  const getApiKeyPlaceholder = (provider) => {
    const placeholders = {
      openai: 'sk-xxxxxxxxxxxxxxxxxxxx',
      anthropic: 'sk-ant-xxxxxxxxxxxxxxxxxxxx',
      azure: 'your-azure-api-key',
      ollama: 'No API key needed for local Ollama',
      custom: 'your-custom-api-key'
    }
    return placeholders[provider] || 'your-api-key'
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <MobileHeader setSidebarOpen={setSidebarOpen} title="Settings" />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-6xl mx-auto pb-20">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 text-sm sm:text-base">Configure your API keys and AI model preferences</p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>API Configuration</span>
            </CardTitle>
            <CardDescription>
              Configure your GitHub and AI provider API keys
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* GitHub Token */}
            <div className="space-y-2">
              <Label htmlFor="github-token" className="flex items-center space-x-2">
                <Github className="h-4 w-4" />
                <span>GitHub Personal Access Token</span>
              </Label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Input
                    id="github-token"
                    type={showGithubToken ? "text" : "password"}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowGithubToken(!showGithubToken)}
                  >
                    {showGithubToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Required for accessing GitHub repositories.{' '}
                <a 
                  href="https://github.com/settings/tokens" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline inline-flex items-center"
                >
                  Generate a token here
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </p>
            </div>

            {/* AI Provider API Key */}
            <div className="space-y-2">
              <Label htmlFor="api-key" className="flex items-center space-x-2">
                <Brain className="h-4 w-4" />
                <span>{getProviderName(selectedProvider)} API Key</span>
              </Label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Input
                    id="api-key"
                    type={showApiKey ? "text" : "password"}
                    placeholder={getApiKeyPlaceholder(selectedProvider)}
                    value={currentApiKey}
                    onChange={(e) => setApiKeys(prev => ({
                      ...prev,
                      [selectedProvider]: e.target.value
                    }))}
                    className="pr-10"
                    disabled={selectedProvider === 'ollama'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {selectedProvider === 'ollama'
                  ? 'Ollama runs locally and does not require an API key. Make sure Ollama is running on http://localhost:11434'
                  : `API key for ${getProviderName(selectedProvider)} - required for AI analysis`
                }
              </p>
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Button onClick={saveSettings} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
              <Button onClick={clearSettings} variant="outline" className="flex-1">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Model Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <span>AI Model Configuration</span>
            </CardTitle>
            <CardDescription>
              Choose your AI provider and model for code analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* AI Provider */}
            <div className="space-y-2">
              <Label>AI Provider</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider} disabled={loadingProviders}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingProviders ? "Loading providers..." : "Select AI provider"} />
                  {loadingProviders && <Loader2 className="h-4 w-4 animate-spin" />}
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(providers).map(([key, provider]) => (
                    <SelectItem key={key} value={key}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Model Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Model</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="use-custom-model"
                    checked={useCustomModel}
                    onChange={(e) => setUseCustomModel(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="use-custom-model" className="text-sm text-gray-600">
                    Use custom model
                  </Label>
                </div>
              </div>

              {useCustomModel ? (
                <Input
                  placeholder="Enter model name (e.g., gpt-4o-mini, claude-3-5-sonnet-20241022)"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                />
              ) : (
                <Select value={selectedModel} onValueChange={setSelectedModel} disabled={loadingModels}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingModels ? "Loading models..." : "Select model"} />
                    {loadingModels && <Loader2 className="h-4 w-4 animate-spin" />}
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <p className="text-xs text-gray-500">
                {useCustomModel
                  ? "Enter any model name supported by your provider. Model names change frequently, so this allows you to use the latest models."
                  : "Select from popular models or check 'Use custom model' to enter any model name manually."
                }
              </p>
            </div>

            {/* Custom Base URL for Custom Provider */}
            {isCustomProvider && (
              <div className="space-y-2">
                <Label>Custom Base URL</Label>
                <Input
                  placeholder="https://api.example.com/v1"
                  value={customBaseUrl}
                  onChange={(e) => setCustomBaseUrl(e.target.value)}
                />
                <p className="text-sm text-gray-500">
                  Base URL for your custom OpenAI-compatible API
                </p>
              </div>
            )}

            {/* Temperature */}
            <div className="space-y-2">
              <Label>Temperature: {temperature[0]}</Label>
              <Slider
                value={temperature}
                onValueChange={setTemperature}
                max={2}
                min={0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Focused (0.0)</span>
                <span>Balanced (1.0)</span>
                <span>Creative (2.0)</span>
              </div>
            </div>

            {/* Test Connection */}
            <Button
              onClick={testConnection}
              disabled={testingConnection || (!currentApiKey && selectedProvider !== 'ollama')}
              variant="outline"
              className="w-full"
            >
              {getConnectionStatusIcon()}
              <span className="ml-2">Test Connection</span>
            </Button>
          </CardContent>
        </Card>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Github className="h-5 w-5" />
              <span className="font-medium">GitHub Integration</span>
            </div>
            <div className="mt-2">
              <Badge variant={githubToken ? "default" : "secondary"}>
                {githubToken ? "Configured" : "Token required"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <span className="font-medium">AI Provider</span>
            </div>
            <div className="mt-2">
              <Badge variant={(currentApiKey || selectedProvider === 'ollama') ? "default" : "secondary"}>
                {(currentApiKey || selectedProvider === 'ollama')
                  ? `${getProviderName(selectedProvider)} configured`
                  : "API key required"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TestTube className="h-5 w-5" />
              <span className="font-medium">Connection Status</span>
            </div>
            <div className="mt-2">
              <Badge variant={connectionStatus === 'success' ? "default" : "secondary"}>
                {getConnectionStatusText()}
              </Badge>
            </div>
          </CardContent>
        </Card>
          </div>

          {/* Setup Instructions */}
          <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>
            Follow these steps to configure the AI Code Assistant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium">Choose AI Provider</h4>
                <p className="text-sm text-gray-600">
                  Select your preferred AI provider (OpenAI, Anthropic, Azure, Ollama for local models, or custom) and model.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium">Configure API Keys / Local Setup</h4>
                <p className="text-sm text-gray-600">
                  Add your GitHub token and AI provider API key. For Ollama, install and run it locally first. Test the connection to verify setup.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium">Start Analyzing</h4>
                <p className="text-sm text-gray-600">
                  Explore repositories and analyze code with your chosen AI model.
                </p>
              </div>
            </div>

            {/* Ollama Setup Instructions */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">🦙 Ollama Local Setup</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>To use Ollama for local AI models:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Install Ollama from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="underline">ollama.ai</a></li>
                  <li>Run: <code className="bg-blue-100 px-1 rounded">ollama pull llama3.2:3b</code> (or any model)</li>
                  <li>Start Ollama: <code className="bg-blue-100 px-1 rounded">ollama serve</code></li>
                  <li>Select "Ollama (Local)" as provider and test connection</li>
                </ol>
                <p className="mt-2 text-xs">No API key needed - runs completely offline!</p>
              </div>
            </div>
          </div>
        </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

