import { API_BASE_URL } from '@/lib/api'

export const codeAnalysisService = {
  async analyzeCode(requestData) {
    const response = await fetch(`${API_BASE_URL}/api/llm/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(JSON.stringify(error))
    }
    
    return await response.json()
  },

  async sendChatMessage(requestData) {
    const response = await fetch(`${API_BASE_URL}/api/llm/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(JSON.stringify(error))
    }
    
    return await response.json()
  },

  async fetchFileContent(repoName, filePath, githubToken) {
    const response = await fetch(`${API_BASE_URL}/api/github/repository/${repoName}/file?path=${filePath}`, {
      headers: {
        'Authorization': `Bearer ${githubToken}`
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(JSON.stringify(error))
    }
    
    return await response.json()
  },

  getErrorDetails(errorString) {
    try {
      const error = JSON.parse(errorString)
      
      // Handle specific error types with appropriate messages
      let errorTitle = "Analysis Error"
      let errorDescription = error.error || "Failed to analyze code"

      switch (error.type) {
        case 'rate_limit':
          errorTitle = "Rate Limit Exceeded"
          errorDescription = "Too many requests. Please wait a moment and try again."
          break
        case 'auth_error':
          errorTitle = "Authentication Error"
          errorDescription = "Invalid API key. Please check your API key in Settings."
          break
        case 'quota_error':
          errorTitle = "Quota Exceeded"
          errorDescription = "API quota exceeded. Please check your account billing."
          break
        case 'network_error':
          errorTitle = "Network Error"
          errorDescription = "Connection failed. Please check your internet connection."
          break
        case 'timeout_error':
          errorTitle = "Request Timeout"
          errorDescription = "Analysis took too long. Try with shorter code."
          break
        default:
          errorTitle = "Analysis Error"
          break
      }

      return { errorTitle, errorDescription }
    } catch {
      return {
        errorTitle: "Error",
        errorDescription: "Failed to connect to server"
      }
    }
  }
}
