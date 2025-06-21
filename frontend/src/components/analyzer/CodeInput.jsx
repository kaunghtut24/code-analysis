import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Code, Loader2, Settings } from 'lucide-react'
import { detectLanguage, getLanguageDisplayName } from '@/utils/languageDetection'
import { useState, useEffect } from 'react'

export default function CodeInput({
  code,
  onCodeChange,
  analysisType,
  onAnalysisTypeChange,
  onAnalyze,
  loading,
  hasValidConfig,
  isApiKeyRequired
}) {
  const [detectedLanguage, setDetectedLanguage] = useState(null)

  // Detect language when code changes
  useEffect(() => {
    if (code.trim().length > 50) { // Only detect for substantial code
      const detection = detectLanguage(code)
      if (detection.confidence > 0.3) { // Only show if reasonably confident
        setDetectedLanguage(detection)
      } else {
        setDetectedLanguage(null)
      }
    } else {
      setDetectedLanguage(null)
    }
  }, [code])

  const analysisTypes = [
    { value: 'general', label: 'General Analysis', description: 'Comprehensive code review covering all aspects' },
    { value: 'debug', label: 'Debug & Fix Issues', description: 'Identify and solve bugs, errors, and issues' },
    { value: 'improve', label: 'Improve Code Quality', description: 'Modernize and optimize code for better performance' },
    { value: 'correct', label: 'Correct Errors', description: 'Fix syntax, logic, and implementation errors' },
    { value: 'security', label: 'Security Analysis', description: 'Identify vulnerabilities and security issues' },
    { value: 'performance', label: 'Performance Optimization', description: 'Analyze and optimize for better performance' }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Code className="h-5 w-5" />
          <span>Code Input</span>
        </CardTitle>
        <CardDescription>
          Paste your code here or load from a repository file
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <Select value={analysisType} onValueChange={onAnalysisTypeChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Select analysis type" />
            </SelectTrigger>
            <SelectContent>
              {analysisTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            onClick={onAnalyze} 
            disabled={loading || !code.trim() || !hasValidConfig} 
            className="w-full sm:w-auto"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Code className="h-4 w-4 mr-2" />
            )}
            Analyze Code
          </Button>
        </div>
        
        {!hasValidConfig && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <Settings className="h-4 w-4 inline mr-1" />
              {isApiKeyRequired
                ? "Please configure your AI provider API key in Settings to enable code analysis."
                : "Please configure your AI provider in Settings to enable code analysis."
              }
            </p>
          </div>
        )}
        
        <div className="space-y-2">
          {detectedLanguage && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  {getLanguageDisplayName(detectedLanguage.language)}
                </Badge>
                <span className="text-gray-500">
                  {Math.round(detectedLanguage.confidence * 100)}% confidence
                </span>
              </div>
              {detectedLanguage.alternatives && detectedLanguage.alternatives.length > 0 && (
                <div className="text-xs text-gray-400">
                  Also detected: {detectedLanguage.alternatives.map(alt =>
                    getLanguageDisplayName(alt.language)
                  ).join(', ')}
                </div>
              )}
            </div>
          )}

          <Textarea
            placeholder="Paste your code here..."
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            className="min-h-64 sm:min-h-96 font-mono text-sm"
          />
        </div>
      </CardContent>
    </Card>
  )
}
