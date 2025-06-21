import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Github, Brain, TestTube } from 'lucide-react'

export default function StatusCards({
  githubToken,
  currentApiKey,
  selectedProvider,
  connectionStatus,
  getProviderName,
  getConnectionStatusText
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Github className="h-5 w-5" />
            <span className="font-medium">GitHub Integration</span>
          </div>
          <div className="mt-2">
            <Badge variant={githubToken ? "default" : "secondary"}>
              {githubToken ? "Configured" : "Token required"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span className="font-medium">AI Provider</span>
          </div>
          <div className="mt-2">
            <Badge variant={(currentApiKey || selectedProvider === 'ollama') ? "default" : "secondary"}>
              {(currentApiKey || selectedProvider === 'ollama')
                ? `${getProviderName(selectedProvider)} configured`
                : "API key required"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <TestTube className="h-5 w-5" />
            <span className="font-medium">Connection Status</span>
          </div>
          <div className="mt-2">
            <Badge variant={connectionStatus === 'success' ? "default" : "secondary"}>
              {getConnectionStatusText()}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
