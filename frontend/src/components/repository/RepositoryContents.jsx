import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Folder, File, Loader2 } from 'lucide-react'
import { getLanguageBadge } from '@/utils/repositoryUtils'

const getFileIcon = (type) => {
  return type === 'dir' ? <Folder className="h-4 w-4" /> : <File className="h-4 w-4" />
}

export default function RepositoryContents({
  selectedRepo,
  repoContents,
  currentPath,
  onNavigateToPath,
  onAnalyzeFile,
  searchTerm,
  loading
}) {
  const filteredContents = repoContents.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!selectedRepo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Folder className="h-5 w-5" />
            <span>Repository Contents</span>
          </CardTitle>
          <CardDescription>
            Select a repository to view its contents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Select a repository to view its contents
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Folder className="h-5 w-5" />
          <span>
            {`${selectedRepo.full_name}${currentPath ? `/${currentPath}` : ''}`}
          </span>
        </CardTitle>
        <CardDescription>
          Browse files and folders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateToPath('')}
            disabled={!currentPath}
          >
            Root
          </Button>
          {currentPath && (
            <span className="text-sm text-gray-500">/ {currentPath}</span>
          )}
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {/* Back button for subdirectories */}
            {currentPath && (
              <div
                className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 border-gray-200"
                onClick={() => {
                  const parentPath = currentPath.split('/').slice(0, -1).join('/')
                  onNavigateToPath(parentPath)
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
                    onNavigateToPath(item.path)
                  } else {
                    onAnalyzeFile(item)
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
                        onAnalyzeFile(item)
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
        )}
      </CardContent>
    </Card>
  )
}
