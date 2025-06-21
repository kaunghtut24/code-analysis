import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SetupInstructions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Setup Instructions</CardTitle>
        <CardDescription>
          Follow these steps to configure the AI Code Assistant
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
              1
            </div>
            <div>
              <h4 className="font-medium">Choose AI Provider</h4>
              <p className="text-sm text-gray-600">
                Select your preferred AI provider (OpenAI, Anthropic, Azure, Ollama for local models, or custom) and model.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
              2
            </div>
            <div>
              <h4 className="font-medium">Configure API Keys / Local Setup</h4>
              <p className="text-sm text-gray-600">
                Add your GitHub token and AI provider API key. For Ollama, install and run it locally first. Test the connection to verify setup.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
              3
            </div>
            <div>
              <h4 className="font-medium">Start Analyzing</h4>
              <p className="text-sm text-gray-600">
                Explore repositories and analyze code with your chosen AI model.
              </p>
            </div>
          </div>

          {/* Ollama Setup Instructions */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">🦙 Ollama Local Setup</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>To use Ollama for local AI models:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Install Ollama from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="underline">ollama.ai</a></li>
                <li>Run: <code className="bg-blue-100 px-1 rounded">ollama pull llama3.2:3b</code> (or any model)</li>
                <li>Start Ollama: <code className="bg-blue-100 px-1 rounded">ollama serve</code></li>
                <li>Select "Ollama (Local)" as provider and test connection</li>
              </ol>
              <p className="mt-2 text-xs">No API key needed - runs completely offline!</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
