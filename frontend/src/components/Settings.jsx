import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, TestTube } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import MobileHeader from './MobileHeader'
import APIConfiguration from './settings/APIConfiguration'
import LLMConfiguration from './settings/LLMConfiguration'
import ParameterSettings from './settings/ParameterSettings'
import StatusCards from './settings/StatusCards'
import SetupInstructions from './settings/SetupInstructions'
import { settingsService } from '@/services/settingsService'

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

