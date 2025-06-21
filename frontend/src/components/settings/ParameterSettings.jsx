import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings } from 'lucide-react'

export default function ParameterSettings({
  useDefaultParams,
  onUseDefaultParamsChange,
  showAdvancedParams,
  onShowAdvancedParamsChange,
  maxTokens,
  onMaxTokensChange,
  topP,
  onTopPChange,
  frequencyPenalty,
  onFrequencyPenaltyChange,
  presencePenalty,
  onPresencePenaltyChange
}) {
  return (
    <div className="space-y-6 border-t pt-6">
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">Parameter Settings</Label>
          <p className="text-sm text-gray-600 mt-1">Configure how AI parameters are sent to providers</p>
        </div>

        <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border">
          <input
            type="checkbox"
            id="useDefaultParams"
            checked={useDefaultParams}
            onChange={(e) => onUseDefaultParamsChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <div className="flex-1 min-w-0">
            <Label htmlFor="useDefaultParams" className="text-sm font-medium cursor-pointer">
              Use provider defaults (Recommended)
            </Label>
            <p className="text-xs text-gray-600 mt-1">
              Maximum compatibility with all AI models and providers. Only basic parameters will be sent.
            </p>
          </div>
        </div>
      </div>

      {!useDefaultParams && (
        <div className="space-y-4 mt-6">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-white p-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">Advanced Parameters</h4>
                  <p className="text-xs text-gray-600 mt-1">Fine-tune AI behavior with additional parameters</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onShowAdvancedParamsChange(!showAdvancedParams)}
                  className="text-sm flex items-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>{showAdvancedParams ? 'Hide Parameters' : 'Show Parameters'}</span>
                  <div className={`transform transition-transform ${showAdvancedParams ? 'rotate-180' : ''}`}>
                    ▼
                  </div>
                </Button>
              </div>
            </div>

            {showAdvancedParams && (
              <div className="bg-gray-50 p-4 space-y-4">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2 min-w-0">
                    <Label className="text-sm font-medium text-gray-700">Max Tokens</Label>
                    <Input
                      type="number"
                      placeholder="Auto"
                      value={maxTokens}
                      onChange={(e) => onMaxTokensChange(e.target.value)}
                      className="text-sm h-9 w-full"
                    />
                    <p className="text-xs text-gray-500">Maximum response length</p>
                  </div>

                  <div className="space-y-2 min-w-0">
                    <Label className="text-sm font-medium text-gray-700">Top P</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      placeholder="Auto"
                      value={topP}
                      onChange={(e) => onTopPChange(e.target.value)}
                      className="text-sm h-9 w-full"
                    />
                    <p className="text-xs text-gray-500">Nucleus sampling (0-1)</p>
                  </div>

                  <div className="space-y-2 min-w-0">
                    <Label className="text-sm font-medium text-gray-700">Frequency Penalty</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="-2"
                      max="2"
                      placeholder="0"
                      value={frequencyPenalty}
                      onChange={(e) => onFrequencyPenaltyChange(e.target.value)}
                      className="text-sm h-9 w-full"
                    />
                    <p className="text-xs text-gray-500">Reduce repetition (-2 to 2)</p>
                  </div>

                  <div className="space-y-2 min-w-0">
                    <Label className="text-sm font-medium text-gray-700">Presence Penalty</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="-2"
                      max="2"
                      placeholder="0"
                      value={presencePenalty}
                      onChange={(e) => onPresencePenaltyChange(e.target.value)}
                      className="text-sm h-9 w-full"
                    />
                    <p className="text-xs text-gray-500">Encourage new topics (-2 to 2)</p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 w-full overflow-hidden">
                  <div className="flex items-start space-x-2">
                    <div className="text-amber-600 mt-0.5 flex-shrink-0">⚠️</div>
                    <div className="text-xs text-amber-800 min-w-0 flex-1">
                      <strong>Compatibility Note:</strong>
                      <ul className="mt-2 space-y-1 list-disc list-inside">
                        <li>Some models/providers may not support all parameters</li>
                        <li>Leave fields empty to use model defaults</li>
                        <li>Enable "Use provider defaults" for maximum compatibility</li>
                        <li>Advanced parameters may cause errors with some models</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
