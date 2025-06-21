import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Save, Trash2, ExternalLink, Github, Brain, Key } from 'lucide-react'

export default function APIConfiguration({
  githubToken,
  setGithubToken,
  showGithubToken,
  setShowGithubToken,
  currentApiKey,
  onApiKeyChange,
  showApiKey,
  setShowApiKey,
  selectedProvider,
  onSave,
  onClear,
  getProviderName,
  getApiKeyPlaceholder
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Key className="h-5 w-5" />
          <span>API Configuration</span>
        </CardTitle>
        <CardDescription>
          Configure your GitHub and AI provider API keys
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* GitHub Token */}
        <div className="space-y-2">
          <Label htmlFor="github-token" className="flex items-center space-x-2">
            <Github className="h-4 w-4" />
            <span>GitHub Personal Access Token</span>
          </Label>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Input
                id="github-token"
                type={showGithubToken ? "text" : "password"}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowGithubToken(!showGithubToken)}
              >
                {showGithubToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Required for accessing GitHub repositories.{' '}
            <a 
              href="https://github.com/settings/tokens" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline inline-flex items-center"
            >
              Generate a token here
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </p>
        </div>

        {/* AI Provider API Key */}
        <div className="space-y-2">
          <Label htmlFor="api-key" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>{getProviderName(selectedProvider)} API Key</span>
          </Label>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Input
                id="api-key"
                type={showApiKey ? "text" : "password"}
                placeholder={getApiKeyPlaceholder(selectedProvider)}
                value={currentApiKey}
                onChange={onApiKeyChange}
                className="pr-10"
                disabled={selectedProvider === 'ollama'}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            {selectedProvider === 'ollama'
              ? 'Ollama runs locally and does not require an API key. Make sure Ollama is running on http://localhost:11434'
              : `API key for ${getProviderName(selectedProvider)} - required for AI analysis`
            }
          </p>
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button onClick={onSave} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
          <Button onClick={onClear} variant="outline" className="flex-1">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
