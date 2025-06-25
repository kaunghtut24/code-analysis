import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, TestTube, Trash2, Database, Clock, AlertTriangle, Terminal, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import MobileHeader from './MobileHeader'
import APIConfiguration from './settings/APIConfiguration'
import LLMConfiguration from './settings/LLMConfiguration'
import ParameterSettings from './settings/ParameterSettings'
import StatusCards from './settings/StatusCards'
import SetupInstructions from './settings/SetupInstructions'
import { settingsService } from '@/services/settingsService'
import { CodeCanvasService } from '@/services/codeCanvasService'

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
  const [maxTokens, setMaxTokens] = useState('')
  const [topP, setTopP] = useState('')
  const [frequencyPenalty, setFrequencyPenalty] = useState('')
  const [presencePenalty, setPresencePenalty] = useState('')
  const [useDefaultParams, setUseDefaultParams] = useState(true)
  const [showAdvancedParams, setShowAdvancedParams] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('not_tested')
  const [testingConnection, setTestingConnection] = useState(false)
  const [loadingProviders, setLoadingProviders] = useState(true)
  const [loadingModels, setLoadingModels] = useState(false)

  // Cache management state
  const [cacheStats, setCacheStats] = useState({ size: 0, hitRate: 0, hits: 0, misses: 0 })
  const [clearingCache, setClearingCache] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    loadSettings()
    fetchProviders()
    loadCacheStats()
  }, [])

  // Load cache statistics
  const loadCacheStats = () => {
    try {
      const stats = CodeCanvasService.getCacheStats()
      setCacheStats(stats)
    } catch (error) {
      console.error('Failed to load cache stats:', error)
    }
  }

  // Clear analysis cache
  const handleClearCache = async () => {
    setClearingCache(true)
    try {
      CodeCanvasService.clearCache()
      loadCacheStats() // Refresh stats
      toast({
        title: "Cache Cleared",
        description: "Analysis cache has been cleared successfully. This will save storage space but may increase API usage for future analyses.",
      })
    } catch (error) {
      console.error('Failed to clear cache:', error)
      toast({
        title: "Error",
        description: "Failed to clear cache. Please try again.",
        variant: "destructive",
      })
    } finally {
      setClearingCache(false)
    }
  }

  useEffect(() => {
    if (selectedProvider && providers[selectedProvider]) {
      fetchModels(selectedProvider)
    }
  }, [selectedProvider, providers])

  const loadSettings = () => {
    const settings = settingsService.loadSettings()
    setGithubToken(settings.githubToken)
    setApiKeys(settings.apiKeys)
    setSelectedProvider(settings.selectedProvider)
    setSelectedModel(settings.selectedModel)
    setCustomModel(settings.customModel)
    setUseCustomModel(settings.useCustomModel)
    setCustomBaseUrl(settings.customBaseUrl)
    setTemperature(settings.temperature)
    setMaxTokens(settings.maxTokens)
    setTopP(settings.topP)
    setFrequencyPenalty(settings.frequencyPenalty)
    setPresencePenalty(settings.presencePenalty)
    setUseDefaultParams(settings.useDefaultParams)
    setShowAdvancedParams(settings.showAdvancedParams)
  }

  const fetchProviders = async () => {
    setLoadingProviders(true)
    try {
      const data = await settingsService.fetchProviders()
      setProviders(data.providers)
    } catch (error) {
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
      const data = await settingsService.fetchModels(provider)
      setAvailableModels(data.models)
      if (!data.models.includes(selectedModel)) {
        setSelectedModel(data.default_model)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to load models for ${provider}. Please try again.`,
        variant: "destructive"
      })
    } finally {
      setLoadingModels(false)
    }
  }

  const saveSettings = () => {
    settingsService.saveSettings({
      githubToken,
      apiKeys,
      selectedProvider,
      selectedModel,
      customModel,
      useCustomModel,
      customBaseUrl,
      temperature,
      maxTokens,
      topP,
      frequencyPenalty,
      presencePenalty,
      useDefaultParams,
      showAdvancedParams
    })

    toast({
      title: "Settings Saved",
      description: "Your configuration has been saved successfully."
    })

    // Reset connection status when settings change
    setConnectionStatus('not_tested')
  }

  const clearSettings = () => {
    settingsService.clearSettings()

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
    setMaxTokens('')
    setTopP('')
    setFrequencyPenalty('')
    setPresencePenalty('')
    setUseDefaultParams(true)
    setShowAdvancedParams(false)
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

      const data = await settingsService.testConnection(testData)

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

  const currentApiKey = apiKeys[selectedProvider] || ''

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
            <APIConfiguration
              githubToken={githubToken}
              setGithubToken={setGithubToken}
              showGithubToken={showGithubToken}
              setShowGithubToken={setShowGithubToken}
              currentApiKey={currentApiKey}
              onApiKeyChange={(e) => setApiKeys(prev => ({
                ...prev,
                [selectedProvider]: e.target.value
              }))}
              showApiKey={showApiKey}
              setShowApiKey={setShowApiKey}
              selectedProvider={selectedProvider}
              onSave={saveSettings}
              onClear={clearSettings}
              getProviderName={settingsService.getProviderName}
              getApiKeyPlaceholder={settingsService.getApiKeyPlaceholder}
            />

            <div className="space-y-6">
              <LLMConfiguration
                providers={providers}
                selectedProvider={selectedProvider}
                onProviderChange={setSelectedProvider}
                availableModels={availableModels}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                customModel={customModel}
                onCustomModelChange={setCustomModel}
                useCustomModel={useCustomModel}
                onUseCustomModelChange={setUseCustomModel}
                customBaseUrl={customBaseUrl}
                onCustomBaseUrlChange={setCustomBaseUrl}
                temperature={temperature}
                onTemperatureChange={setTemperature}
                loadingProviders={loadingProviders}
                loadingModels={loadingModels}
                onTestConnection={testConnection}
                testingConnection={testingConnection}
                connectionStatus={connectionStatus}
                getConnectionStatusIcon={getConnectionStatusIcon}
                currentApiKey={currentApiKey}
              />

              <ParameterSettings
                useDefaultParams={useDefaultParams}
                onUseDefaultParamsChange={setUseDefaultParams}
                showAdvancedParams={showAdvancedParams}
                onShowAdvancedParamsChange={setShowAdvancedParams}
                maxTokens={maxTokens}
                onMaxTokensChange={setMaxTokens}
                topP={topP}
                onTopPChange={setTopP}
                frequencyPenalty={frequencyPenalty}
                onFrequencyPenaltyChange={setFrequencyPenalty}
                presencePenalty={presencePenalty}
                onPresencePenaltyChange={setPresencePenalty}
              />
            </div>

            {/* Cache Management Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="w-5 h-5" />
                    <span>Cache Management</span>
                  </CardTitle>
                  <CardDescription>
                    Manage analysis cache to optimize token usage and performance. Cached results save API calls for repeated analyses.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cache Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-blue-700">{cacheStats.size}</div>
                      <div className="text-xs text-blue-600">Cached Items</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-green-700">{cacheStats.hitRate}%</div>
                      <div className="text-xs text-green-600">Hit Rate</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-purple-700">{cacheStats.hits}</div>
                      <div className="text-xs text-purple-600">Cache Hits</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-orange-700">{cacheStats.misses}</div>
                      <div className="text-xs text-orange-600">Cache Misses</div>
                    </div>
                  </div>

                  {/* Cache Benefits */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Cache Benefits</span>
                    </div>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• Reduces API token consumption for repeated analyses</li>
                      <li>• Faster response times for previously analyzed code</li>
                      <li>• Saves costs when using paid AI services</li>
                      <li>• Cache expires automatically after 30 minutes</li>
                    </ul>
                  </div>

                  {/* Cache Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Cache Storage</p>
                      <p className="text-xs text-gray-500">
                        {cacheStats.size > 0
                          ? `${cacheStats.size} analysis results cached`
                          : 'No cached results'
                        }
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadCacheStats}
                        className="text-xs"
                      >
                        Refresh Stats
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearCache}
                        disabled={clearingCache || cacheStats.size === 0}
                        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        {clearingCache ? 'Clearing...' : 'Clear Cache'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ollama Troubleshooting Section */}
            {selectedProvider === 'ollama' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Terminal className="w-5 h-5" />
                      <span>Ollama Setup & Troubleshooting</span>
                    </CardTitle>
                    <CardDescription>
                      Quick guide to set up and troubleshoot Ollama for local AI processing.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Setup Steps */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                        <Download className="w-4 h-4 mr-2" />
                        Quick Setup Guide
                      </h4>
                      <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                        <li>Download Ollama from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">https://ollama.ai</a></li>
                        <li>Install and start Ollama: <code className="bg-blue-100 px-2 py-1 rounded">ollama serve</code></li>
                        <li>Download a model: <code className="bg-blue-100 px-2 py-1 rounded">ollama pull qwen2.5:latest</code></li>
                        <li>Select "Ollama (Local)" as your provider in settings above</li>
                        <li>Test the connection using the "Test Connection" button</li>
                      </ol>
                    </div>

                    {/* Common Issues */}
                    <div className="bg-amber-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-amber-900 mb-3 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Common Issues & Solutions
                      </h4>
                      <div className="space-y-3 text-sm text-amber-800">
                        <div>
                          <strong>Model not found error:</strong>
                          <p>Run <code className="bg-amber-100 px-2 py-1 rounded">ollama pull {selectedModel || 'your-model'}</code> to download the model.</p>
                        </div>
                        <div>
                          <strong>Connection failed:</strong>
                          <p>Ensure Ollama is running with <code className="bg-amber-100 px-2 py-1 rounded">ollama serve</code></p>
                        </div>
                        <div>
                          <strong>Port issues:</strong>
                          <p>Ollama runs on port 11434 by default. Check if the port is available.</p>
                        </div>
                      </div>
                    </div>

                    {/* Status Check */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Current Status</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Provider:</span> {selectedProvider}
                        </div>
                        <div>
                          <span className="font-medium">Model:</span> {selectedModel || 'Not selected'}
                        </div>
                        <div>
                          <span className="font-medium">Connection:</span>
                          <Badge
                            variant={connectionStatus === 'connected' ? 'default' : 'destructive'}
                            className="ml-2"
                          >
                            {getConnectionStatusText(connectionStatus)}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium">Base URL:</span> {customBaseUrl || 'http://localhost:11434'}
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('https://ollama.ai', '_blank')}
                        className="text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download Ollama
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText('ollama serve')}
                        className="text-xs"
                      >
                        <Terminal className="w-3 h-3 mr-1" />
                        Copy Start Command
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(`ollama pull ${selectedModel || 'qwen2.5:latest'}`)}
                        className="text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Copy Model Command
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

          </div>

          <StatusCards
            githubToken={githubToken}
            currentApiKey={currentApiKey}
            selectedProvider={selectedProvider}
            connectionStatus={connectionStatus}
            getProviderName={settingsService.getProviderName}
            getConnectionStatusText={getConnectionStatusText}
          />

          <SetupInstructions />
        </div>
      </div>
    </div>
  )
}

