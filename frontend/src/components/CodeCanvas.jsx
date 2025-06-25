import { useState, useEffect } from "react";
import { useToastNotifications } from "@/hooks/useToastNotifications";
import { settingsService } from "@/services/settingsService";
import { shouldUseMockApi } from "@/services/mockApiService";
import MonacoEditor from "./MonacoEditor";
import AISuggestionProvider from "./AISuggestionProvider";
import DiffViewer from "./DiffViewer";
import MobileHeader from "./MobileHeader";
import BackendInstructions from "./BackendInstructions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Play,
  Save,
  Download,
  Upload,
  Settings,
  Split,
  Maximize2,
  Minimize2,
  Brain,
  Code2,
  FileText,
  Palette,
  AlertTriangle,
  Server,
} from "lucide-react";

const SUPPORTED_LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "markdown", label: "Markdown" },
  { value: "xml", label: "XML" },
  { value: "yaml", label: "YAML" },
  { value: "sql", label: "SQL" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "kotlin", label: "Kotlin" },
  { value: "swift", label: "Swift" },
];

const THEMES = [
  { value: "vs-dark", label: "Dark" },
  { value: "vs", label: "Light" },
  { value: "hc-black", label: "High Contrast" },
];

const DEFAULT_CODE = {
  javascript: `// Welcome to the AI Code Canvas!
// Start typing your code and get real-time AI suggestions

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));`,

  python: `# Welcome to the AI Code Canvas!
# Start typing your code and get real-time AI suggestions

def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print(fibonacci(10))`,

  java: `// Welcome to the AI Code Canvas!
// Start typing your code and get real-time AI suggestions

public class Fibonacci {
    public static int fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }

    public static void main(String[] args) {
        System.out.println(fibonacci(10));
    }
}`,
};

