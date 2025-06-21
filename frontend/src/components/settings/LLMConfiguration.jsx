import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Brain, Loader2, TestTube } from 'lucide-react'

export default function LLMConfiguration({
  providers,
  selectedProvider,
  onProviderChange,
  availableModels,
  selectedModel,
  onModelChange,
  customModel,
  onCustomModelChange,
  useCustomModel,
  onUseCustomModelChange,
  customBaseUrl,
  onCustomBaseUrlChange,
  temperature,
  onTemperatureChange,
  loadingProviders,
  loadingModels,
  onTestConnection,
  testingConnection,
  connectionStatus,
  getConnectionStatusIcon,
  currentApiKey
}) {
  const isCustomProvider = selectedProvider === 'custom'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5" />
          <span>AI Model Configuration</span>
        </CardTitle>
        <CardDescription>
          Choose your AI provider and model for code analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 overflow-hidden">
        {/* AI Provider */}
        <div className="space-y-2">
          <Label>AI Provider</Label>
          <Select value={selectedProvider} onValueChange={onProviderChange} disabled={loadingProviders}>
            <SelectTrigger>
              <SelectValue placeholder={loadingProviders ? "Loading providers..." : "Select AI provider"} />
              {loadingProviders && <Loader2 className="h-4 w-4 animate-spin" />}
            </SelectTrigger>
            <SelectContent>
              {Object.entries(providers).map(([key, provider]) => (
                <SelectItem key={key} value={key}>
                  {provider.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Model</Label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="use-custom-model"
                checked={useCustomModel}
                onChange={(e) => onUseCustomModelChange(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="use-custom-model" className="text-sm text-gray-600">
                Use custom model
              </Label>
            </div>
          </div>

          {useCustomModel ? (
            <Input
              placeholder="Enter model name (e.g., gpt-4o-mini, claude-3-5-sonnet-20241022)"
              value={customModel}
              onChange={(e) => onCustomModelChange(e.target.value)}
            />
          ) : (
            <Select value={selectedModel} onValueChange={onModelChange} disabled={loadingModels}>
              <SelectTrigger>
                <SelectValue placeholder={loadingModels ? "Loading models..." : "Select model"} />
                {loadingModels && <Loader2 className="h-4 w-4 animate-spin" />}
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <p className="text-xs text-gray-500">
            {useCustomModel
              ? "Enter any model name supported by your provider. Model names change frequently, so this allows you to use the latest models."
              : "Select from popular models or check 'Use custom model' to enter any model name manually."
            }
          </p>
        </div>

        {/* Custom Base URL for Custom Provider */}
        {isCustomProvider && (
          <div className="space-y-2">
            <Label>Custom Base URL</Label>
            <Input
              placeholder="https://api.example.com/v1"
              value={customBaseUrl}
              onChange={(e) => onCustomBaseUrlChange(e.target.value)}
            />
            <p className="text-sm text-gray-500">
              Base URL for your custom OpenAI-compatible API
            </p>
          </div>
        )}

        {/* Temperature */}
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium text-gray-700">Temperature: {temperature[0]}</Label>
            <p className="text-xs text-gray-600 mt-1">Controls randomness in AI responses</p>
          </div>
          <Slider
            value={temperature}
            onValueChange={onTemperatureChange}
            max={2}
            min={0}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Focused (0.0)</span>
            <span>Balanced (1.0)</span>
            <span>Creative (2.0)</span>
          </div>
        </div>

        {/* Test Connection */}
        <Button
          onClick={onTestConnection}
          disabled={testingConnection || (!currentApiKey && selectedProvider !== 'ollama')}
          variant="outline"
          className="w-full"
        >
          {getConnectionStatusIcon()}
          <span className="ml-2">Test Connection</span>
        </Button>
      </CardContent>
    </Card>
  )
}
