import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain } from 'lucide-react'

export default function LLMConfigDisplay({ 
  llmProvider, 
  llmModel, 
  customModel, 
  useCustomModel, 
  temperature 
}) {
  return (
    <Card className="w-full lg:w-64">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Brain className="h-4 w-4" />
          <span className="font-medium text-sm">Current AI Model</span>
        </div>
        <div className="space-y-1">
          <Badge variant="outline" className="text-xs">
            {useCustomModel && customModel ? customModel : llmModel}
          </Badge>
          <p className="text-xs text-gray-500">
            Provider: {llmProvider} | Temp: {temperature}
          </p>
          {llmProvider === 'ollama' && (
            <p className="text-xs text-green-600">
              ✓ Local model (no API key needed)
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