export default function CodeCanvas({ setSidebarOpen }) {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [theme, setTheme] = useState("vs-dark");
  const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState(true);
  const [showDiff, setShowDiff] = useState(false);
  const [diffData, setDiffData] = useState({
    original: "",
    modified: "",
    suggestion: null,
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layoutMode, setLayoutMode] = useState("split"); // 'split', 'editor-only', 'suggestions-only'
  const [savedCode, setSavedCode] = useState("");
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [editorWidth, setEditorWidth] = useState(60); // Percentage width for editor
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

  // Initialize with default code
  useEffect(() => {
    setCode(DEFAULT_CODE[language] || DEFAULT_CODE.javascript);
  }, [language]);

  // Check if we're in mock mode
  useEffect(() => {
    const checkMockMode = async () => {
      const useMock = await shouldUseMockApi();
      setIsMockMode(useMock);
      if (useMock) {
        showToast(
          "⚠️ Backend not available - using mock mode for testing",
          "warning",
        );
      }
    };
    checkMockMode();
  }, []);

  // Handle code changes
  const handleCodeChange = (value) => {
    setCode(value || "");
  };

  // Handle language change
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    if (!code || code === DEFAULT_CODE[language]) {
      setCode(DEFAULT_CODE[newLanguage] || "");
    }
  };

  // Enhanced handling of AI suggestions with better feedback
  const handleApplySuggestion = (improvedCode, suggestion) => {
    setCode(improvedCode);

    // Enhanced success message with suggestion details
    const title = suggestion?.title || suggestion?.message || "Code improvement";
    let message = `✨ Applied: ${title}`;

    if (suggestion?.confidence) {
      message += ` (${Math.round(suggestion.confidence * 100)}% confidence)`;
    }

    if (suggestion?.estimatedImpact) {
      message += ` - ${suggestion.estimatedImpact} impact`;
    }

    showToast(message, "success");

    // Track suggestion application for analytics
    trackSuggestionUsage(suggestion);

    // Add to history with detailed information
    if (typeof addToHistory === 'function') {
      addToHistory(improvedCode, `Applied AI suggestion: ${title}`, {
        type: 'ai_suggestion',
        suggestion: suggestion,
        confidence: suggestion?.confidence,
        impact: suggestion?.estimatedImpact,
        appliedAt: Date.now()
      });
    }
  };

  // Track suggestion usage for learning and analytics
  const trackSuggestionUsage = (suggestion) => {
    if (!suggestion) return;

    const usage = JSON.parse(localStorage.getItem('aiSuggestionUsage') || '{}');
    const key = `${suggestion.type || 'unknown'}_${suggestion.severity || 'info'}`;

    usage[key] = (usage[key] || 0) + 1;
    usage.totalApplied = (usage.totalApplied || 0) + 1;
    usage.lastUsed = Date.now();

    localStorage.setItem('aiSuggestionUsage', JSON.stringify(usage));

    // Log for debugging
    console.log('📊 Suggestion applied:', {
      type: suggestion.type,
      severity: suggestion.severity,
      confidence: suggestion.confidence,
      totalApplied: usage.totalApplied
    });
  };

  // Handle diff preview
  const handleShowDiff = (original, modified, suggestion) => {
    setDiffData({ original, modified, suggestion });
    setShowDiff(true);
  };

  // Handle diff acceptance
  const handleAcceptDiff = (modifiedCode, suggestion) => {
    setCode(modifiedCode);
    setShowDiff(false);
    showToast(
      `Applied improvement: ${suggestion?.title || "Code change"}`,
      "success",
    );
  };

  // Handle diff rejection
  const handleRejectDiff = () => {
    setShowDiff(false);
    showToast("Change rejected", "info");
  };

  // Save code to localStorage
  const handleSave = () => {
    localStorage.setItem(`codeCanvas_${language}`, code);
    setSavedCode(code);
    showToast("Code saved locally", "success");
  };

  // Load code from localStorage
  const handleLoad = () => {
    const saved = localStorage.getItem(`codeCanvas_${language}`);
    if (saved) {
      setCode(saved);
      setSavedCode(saved);
      showToast("Code loaded from local storage", "success");
    } else {
      showToast("No saved code found for this language", "info");
    }
  };

  // Download code as file
  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${getFileExtension(language)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Code downloaded", "success");
  };

  // Upload code from file
  const handleUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept =
      ".js,.ts,.py,.java,.cpp,.c,.html,.css,.json,.md,.xml,.yml,.sql,.php,.rb,.go,.rs,.kt,.swift,.txt";

    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result;
          if (typeof content === "string") {
            setCode(content);
            showToast(`File "${file.name}" uploaded`, "success");

            // Try to detect language from file extension
            const ext = file.name.split(".").pop()?.toLowerCase();
            const detectedLang = detectLanguageFromExtension(ext);
            if (detectedLang && detectedLang !== language) {
              setLanguage(detectedLang);
              showToast(
                `Language detected: ${SUPPORTED_LANGUAGES.find((l) => l.value === detectedLang)?.label}`,
                "info",
              );
            }
          }
        };
        reader.readAsText(file);
      }
    };

    input.click();
  };

  // Get file extension for download
  const getFileExtension = (lang) => {
    const extensions = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      java: "java",
      cpp: "cpp",
      c: "c",
      html: "html",
      css: "css",
      json: "json",
      markdown: "md",
      xml: "xml",
      yaml: "yml",
      sql: "sql",
      php: "php",
      ruby: "rb",
      go: "go",
      rust: "rs",
      kotlin: "kt",
      swift: "swift",
    };
    return extensions[lang] || "txt";
  };

  // Detect language from file extension
  const detectLanguageFromExtension = (ext) => {
    const extensionMap = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      py: "python",
      java: "java",
      cpp: "cpp",
      cxx: "cpp",
      cc: "cpp",
      c: "c",
      h: "c",
      html: "html",
      htm: "html",
      css: "css",
      json: "json",
      md: "markdown",
      xml: "xml",
      yml: "yaml",
      yaml: "yaml",
      sql: "sql",
      php: "php",
      rb: "ruby",
      go: "go",
      rs: "rust",
      kt: "kotlin",
      swift: "swift",
    };
    return extensionMap[ext];
  };

  // Test API connection
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      const settings = settingsService.loadSettings();
      const provider = settings.selectedProvider;
      const apiKey = settings.apiKeys[provider];

      if (!apiKey && provider !== "ollama") {
        showToast("Please set up your API key in Settings first", "error");
        return;
      }

      const testData = {
        provider,
        model: settings.selectedModel,
        api_key: apiKey,
        base_url: settings.customBaseUrl || undefined,
      };

      const result = await settingsService.testConnection(testData);

      if (result.success) {
        showToast(
          `✅ Connection successful! Using ${provider}/${testData.model}`,
          "success",
        );
      } else {
        showToast(
          `❌ Connection failed: ${result.error || "Unknown error"}`,
          "error",
        );
      }
    } catch (error) {
      console.error("Connection test failed:", error);
      showToast(`❌ Connection test failed: ${error.message}`, "error");
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Add keyboard shortcuts for enhanced productivity
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only handle shortcuts when not typing in input fields
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      // Ctrl/Cmd + S to save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleSave();
      }

      // Ctrl/Cmd + O to load
      if ((event.ctrlKey || event.metaKey) && event.key === 'o') {
        event.preventDefault();
        handleLoad();
      }

      // Ctrl/Cmd + D to download
      if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
        event.preventDefault();
        handleDownload();
      }

      // Ctrl/Cmd + / to toggle AI suggestions
      if ((event.ctrlKey || event.metaKey) && event.key === '/') {
        event.preventDefault();
        setAiSuggestionsEnabled(prev => {
          const newState = !prev;
          showToast(`AI Suggestions ${newState ? 'enabled' : 'disabled'}`, "info");
          return newState;
        });
      }

      // Ctrl/Cmd + Shift + L to change layout
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'L') {
        event.preventDefault();
        toggleLayout();
      }

      // Escape to close diff view
      if (event.key === 'Escape' && showDiff) {
        event.preventDefault();
        setShowDiff(false);
      }

      // Ctrl/Cmd + T to test connection
      if ((event.ctrlKey || event.metaKey) && event.key === 't') {
        event.preventDefault();
        handleTestConnection();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showDiff, aiSuggestionsEnabled]);

  // Toggle layout modes
  const toggleLayout = () => {
    const modes = ["split", "editor-only", "suggestions-only"];
    const currentIndex = modes.indexOf(layoutMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const newMode = modes[nextIndex];
    setLayoutMode(newMode);

    // Reset to default proportions when switching to split mode
    if (newMode === "split") {
      setEditorWidth(60);
    }

    // Show toast with layout description
    const descriptions = {
      "split": `Split View (${Math.round(editorWidth)}% Editor + ${Math.round(100-editorWidth)}% AI Assistant)`,
      "editor-only": "Editor Only (Full Width)",
      "suggestions-only": "AI Assistant Only (Full Width)"
    };
    showToast(`Layout: ${descriptions[newMode]}`, "info");
  };

  // Set specific layout preset
  const setLayoutPreset = (preset) => {
    switch (preset) {
      case "balanced":
        setLayoutMode("split");
        setEditorWidth(50);
        showToast("Layout: Balanced (50/50)", "info");
        break;
      case "editor-focused":
        setLayoutMode("split");
        setEditorWidth(70);
        showToast("Layout: Editor Focused (70/30)", "info");
        break;
      case "ai-focused":
        setLayoutMode("split");
        setEditorWidth(40);
        showToast("Layout: AI Focused (40/60)", "info");
        break;
      default:
        setLayoutMode("split");
        setEditorWidth(60);
        showToast("Layout: Default (60/40)", "info");
    }
  };

  // Get API status color
  const getAPIStatusColor = () => {
    if (isMockMode) {
      return "bg-yellow-500"; // Mock mode
    }

    const settings = settingsService.loadSettings();
    const provider = settings.selectedProvider;
    const apiKey = settings.apiKeys[provider];

    if (!apiKey && provider !== "ollama") {
      return "bg-red-500"; // No API key
    }
    return "bg-green-500"; // API key configured
  };

  // Get API status text
  const getAPIStatusText = () => {
    if (isMockMode) {
      return "Mock Mode (Backend offline)";
    }

    const settings = settingsService.loadSettings();
    const provider = settings.selectedProvider;
    const apiKey = settings.apiKeys[provider];

    if (!apiKey && provider !== "ollama") {
      return "API key required";
    }
    return `${provider}/${settings.selectedModel}`;
  };

  // Get layout button icon
  const getLayoutIcon = () => {
    switch (layoutMode) {
      case "split":
        return <Split className="w-4 h-4" />;
      case "editor-only":
        return <Code2 className="w-4 h-4" />;
      case "suggestions-only":
        return <Brain className="w-4 h-4" />;
      default:
        return <Split className="w-4 h-4" />;
    }
  };

  return (
    <div
      className={`flex flex-col h-screen ${isFullscreen ? "fixed inset-0 z-50 bg-white" : ""}`}
    >
      {/* Mobile Header */}
      <MobileHeader setSidebarOpen={setSidebarOpen} title="Code Canvas" />

      {/* Mock Mode Banner */}
      {isMockMode && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-yellow-800">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">
                Mock Mode Active - Backend server not running.
                <span className="ml-1 text-yellow-600">
                  Start the Python backend for real AI analysis.
                </span>
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowInstructions(true)}
              className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
            >
              <Server className="w-4 h-4 mr-1" />
              Setup Guide
            </Button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Code2 className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900 hidden sm:block">
              Interactive Code Canvas
            </h1>
            <h1 className="text-lg font-semibold text-gray-900 sm:hidden">
              Code Canvas
            </h1>
          </div>

          {/* API Status Indicator */}
          <div className="flex items-center space-x-2 text-sm">
            <div
              className={`w-2 h-2 rounded-full ${getAPIStatusColor()}`}
            ></div>
            <span className="text-gray-600 hidden md:inline">
              {getAPIStatusText()}
            </span>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {THEMES.map((theme) => (
                <SelectItem key={theme.value} value={theme.value}>
                  {theme.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleLoad}>
            <Upload className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Load</span>
          </Button>

          <Button variant="outline" size="sm" onClick={handleUpload}>
            <FileText className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Upload</span>
          </Button>

          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Save</span>
          </Button>

          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Download</span>
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLayout}
              title={`Current: ${layoutMode === 'split' ? `${Math.round(editorWidth)}/${Math.round(100-editorWidth)} Split` : layoutMode === 'editor-only' ? 'Editor Only' : 'AI Assistant Only'}`}
              className="flex items-center space-x-1"
            >
              {getLayoutIcon()}
              <span className="hidden lg:inline text-xs">
                {layoutMode === 'split' ? `${Math.round(editorWidth)}/${Math.round(100-editorWidth)}` : layoutMode === 'editor-only' ? 'Editor' : 'AI'}
              </span>
            </Button>

            {/* Layout Presets Dropdown */}
            {layoutMode === 'split' && (
              <div className="relative group">
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2 text-xs text-gray-600 hover:text-gray-900"
                  title="Layout Presets"
                >
                  ⚙️
                </Button>
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-40">
                  <button
                    onClick={() => setLayoutPreset("balanced")}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center justify-between"
                  >
                    <span>Balanced</span>
                    <span className="text-gray-500">50/50</span>
                  </button>
                  <button
                    onClick={() => setLayoutPreset("default")}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center justify-between"
                  >
                    <span>Default</span>
                    <span className="text-gray-500">60/40</span>
                  </button>
                  <button
                    onClick={() => setLayoutPreset("editor-focused")}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center justify-between"
                  >
                    <span>Editor Focused</span>
                    <span className="text-gray-500">70/30</span>
                  </button>
                  <button
                    onClick={() => setLayoutPreset("ai-focused")}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center justify-between"
                  >
                    <span>AI Focused</span>
                    <span className="text-gray-500">40/60</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            disabled={isTestingConnection}
          >
            {isTestingConnection ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            ) : (
              <Settings className="w-4 h-4" />
            )}
            <span className="hidden sm:inline ml-1">Test</span>
          </Button>

          <Button
            variant={aiSuggestionsEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setAiSuggestionsEnabled(!aiSuggestionsEnabled)}
          >
            <Brain className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">AI</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Interactive Code Editor */}
        {(layoutMode === "split" || layoutMode === "editor-only") && (
          <div
            className={`${
              layoutMode === "split"
                ? "w-full min-w-0 lg:min-w-96" // Dynamic width on large screens, full width on mobile
                : "w-full"
            } flex flex-col border-r border-gray-200 bg-white`}
            style={{
              width: layoutMode === "split" ? `${editorWidth}%` : "100%"
            }}
          >
            {/* Editor Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-semibold text-gray-900">Interactive Code Editor</h2>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <span>•</span>
                  <span>{language}</span>
                  <span>•</span>
                  <span>{code.split('\n').length} lines</span>
                </div>
              </div>
            </div>

            <MonacoEditor
              value={code}
              onChange={handleCodeChange}
              language={language}
              theme={theme}
              aiSuggestionsEnabled={aiSuggestionsEnabled}
              onSuggestionApply={handleApplySuggestion}
            />
          </div>
        )}

        {/* Resize Handle */}
        {layoutMode === "split" && (
          <div
            className="hidden lg:block w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-colors duration-200 relative group"
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = editorWidth;

              const handleMouseMove = (e) => {
                const deltaX = e.clientX - startX;
                const containerWidth = e.target.closest('.flex').offsetWidth;
                const deltaPercent = (deltaX / containerWidth) * 100;
                const newWidth = Math.min(Math.max(startWidth + deltaPercent, 30), 80); // Limit between 30% and 80%
                setEditorWidth(newWidth);
              };

              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          >
            <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-500 group-hover:opacity-20"></div>
          </div>
        )}

        {/* AI Code Assistant Panel */}
        {(layoutMode === "split" || layoutMode === "suggestions-only") && (
          <div
            className={`${
              layoutMode === "split"
                ? "w-full min-w-0 lg:min-h-0 min-h-96" // Dynamic width on large screens, full width on mobile
                : "w-full"
            } bg-gray-50 flex flex-col`}
            style={{
              width: layoutMode === "split" ? `${100 - editorWidth}%` : "100%"
            }}
          >
            <AISuggestionProvider
              code={code}
              language={language}
              onApplySuggestion={handleApplySuggestion}
              onShowDiff={handleShowDiff}
              isVisible={aiSuggestionsEnabled}
            />
          </div>
        )}
      </div>

      {/* Diff Modal */}
      {showDiff && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl h-5/6 bg-white rounded-lg shadow-xl">
            <DiffViewer
              original={diffData.original}
              modified={diffData.modified}
              language={language}
              suggestion={diffData.suggestion}
              onAccept={handleAcceptDiff}
              onReject={handleRejectDiff}
              onCopy={(message) => showToast(message, "success")}
            />
          </div>
        </div>
      )}

      {/* Backend Setup Instructions Modal */}
      <BackendInstructions
        isVisible={showInstructions}
        onClose={() => setShowInstructions(false)}
      />
    </div>
  );
}
