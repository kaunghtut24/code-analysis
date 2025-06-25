import { useState, useEffect, useCallback } from "react";
import { CodeCanvasService } from "@/services/codeCanvasService";
import { useToastNotifications } from "@/hooks/useToastNotifications";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress.jsx";
import {
  Lightbulb,
  AlertTriangle,
  Info,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  Zap,
  Brain,
  Code2,
  Sparkles,
  Clock,
  Target,
  TrendingUp,
  Shield,
  Cpu,
  RefreshCw,
  Filter,
  Star,
  ThumbsUp,
  ThumbsDown,
  Copy,
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
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("priority");
  const [appliedSuggestions, setAppliedSuggestions] = useState(new Set());
  const [suggestionRatings, setSuggestionRatings] = useState({});
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [smartSuggestions, setSmartSuggestions] = useState([]);
  const [contextualHints, setContextualHints] = useState([]);
  const { showSuccess, showError, showInfo, showWarning } = useToastNotifications();

  // Helper function to match the old showToast interface
  const showToast = (message, type = "info") => {
    switch (type) {
      case "success":
        showSuccess("Success", message);
        break;
      case "error":
        showError("Error", message);
        break;
      case "warning":
        showWarning("Warning", message);
        break;
      case "info":
      default:
        showInfo("Info", message);
        break;
    }
  };

  // Enhanced analyze code with progress tracking and smart suggestions
  const analyzecode = useCallback(
    async (codeToAnalyze, forceRefresh = false) => {
      if (!codeToAnalyze || (!forceRefresh && codeToAnalyze === lastAnalyzedCode)) return;

      setIsLoading(true);
      setAnalysisProgress(0);

      // Clear cache for forced refresh to ensure fresh results
      if (forceRefresh) {
        console.log('🔄 Force refresh - clearing cache and resetting state');
        CodeCanvasService.clearCacheForCode(codeToAnalyze, language);
        setSuggestions([]);
        setSmartSuggestions([]);
        setContextualHints([]);
        setLastAnalyzedCode(""); // Reset to ensure fresh analysis
        showToast("Refreshing all suggestions...", "info");
      }

      try {
        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setAnalysisProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        // Get comprehensive analysis
        const [analysis, smartAnalysis, contextHints] = await Promise.all([
          CodeCanvasService.analyzeCode(codeToAnalyze, language),
          CodeCanvasService.getSmartSuggestions(codeToAnalyze, language),
          CodeCanvasService.getContextualHints(codeToAnalyze, language)
        ]);

        clearInterval(progressInterval);
        setAnalysisProgress(100);

        // Process and enhance suggestions
        const enhancedSuggestions = enhanceSuggestions(analysis.suggestions || []);
        setSuggestions(enhancedSuggestions);
        setSmartSuggestions(smartAnalysis.suggestions || []);
        setContextualHints(contextHints.hints || []);
        setLastAnalyzedCode(codeToAnalyze);

        // Show user-friendly error messages for Ollama issues
        if (analysis.error_type === 'model_not_found') {
          showToast(`Ollama model not found. Please run: ollama pull ${analysis.model || 'your-model'}`, "error");
        } else if (analysis.error_type === 'server_not_running') {
          showToast("Ollama server not running. Please start Ollama with: ollama serve", "error");
        } else if (analysis.provider === 'demo' && analysis.model === 'fallback') {
          // Only show this once per session, not repeatedly
          if (!sessionStorage.getItem('demo_mode_notified')) {
            showToast("Using demo mode. Configure AI provider in Settings for real suggestions.", "info");
            sessionStorage.setItem('demo_mode_notified', 'true');
          }
        }

        // Show success feedback for forced refresh
        if (forceRefresh) {
          const totalSuggestions = enhancedSuggestions.length + (smartAnalysis.suggestions || []).length + (contextHints.hints || []).length;
          showToast(`Refresh complete! Found ${totalSuggestions} suggestions.`, "success");
        }

        // Auto-apply high-confidence suggestions if enabled
        autoApplyHighConfidenceSuggestions(enhancedSuggestions);

      } catch (error) {
        console.error("Failed to analyze code:", error);
        setSuggestions([]);
        setSmartSuggestions([]);
        setContextualHints([]);

        // Show error feedback for forced refresh
        if (forceRefresh) {
          showToast("Refresh failed. Please check your AI configuration.", "error");
        }
      } finally {
        setIsLoading(false);
        setTimeout(() => setAnalysisProgress(0), 1000);
      }
    },
    [language, lastAnalyzedCode],
  );

  // Enhanced suggestion processing
  const enhanceSuggestions = (rawSuggestions) => {
    // Process suggestions from the service (real AI or demo fallback)
    if (!rawSuggestions || rawSuggestions.length === 0) {
      return [];
    }

    return rawSuggestions.map((suggestion, index) => ({
      ...suggestion,
      id: suggestion.id || `suggestion_${index}_${Date.now()}`,
      confidence: suggestion.confidence || calculateConfidence(suggestion),
      priority: suggestion.priority || calculatePriority(suggestion),
      estimatedImpact: suggestion.estimatedImpact || estimateImpact(suggestion),
      category: suggestion.category || categorizeByContext(suggestion, language),
      timestamp: suggestion.timestamp || Date.now(),
      code_snippet: suggestion.code_snippet || generateCodeSnippet(suggestion, code, language),
      reasoning: suggestion.reasoning || generateReasoning(suggestion),
    }));
  };

  const calculateConfidence = (suggestion) => {
    let confidence = 0.5; // Base confidence
    if (suggestion.type === 'security') confidence += 0.3;
    if (suggestion.type === 'performance') confidence += 0.2;
    if (suggestion.severity === 'error') confidence += 0.4;
    if (suggestion.code_snippet && suggestion.code_snippet.length > 10) confidence += 0.1;
    return Math.min(confidence, 1.0);
  };

  const calculatePriority = (suggestion) => {
    const weights = {
      error: 10,
      security: 9,
      performance: 8,
      warning: 6,
      best_practice: 5,
      refactor: 4,
      info: 3
    };
    return weights[suggestion.severity] || weights[suggestion.type] || 3;
  };

  const estimateImpact = (suggestion) => {
    const impacts = {
      security: 'High',
      performance: 'Medium',
      error: 'High',
      warning: 'Medium',
      best_practice: 'Low',
      refactor: 'Medium',
      info: 'Low'
    };
    return impacts[suggestion.type] || impacts[suggestion.severity] || 'Low';
  };

  const categorizeByContext = (suggestion, lang) => {
    const categories = {
      javascript: ['React', 'Node.js', 'ES6+', 'Performance'],
      python: ['Django', 'Flask', 'Data Science', 'Performance'],
      java: ['Spring', 'JPA', 'Performance', 'Design Patterns'],
      cpp: ['STL', 'Memory Management', 'Performance', 'Modern C++']
    };
    return categories[lang] || ['General'];
  };

  // Helper functions for generating code snippets
  const findLineContaining = (lines, searchText) => {
    const index = lines.findIndex(line => line.includes(searchText));
    return index >= 0 ? index + 1 : null;
  };

  const generateCodeSnippet = (suggestion, code, language) => {
    // Generate appropriate code snippet based on suggestion type
    switch (suggestion.type) {
      case 'performance':
        return generatePerformanceSnippet(suggestion, code, language);
      case 'security':
        return generateSecuritySnippet(suggestion, code, language);
      case 'best_practice':
        return generateBestPracticeSnippet(suggestion, code, language);
      default:
        return `// Improved code for: ${suggestion.title}\n// ${suggestion.description}`;
    }
  };

  const generateReasoning = (suggestion) => {
    const reasoningMap = {
      performance: "This optimization improves execution speed and reduces resource usage.",
      security: "This change prevents potential security vulnerabilities and protects user data.",
      best_practice: "Following this practice improves code maintainability and reduces bugs.",
      refactor: "This refactoring improves code structure and readability."
    };
    return reasoningMap[suggestion.type] || "This improvement enhances code quality.";
  };

  const generatePerformanceSnippet = (suggestion, code, language) => {
    if (language === 'javascript') {
      return "// Optimized version:\nconst results = items.map(item => {\n  return processItem(item);\n}).filter(result => result !== null);";
    }
    return "// Performance optimized code here";
  };

  const generateSecuritySnippet = (suggestion, code, language) => {
    if (language === 'javascript') {
      return "// Secure version:\nconst sanitizedInput = DOMPurify.sanitize(userInput);\nelement.innerHTML = sanitizedInput;";
    }
    return "// Security enhanced code here";
  };

  const generateBestPracticeSnippet = (suggestion, code, language) => {
    if (language === 'javascript') {
      return "// Best practice implementation:\nconst handleAsync = async () => {\n  try {\n    const result = await operation();\n    return result;\n  } catch (error) {\n    console.error('Error:', error);\n    throw error;\n  }\n};";
    }
    return "// Best practice code here";
  };

  const autoApplyHighConfidenceSuggestions = (suggestions) => {
    const autoApplyEnabled = localStorage.getItem('autoApplySuggestions') === 'true';
    if (!autoApplyEnabled) return;

    suggestions
      .filter(s => s.confidence > 0.9 && s.type !== 'refactor')
      .slice(0, 2) // Limit auto-apply to 2 suggestions
      .forEach(suggestion => {
        setTimeout(() => applySuggestion(suggestion, -1), 1000);
      });
  };

  // Auto-analyze when code changes with smart debouncing
  useEffect(() => {
    if (code && code.trim().length > 10) {
      const delay = code.length > 1000 ? 3000 : 2000; // Longer delay for larger code
      const timeoutId = setTimeout(() => analyzecode(code), delay);
      return () => clearTimeout(timeoutId);
    }
  }, [code, analyzecode]);

  // Filter and sort suggestions
  const getFilteredAndSortedSuggestions = () => {
    let filtered = suggestions;

    // Apply filters
    if (filterType !== "all") {
      filtered = suggestions.filter(s =>
        s.type === filterType || s.severity === filterType
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "priority":
          return (b.priority || 0) - (a.priority || 0);
        case "confidence":
          return (b.confidence || 0) - (a.confidence || 0);
        case "impact":
          const impactOrder = { High: 3, Medium: 2, Low: 1 };
          return (impactOrder[b.estimatedImpact] || 0) - (impactOrder[a.estimatedImpact] || 0);
        case "timestamp":
          return (b.timestamp || 0) - (a.timestamp || 0);
        default:
          return 0;
      }
    });

    return filtered;
  };

  // Rate suggestion
  const rateSuggestion = (suggestionId, rating) => {
    setSuggestionRatings(prev => ({
      ...prev,
      [suggestionId]: rating
    }));

    // Store rating for learning
    const ratings = JSON.parse(localStorage.getItem('suggestionRatings') || '{}');
    ratings[suggestionId] = rating;
    localStorage.setItem('suggestionRatings', JSON.stringify(ratings));
  };

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

  // Enhanced apply suggestion with tracking
  const applySuggestion = async (suggestion, index) => {
    try {
      setIsLoading(true);

      // Track application attempt
      const appliedSet = new Set(appliedSuggestions);
      appliedSet.add(suggestion.id);
      setAppliedSuggestions(appliedSet);

      // Get the improved code for this suggestion
      const improvement = await CodeCanvasService.getCodeImprovements(
        code,
        {
          text: suggestion.code_snippet || code,
          line: suggestion.line,
          type: suggestion.type,
          confidence: suggestion.confidence,
          priority: suggestion.priority,
        },
        language,
      );

      if (improvement.improved_code) {
        if (onApplySuggestion) {
          onApplySuggestion(improvement.improved_code, {
            ...suggestion,
            appliedAt: Date.now(),
            improvement: improvement
          });
        }

        // Track successful application
        trackSuggestionApplication(suggestion, true);

        // Remove applied suggestion from list
        if (index >= 0) {
          setSuggestions((prev) => prev.filter((_, i) => i !== index));
        }

        // Show success feedback
        showApplicationFeedback(suggestion, true);
      }
    } catch (error) {
      console.error("Failed to apply suggestion:", error);
      trackSuggestionApplication(suggestion, false);
      showApplicationFeedback(suggestion, false);
    } finally {
      setIsLoading(false);
    }
  };

  // Track suggestion application for learning
  const trackSuggestionApplication = (suggestion, success) => {
    const analytics = JSON.parse(localStorage.getItem('suggestionAnalytics') || '{}');
    const key = `${suggestion.type}_${suggestion.severity}`;

    if (!analytics[key]) {
      analytics[key] = { applied: 0, rejected: 0, success: 0, failure: 0 };
    }

    if (success) {
      analytics[key].applied++;
      analytics[key].success++;
    } else {
      analytics[key].failure++;
    }

    localStorage.setItem('suggestionAnalytics', JSON.stringify(analytics));
  };

  // Show application feedback
  const showApplicationFeedback = (suggestion, success) => {
    // This could trigger a toast notification or visual feedback
    console.log(`Suggestion ${success ? 'applied' : 'failed'}: ${suggestion.title}`);
  };

  // Show diff for a suggestion
  const showSuggestionDiff = async (suggestion) => {
    try {
      setIsLoading(true);

      // Generate improved code based on the suggestion
      let improvedCode;

      if (suggestion.code_snippet) {
        // If suggestion has a specific code snippet, apply it
        improvedCode = applySuggestionToCode(code, suggestion);
      } else {
        // Otherwise, get AI-generated improvement
        const improvement = await CodeCanvasService.getCodeImprovements(
          code,
          {
            text: suggestion.description || suggestion.message,
            line: suggestion.line,
            type: suggestion.type,
          },
          language,
        );
        improvedCode = improvement.improved_code;
      }

      if (improvedCode && onShowDiff) {
        // Enhanced suggestion object with preview data
        const enhancedSuggestion = {
          ...suggestion,
          preview_code: improvedCode,
          original_code: code,
          changes_summary: generateChangesSummary(code, improvedCode)
        };

        onShowDiff(code, improvedCode, enhancedSuggestion);
        showToast("Preview generated! Review the changes and click Accept to apply.", "success");
      }
    } catch (error) {
      console.error("Failed to generate diff:", error);
      showToast("Failed to generate preview. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Apply suggestion to code (for suggestions with specific code snippets)
  const applySuggestionToCode = (originalCode, suggestion) => {
    if (!suggestion.code_snippet) return originalCode;

    const lines = originalCode.split('\n');

    if (suggestion.line && suggestion.line > 0) {
      // Replace specific line
      const lineIndex = suggestion.line - 1;
      if (lineIndex < lines.length) {
        lines[lineIndex] = suggestion.code_snippet;
      }
    } else if (suggestion.start_line && suggestion.end_line) {
      // Replace range of lines
      const startIndex = suggestion.start_line - 1;
      const endIndex = suggestion.end_line - 1;
      lines.splice(startIndex, endIndex - startIndex + 1, suggestion.code_snippet);
    } else {
      // Append or insert at appropriate location
      if (suggestion.insert_at === 'beginning') {
        lines.unshift(suggestion.code_snippet);
      } else if (suggestion.insert_at === 'end') {
        lines.push(suggestion.code_snippet);
      } else {
        // Smart insertion based on suggestion type
        const insertIndex = findBestInsertionPoint(lines, suggestion);
        lines.splice(insertIndex, 0, suggestion.code_snippet);
      }
    }

    return lines.join('\n');
  };

  // Find best insertion point for code snippet
  const findBestInsertionPoint = (lines, suggestion) => {
    // Simple heuristic: insert at the end for now
    // Could be enhanced with more sophisticated logic
    return lines.length;
  };

  // Generate changes summary
  const generateChangesSummary = (original, modified) => {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');

    return {
      lines_added: Math.max(0, modifiedLines.length - originalLines.length),
      lines_removed: Math.max(0, originalLines.length - modifiedLines.length),
      lines_modified: Math.min(originalLines.length, modifiedLines.length),
      total_changes: Math.abs(modifiedLines.length - originalLines.length)
    };
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

  // Get badge variant for severity with enhanced styling
  const getBadgeVariant = (severity) => {
    switch (severity) {
      case "error":
        return "destructive"; // Red background
      case "warning":
        return "default"; // Yellow/orange theme
      case "security":
        return "destructive"; // Red for security issues
      case "performance":
        return "secondary"; // Blue theme
      case "best_practice":
        return "outline"; // Gray outline
      case "info":
        return "outline";
      default:
        return "default"; // Default gray
    }
  };

  // Get custom badge classes for better colors
  const getBadgeClasses = (severity) => {
    switch (severity) {
      case "error":
        return "bg-red-100 text-red-800 border-red-200";
      case "warning":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "security":
        return "bg-red-100 text-red-800 border-red-200";
      case "performance":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "best_practice":
        return "bg-green-100 text-green-800 border-green-200";
      case "info":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (!isVisible) return null;

  const filteredSuggestions = getFilteredAndSortedSuggestions();

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Enhanced Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Brain className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                AI Code Assistant
              </h3>
              <p className="text-xs text-gray-600">Intelligent code analysis and suggestions</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {isLoading && (
              <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full shadow-sm">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium text-blue-700">Analyzing...</span>
              </div>
            )}

            {/* Cache Status Indicator */}
            {suggestions.length > 0 && suggestions[0]?.cached && (
              <Badge variant="outline" className="flex items-center space-x-1 bg-green-50 text-green-700 border-green-200">
                <Clock className="w-3 h-3" />
                <span className="text-xs font-medium">Cached</span>
              </Badge>
            )}

            {/* AI Provider Indicator */}
            {suggestions.length > 0 && suggestions[0]?.provider && (
              <Badge variant="outline" className="flex items-center space-x-1 bg-purple-50 text-purple-700 border-purple-200">
                <Brain className="w-3 h-3" />
                <span className="text-xs font-medium">
                  {suggestions[0].provider === 'demo' ? 'Demo Mode' : `${suggestions[0].provider}/${suggestions[0].model}`}
                </span>
              </Badge>
            )}

            <Badge variant="secondary" className="flex items-center space-x-1 bg-blue-100 text-blue-800 border-blue-200">
              <Sparkles className="w-3 h-3" />
              <span className="font-medium">{filteredSuggestions.length} active</span>
            </Badge>
          </div>
        </div>

        {/* Progress Bar */}
        {isLoading && analysisProgress > 0 && (
          <div className="mb-3 bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center justify-between text-xs font-medium text-gray-700 mb-2">
              <span className="flex items-center space-x-1">
                <Cpu className="w-3 h-3" />
                <span>AI Analysis Progress</span>
              </span>
              <span className="text-blue-600">{analysisProgress}%</span>
            </div>
            <Progress value={analysisProgress} className="h-2 bg-gray-200" />
          </div>
        )}

        {/* Filters and Controls */}
        <div className="flex items-center justify-between space-x-3 bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Filter className="w-3 h-3 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-xs border border-gray-300 rounded-md px-3 py-1.5 bg-white text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="all">All Types</option>
                <option value="error">🚨 Errors</option>
                <option value="warning">⚠️ Warnings</option>
                <option value="security">🛡️ Security</option>
                <option value="performance">⚡ Performance</option>
                <option value="best_practice">✨ Best Practices</option>
              </select>
            </div>

            <div className="flex items-center space-x-1">
              <TrendingUp className="w-3 h-3 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs border border-gray-300 rounded-md px-3 py-1.5 bg-white text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="priority">🎯 Priority</option>
                <option value="confidence">📊 Confidence</option>
                <option value="impact">💥 Impact</option>
                <option value="timestamp">🕒 Recent</option>
              </select>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => analyzecode(code, true)}
            disabled={isLoading}
            className="text-xs font-medium border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Analyzing' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Smart Suggestions Section */}
      {smartSuggestions.length > 0 && (
        <div className="border-b border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 p-4">
          <div className="flex items-center space-x-2 mb-3">
            <div className="p-1 bg-blue-200 rounded">
              <Sparkles className="w-4 h-4 text-blue-700" />
            </div>
            <span className="text-sm font-semibold text-blue-900">Smart Suggestions</span>
            <Badge variant="secondary" className="text-xs bg-blue-200 text-blue-800">
              {smartSuggestions.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {smartSuggestions.slice(0, 2).map((smart, idx) => (
              <div key={idx} className="flex items-start space-x-2 text-sm text-blue-800 bg-white bg-opacity-70 rounded-lg px-3 py-2 shadow-sm">
                <span className="text-blue-600 mt-0.5">💡</span>
                <span className="flex-1">{smart.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contextual Hints */}
      {contextualHints.length > 0 && (
        <div className="border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-100 p-4">
          <div className="flex items-center space-x-2 mb-3">
            <div className="p-1 bg-emerald-200 rounded">
              <Target className="w-4 h-4 text-emerald-700" />
            </div>
            <span className="text-sm font-semibold text-emerald-900">Context Hints</span>
            <Badge variant="secondary" className="text-xs bg-emerald-200 text-emerald-800">
              {contextualHints.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {contextualHints.slice(0, 2).map((hint, idx) => (
              <div key={idx} className="flex items-start space-x-2 text-sm text-emerald-800 bg-white bg-opacity-70 rounded-lg px-3 py-2 shadow-sm">
                <span className="text-emerald-600 mt-0.5">🎯</span>
                <span className="flex-1">{hint.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Suggestions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredSuggestions.length === 0 && !isLoading && (
          <div className="text-center py-12 px-6">
            <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="w-10 h-10 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No suggestions available</h4>
            <p className="text-sm text-gray-600 mb-4 max-w-sm mx-auto">
              Start typing code to get AI-powered improvements and suggestions!
            </p>
            {suggestions.length > 0 && filteredSuggestions.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-sm mx-auto">
                <p className="text-sm text-blue-700 flex items-center justify-center space-x-1">
                  <Info className="w-4 h-4" />
                  <span>Try changing the filter to see more suggestions</span>
                </p>
              </div>
            )}
          </div>
        )}

        {filteredSuggestions.map((suggestion, index) => (
          <Card key={suggestion.id || index} className={`p-5 hover:shadow-lg transition-all duration-300 border-l-4 ${
            appliedSuggestions.has(suggestion.id)
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400 border-l-green-500'
              : 'bg-white hover:bg-gray-50 border-l-blue-400'
          }`}>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {getSuggestionIcon(suggestion.type, suggestion.severity)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 mr-4">
                    <h4 className="text-base font-semibold text-gray-900 mb-1 leading-tight">
                      {suggestion.title || suggestion.message}
                    </h4>
                    {suggestion.confidence && (
                      <div className="flex items-center space-x-1 mb-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <Badge variant="outline" className="text-xs font-medium border-blue-200 text-blue-700 bg-blue-50">
                          {Math.round(suggestion.confidence * 100)}% confidence
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <Badge className={`font-medium ${getBadgeClasses(suggestion.severity)}`}>
                      {suggestion.severity || "info"}
                    </Badge>
                    {suggestion.estimatedImpact && (
                      <Badge className="text-xs bg-indigo-100 text-indigo-800 border-indigo-200">
                        {suggestion.estimatedImpact} impact
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {suggestion.description || suggestion.message}
                  </p>
                </div>

                {/* Enhanced metadata */}
                <div className="flex flex-wrap items-center gap-3 text-xs mb-4">
                  {suggestion.line && (
                    <div className="flex items-center space-x-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
                      <Code2 className="w-3 h-3" />
                      <span className="font-medium">Line {suggestion.line}</span>
                    </div>
                  )}
                  {suggestion.priority && (
                    <div className="flex items-center space-x-1 bg-orange-50 text-orange-700 px-2 py-1 rounded-md">
                      <TrendingUp className="w-3 h-3" />
                      <span className="font-medium">Priority {suggestion.priority}</span>
                    </div>
                  )}
                  {suggestion.category && suggestion.category[0] && (
                    <div className="flex items-center space-x-1 bg-purple-50 text-purple-700 px-2 py-1 rounded-md">
                      <Target className="w-3 h-3" />
                      <span className="font-medium">{suggestion.category[0]}</span>
                    </div>
                  )}
                  {suggestion.timestamp && (
                    <div className="flex items-center space-x-1 bg-gray-50 text-gray-600 px-2 py-1 rounded-md">
                      <Clock className="w-3 h-3" />
                      <span className="font-medium">Just now</span>
                    </div>
                  )}
                </div>

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

                {/* Code Snippet Preview (when expanded) */}
                {expandedSuggestions.has(index) && suggestion.code_snippet && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-semibold text-gray-800">Suggested Code:</h5>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(suggestion.code_snippet)}
                        className="text-xs text-gray-600 hover:text-gray-800"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <div className="bg-white border border-gray-300 rounded-md p-3 font-mono text-sm max-h-40 overflow-y-auto">
                      <pre className="text-gray-800 whitespace-pre-wrap">
                        {suggestion.code_snippet}
                      </pre>
                    </div>
                    {suggestion.reasoning && (
                      <p className="text-xs text-gray-600 mt-2 italic">
                        💡 {suggestion.reasoning}
                      </p>
                    )}
                  </div>
                )}

                {/* Enhanced Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSuggestion(index)}
                      className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-3 py-1.5 rounded-md transition-colors"
                    >
                      {expandedSuggestions.has(index) ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          <span className="text-sm font-medium">Show Less</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          <span className="text-sm font-medium">Show Code</span>
                        </>
                      )}
                    </Button>

                    {/* Rating buttons */}
                    <div className="flex items-center space-x-1 bg-gray-50 rounded-lg p-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => rateSuggestion(suggestion.id, 'helpful')}
                        className={`p-2 rounded-md transition-all ${
                          suggestionRatings[suggestion.id] === 'helpful'
                            ? 'text-green-600 bg-green-100 hover:bg-green-200'
                            : 'text-gray-400 hover:text-green-500 hover:bg-green-50'
                        }`}
                        title="Mark as helpful"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => rateSuggestion(suggestion.id, 'not-helpful')}
                        className={`p-2 rounded-md transition-all ${
                          suggestionRatings[suggestion.id] === 'not-helpful'
                            ? 'text-red-600 bg-red-100 hover:bg-red-200'
                            : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                        }`}
                        title="Mark as not helpful"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => showSuggestionDiff(suggestion)}
                      disabled={isLoading || appliedSuggestions.has(suggestion.id)}
                      className="text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 px-4 py-2"
                      title="Preview the code changes before applying"
                    >
                      <Code2 className="w-4 h-4 mr-1.5" />
                      {isLoading ? 'Generating...' : 'Preview Changes'}
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => applySuggestion(suggestion, index)}
                      disabled={isLoading || appliedSuggestions.has(suggestion.id)}
                      className={`text-sm font-medium px-4 py-2 transition-all ${
                        appliedSuggestions.has(suggestion.id)
                          ? 'bg-green-600 hover:bg-green-700 text-white shadow-md'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                      } disabled:opacity-50`}
                      title={appliedSuggestions.has(suggestion.id)
                        ? 'This suggestion has been applied'
                        : `Apply this ${suggestion.type} improvement to your code`
                      }
                    >
                      {appliedSuggestions.has(suggestion.id) ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1.5" />
                          Applied
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-1.5" />
                          Apply Fix
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Enhanced Footer */}
      {suggestions.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-gray-600">
              <span className="font-medium">{suggestions.length}</span> suggestions found
              {filteredSuggestions.length !== suggestions.length && (
                <span className="ml-1">
                  • <span className="font-medium">{filteredSuggestions.length}</span> shown
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Last updated: just now
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => analyzecode(code, true)}
            disabled={isLoading}
            className="w-full font-medium border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? "Analyzing Code..." : "Refresh All Suggestions"}
          </Button>
        </div>
      )}
    </div>
  );
}
