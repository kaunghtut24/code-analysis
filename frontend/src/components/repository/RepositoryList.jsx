import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { GitBranch, Search, Loader2 } from 'lucide-react'

export default function RepositoryList({
  repositories,
  selectedRepo,
  onSelectRepository,
  searchTerm,
  onSearchChange,
  loading
}) {
  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
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
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {loading ? (
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
                onClick={() => onSelectRepository(repo)}
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
  )
}
