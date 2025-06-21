import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { GitBranch } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import MobileHeader from './MobileHeader'
import RepositoryList from './repository/RepositoryList'
import RepositoryContents from './repository/RepositoryContents'
import { repositoryService } from '@/services/repositoryService'

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
      const data = await repositoryService.fetchRepositories(githubToken)
      setRepositories(data.repositories)
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRepoContents = async (repoName, path = '') => {
    setLoading(true)
    try {
      const data = await repositoryService.fetchRepoContents(repoName, path, githubToken)
      setRepoContents(data.contents)
      setCurrentPath(path)
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const selectRepository = (repo) => {
    setSelectedRepo(repo)
    setCurrentPath('')
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
            <RepositoryList
              repositories={repositories}
              selectedRepo={selectedRepo}
              onSelectRepository={selectRepository}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              loading={loading && !selectedRepo}
            />

            <RepositoryContents
              selectedRepo={selectedRepo}
              repoContents={repoContents}
              currentPath={currentPath}
              onNavigateToPath={navigateToPath}
              onAnalyzeFile={analyzeFile}
              searchTerm={searchTerm}
              loading={loading && selectedRepo}
            />
          </div>
        </div>
      </div>
    </div>
  )
}