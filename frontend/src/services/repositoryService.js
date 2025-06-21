import { API_BASE_URL } from '@/lib/api'

export const repositoryService = {
  async fetchRepositories(githubToken) {
    const response = await fetch(`${API_BASE_URL}/api/github/repositories`, {
      headers: {
        'Authorization': `Bearer ${githubToken}`
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to fetch repositories")
    }
    
    return await response.json()
  },

  async fetchRepoContents(repoName, path, githubToken) {
    const response = await fetch(`${API_BASE_URL}/api/github/repository/${repoName}/contents?path=${path}`, {
      headers: {
        'Authorization': `Bearer ${githubToken}`
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to fetch repository contents")
    }
    
    return await response.json()
  }
}
