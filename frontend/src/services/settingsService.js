import { API_BASE_URL } from '@/lib/api'

export const settingsService = {
  async fetchProviders() {
    const response = await fetch(`${API_BASE_URL}/api/llm/providers`)
    if (!response.ok) {
      throw new Error('Failed to load AI providers')
    }
    return await response.json()
  },

  async fetchModels(provider) {
    const response = await fetch(`${API_BASE_URL}/api/llm/models?provider=${provider}`)
    if (!response.ok) {
      throw new Error(`Failed to load models for ${provider}`)
    }
    return await response.json()
  },

  async testConnection(testData) {
    const response = await fetch(`${API_BASE_URL}/api/llm/test-connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    })

    return await response.json()
  },

  saveSettings(settings) {
    const {
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
    } = settings

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
    localStorage.setItem('maxTokens', maxTokens)
    localStorage.setItem('topP', topP)
    localStorage.setItem('frequencyPenalty', frequencyPenalty)
    localStorage.setItem('presencePenalty', presencePenalty)
    localStorage.setItem('useDefaultParams', useDefaultParams.toString())
    localStorage.setItem('showAdvancedParams', showAdvancedParams.toString())
  },

  clearSettings() {
    const keys = [
      'githubToken', 'openaiKey', 'anthropicKey', 'azureKey', 'ollamaKey', 'customKey',
      'llmProvider', 'llmModel', 'customModel', 'useCustomModel', 'customBaseUrl',
      'temperature', 'maxTokens', 'topP', 'frequencyPenalty', 'presencePenalty',
      'useDefaultParams', 'showAdvancedParams'
    ]
    
    keys.forEach(key => localStorage.removeItem(key))
  },

  loadSettings() {
    return {
      githubToken: localStorage.getItem('githubToken') || '',
      apiKeys: {
        openai: localStorage.getItem('openaiKey') || '',
        anthropic: localStorage.getItem('anthropicKey') || '',
        azure: localStorage.getItem('azureKey') || '',
        ollama: localStorage.getItem('ollamaKey') || '',
        custom: localStorage.getItem('customKey') || ''
      },
      selectedProvider: localStorage.getItem('llmProvider') || 'openai',
      selectedModel: localStorage.getItem('llmModel') || 'gpt-4o-mini',
      customModel: localStorage.getItem('customModel') || '',
      useCustomModel: localStorage.getItem('useCustomModel') === 'true',
      customBaseUrl: localStorage.getItem('customBaseUrl') || '',
      temperature: [parseFloat(localStorage.getItem('temperature')) || 0.7],
      maxTokens: localStorage.getItem('maxTokens') || '',
      topP: localStorage.getItem('topP') || '',
      frequencyPenalty: localStorage.getItem('frequencyPenalty') || '',
      presencePenalty: localStorage.getItem('presencePenalty') || '',
      useDefaultParams: localStorage.getItem('useDefaultParams') !== 'false',
      showAdvancedParams: localStorage.getItem('showAdvancedParams') === 'true'
    }
  },

  getProviderName(provider) {
    const providerNames = {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      azure: 'Azure OpenAI',
      ollama: 'Ollama (Local)',
      custom: 'Custom Provider'
    }
    return providerNames[provider] || provider
  },

  getApiKeyPlaceholder(provider) {
    const placeholders = {
      openai: 'sk-xxxxxxxxxxxxxxxxxxxx',
      anthropic: 'sk-ant-xxxxxxxxxxxxxxxxxxxx',
      azure: 'your-azure-api-key',
      ollama: 'No API key needed for local Ollama',
      custom: 'your-custom-api-key'
    }
    return placeholders[provider] || 'your-api-key'
  }
}
