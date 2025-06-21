import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Folder, File, GitBranch, Search, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { API_BASE_URL } from '@/lib/api'
import MobileHeader from './MobileHeader'

export default function RepositoryExplorer({ githubToken, setSidebarOpen }) {
  const [repositories, setRepositories] = useState([])
  const [selectedRepo, setSelectedRepo] = useState(null)
  const [repoContents, setRepoContents] = useState([])
  const [currentPath, setCurrentPath] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    if (githubToken) {
      fetchRepositories()
    }
  }, [githubToken])

  const fetchRepositories = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/github/repositories`, {
        headers: {
          'Authorization': `Bearer ${githubToken}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setRepositories(data.repositories)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to fetch repositories",
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

  const fetchRepoContents = async (repoName, path = '') => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/github/repository/${repoName}/contents?path=${path}`, {
        headers: {
          'Authorization': `Bearer ${githubToken}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setRepoContents(data.contents)
        setCurrentPath(path)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to fetch repository contents",
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

  const selectRepository = (repo) => {
    setSelectedRepo(repo)
    fetchRepoContents(repo.full_name)
  }

  const navigateToPath = (path) => {
    if (selectedRepo) {
      fetchRepoContents(selectedRepo.full_name, path)
    }
  }

  const analyzeFile = (file) => {
    if (selectedRepo) {
      const url = `/analyzer?repo=${selectedRepo.full_name}&file=${file.path}`
      window.location.href = url
    }
  }

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredContents = repoContents.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getFileIcon = (type) => {
    return type === 'dir' ? <Folder className="h-4 w-4" /> : <File className="h-4 w-4" />
  }

  const getLanguageBadge = (filename) => {
    const ext = filename.split('.').pop()?.toLowerCase()
    const languages = {
      'js': 'JavaScript',
      'jsx': 'React',
      'ts': 'TypeScript',
      'tsx': 'TypeScript',
      'py': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'cs': 'C#',
      'php': 'PHP',
      'rb': 'Ruby',
      'go': 'Go',
      'rs': 'Rust',
      'swift': 'Swift',
      'kt': 'Kotlin',
      'dart': 'Dart',
      'html': 'HTML',
      'css': 'CSS',
      'scss': 'SCSS',
      'sass': 'Sass',
      'less': 'Less',
      'json': 'JSON',
      'xml': 'XML',
      'yaml': 'YAML',
      'yml': 'YAML',
      'md': 'Markdown',
      'sql': 'SQL',
      'sh': 'Shell',
      'bash': 'Bash',
      'zsh': 'Zsh',
      'fish': 'Fish'
    }
    
    return languages[ext] || ext?.toUpperCase()
  }

  if (!githubToken) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">GitHub Token Required</h2>
          <p className="text-gray-600 mb-4">
            Please configure your GitHub Personal Access Token in Settings to explore repositories.
          </p>
          <Button onClick={() => window.location.href = '/settings'}>
            Go to Settings
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <MobileHeader setSidebarOpen={setSidebarOpen} title="Repository Explorer" />

      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Repository Explorer</h1>
            <p className="text-gray-600 text-sm sm:text-base">Browse and explore your GitHub repositories</p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Repository List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GitBranch className="h-5 w-5" />
              <span>Your Repositories</span>
            </CardTitle>
            <CardDescription>
              Select a repository to explore its contents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search repositories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {loading && !selectedRepo ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredRepositories.map((repo) => (
                  <div
                    key={repo.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedRepo?.id === repo.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => selectRepository(repo)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{repo.name}</h3>
                        {repo.description && (
                          <p className="text-sm text-gray-600 mt-1">{repo.description}</p>
                        )}
                        <div className="flex items-center space-x-2 mt-2">
                          {repo.language && (
                            <Badge variant="secondary" className="text-xs">
                              {repo.language}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {repo.private ? 'Private' : 'Public'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredRepositories.length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No repositories match your search' : 'No repositories found'}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Repository Contents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Folder className="h-5 w-5" />
              <span>
                {selectedRepo ? `${selectedRepo.full_name}${currentPath ? `/${currentPath}` : ''}` : 'Repository Contents'}
              </span>
            </CardTitle>
            <CardDescription>
              {selectedRepo ? 'Browse files and folders' : 'Select a repository to view its contents'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedRepo && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateToPath('')}
                  disabled={!currentPath}
                >
                  Root
                </Button>
                {currentPath && (
                  <span className="text-sm text-gray-500">/ {currentPath}</span>
                )}
              </div>
            )}
            
            {loading && selectedRepo ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : selectedRepo ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {/* Back button for subdirectories */}
                {currentPath && (
                  <div
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 border-gray-200"
                    onClick={() => {
                      const parentPath = currentPath.split('/').slice(0, -1).join('/')
                      navigateToPath(parentPath)
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <Folder className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">..</span>
                    </div>
                  </div>
                )}
                
                {filteredContents.map((item) => (
                  <div
                    key={item.path}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 border-gray-200"
                    onClick={() => {
                      if (item.type === 'dir') {
                        navigateToPath(item.path)
                      } else {
                        analyzeFile(item)
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1">
                        {getFileIcon(item.type)}
                        <span className="text-gray-900">{item.name}</span>
                        {item.type === 'file' && getLanguageBadge(item.name) && (
                          <Badge variant="outline" className="text-xs">
                            {getLanguageBadge(item.name)}
                          </Badge>
                        )}
                      </div>
                      {item.type === 'file' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            analyzeFile(item)
                          }}
                        >
                          Analyze
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {filteredContents.length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No files match your search' : 'This directory is empty'}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Select a repository to view its contents
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

