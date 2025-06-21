import { useState, useEffect } from 'react'

export const useLLMConfig = () => {
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

  useEffect(() => {
    loadLlmSettings()
  }, [])

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
    const config = {
      provider: llmProvider,
      model: useCustomModel && customModel ? customModel : llmModel,
      api_key: getCurrentApiKey(),
      base_url: llmProvider === 'custom' && customBaseUrl ? customBaseUrl : undefined,
      temperature: temperature
    }

    // Check if user wants to use default parameters (for compatibility)
    const useDefaultParams = localStorage.getItem('useDefaultParams') !== 'false' // Default to true

    if (!useDefaultParams) {
      // Add advanced parameters if they are set and user opted out of defaults
      const maxTokens = localStorage.getItem('maxTokens')
      const topP = localStorage.getItem('topP')
      const frequencyPenalty = localStorage.getItem('frequencyPenalty')
      const presencePenalty = localStorage.getItem('presencePenalty')

      if (maxTokens && !isNaN(parseInt(maxTokens))) {
        config.max_tokens = parseInt(maxTokens)
      }
      if (topP && !isNaN(parseFloat(topP))) {
        config.top_p = parseFloat(topP)
      }
      if (frequencyPenalty && !isNaN(parseFloat(frequencyPenalty))) {
        config.frequency_penalty = parseFloat(frequencyPenalty)
      }
      if (presencePenalty && !isNaN(parseFloat(presencePenalty))) {
        config.presence_penalty = parseFloat(presencePenalty)
      }
    }

    return config
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

  return {
    llmProvider,
    setLlmProvider,
    llmModel,
    setLlmModel,
    customModel,
    setCustomModel,
    useCustomModel,
    setUseCustomModel,
    customBaseUrl,
    setCustomBaseUrl,
    temperature,
    setTemperature,
    apiKeys,
    setApiKeys,
    getCurrentApiKey,
    getLlmConfig,
    isApiKeyRequired,
    hasValidConfig,
    loadLlmSettings
  }
}
