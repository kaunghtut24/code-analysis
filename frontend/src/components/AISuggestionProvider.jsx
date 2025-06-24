import { useState, useEffect, useCallback } from "react";
import { CodeCanvasService } from "@/services/codeCanvasService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  AlertTriangle,
  Info,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";

export default function AISuggestionProvider({
  code,
  language,
  onApplySuggestion,
  onShowDiff,
  isVisible = true,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSuggestions, setExpandedSuggestions] = useState(new Set());
  const [lastAnalyzedCode, setLastAnalyzedCode] = useState("");

  // Analyze code and get suggestions
  const analyzecode = useCallback(
    async (codeToAnalyze) => {
      if (!codeToAnalyze || codeToAnalyze === lastAnalyzedCode) return;

      setIsLoading(true);
      try {
        const analysis = await CodeCanvasService.analyzeCode(
          codeToAnalyze,
          language,
        );
        setSuggestions(analysis.suggestions || []);
        setLastAnalyzedCode(codeToAnalyze);
      } catch (error) {
        console.error("Failed to analyze code:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [language, lastAnalyzedCode],
  );

  // Auto-analyze when code changes
  useEffect(() => {
    if (code && code.trim().length > 10) {
      const timeoutId = setTimeout(() => analyzecode(code), 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [code, analyzecode]);

  // Toggle suggestion expansion
  const toggleSuggestion = (index) => {
    const newExpanded = new Set(expandedSuggestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSuggestions(newExpanded);
  };

  // Apply a suggestion
  const applySuggestion = async (suggestion, index) => {
    try {
      setIsLoading(true);

      // Get the improved code for this suggestion
      const improvement = await CodeCanvasService.getCodeImprovements(
        code,
        {
          text: suggestion.code_snippet || code,
          line: suggestion.line,
          type: suggestion.type,
        },
        language,
      );

      if (improvement.improved_code) {
        if (onApplySuggestion) {
          onApplySuggestion(improvement.improved_code, suggestion);
        }

        // Remove applied suggestion
        setSuggestions((prev) => prev.filter((_, i) => i !== index));
      }
    } catch (error) {
      console.error("Failed to apply suggestion:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show diff for a suggestion
  const showSuggestionDiff = async (suggestion) => {
    try {
      const improvement = await CodeCanvasService.getCodeImprovements(
        code,
        {
          text: suggestion.code_snippet || code,
          line: suggestion.line,
          type: suggestion.type,
        },
        language,
      );

      if (improvement.improved_code && onShowDiff) {
        onShowDiff(code, improvement.improved_code, suggestion);
      }
    } catch (error) {
      console.error("Failed to generate diff:", error);
    }
  };

  // Get icon for suggestion type
  const getSuggestionIcon = (type, severity) => {
    switch (type) {
      case "performance":
        return <Zap className="w-4 h-4 text-yellow-600" />;
      case "security":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "best_practice":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "refactor":
        return <Lightbulb className="w-4 h-4 text-blue-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  // Get badge variant for severity
  const getBadgeVariant = (severity) => {
    switch (severity) {
      case "error":
        return "destructive";
      case "warning":
        return "secondary";
      case "info":
        return "outline";
      default:
        return "default";
    }
  };

  if (!isVisible) return null;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            AI Suggestions
          </h3>
          <div className="flex items-center space-x-2">
            {isLoading && (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            )}
            <Badge variant="outline">
              {suggestions.length} suggestion
              {suggestions.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {suggestions.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            <Lightbulb className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No suggestions available.</p>
            <p className="text-sm">
              Start typing code to get AI-powered improvements!
            </p>
          </div>
        )}

        {suggestions.map((suggestion, index) => (
          <Card key={index} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-3">
              {getSuggestionIcon(suggestion.type, suggestion.severity)}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.title || suggestion.message}
                  </h4>
                  <Badge variant={getBadgeVariant(suggestion.severity)}>
                    {suggestion.severity || "info"}
                  </Badge>
                </div>

                <p className="text-sm text-gray-600 mb-3">
                  {suggestion.description || suggestion.message}
                </p>

                {suggestion.line && (
                  <p className="text-xs text-gray-500 mb-3">
                    Line {suggestion.line}
                  </p>
                )}

                {/* Expanded Details */}
                {expandedSuggestions.has(index) && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-md">
                    {suggestion.reasoning && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-gray-700 mb-1">
                          Reasoning:
                        </p>
                        <p className="text-xs text-gray-600">
                          {suggestion.reasoning}
                        </p>
                      </div>
                    )}

                    {suggestion.code_snippet && (
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-1">
                          Code snippet:
                        </p>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          <code>{suggestion.code_snippet}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSuggestion(index)}
                    className="flex items-center space-x-1 text-gray-500 hover:text-gray-700"
                  >
                    {expandedSuggestions.has(index) ? (
                      <>
                        <ChevronUp className="w-3 h-3" />
                        <span>Less</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        <span>More</span>
                      </>
                    )}
                  </Button>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => showSuggestionDiff(suggestion)}
                      disabled={isLoading}
                    >
                      Preview
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => applySuggestion(suggestion, index)}
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Footer */}
      {suggestions.length > 0 && (
        <div className="p-4 border-t bg-white">
          <Button
            variant="outline"
            size="sm"
            onClick={() => analyzecode(code)}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Analyzing..." : "Refresh Suggestions"}
          </Button>
        </div>
      )}
    </div>
  );
}
