import { useState, useEffect } from "react";
import { useToastNotifications } from "@/hooks/useToastNotifications";
import { settingsService } from "@/services/settingsService";
import MonacoEditor from "./MonacoEditor";
import AISuggestionProvider from "./AISuggestionProvider";
import DiffViewer from "./DiffViewer";
import MobileHeader from "./MobileHeader";
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
  const { showToast } = useToastNotifications();

  // Initialize with default code
  useEffect(() => {
    setCode(DEFAULT_CODE[language] || DEFAULT_CODE.javascript);
  }, [language]);

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

  // Handle suggestion application
  const handleApplySuggestion = (improvedCode, suggestion) => {
    setCode(improvedCode);
    showToast(
      `Applied AI suggestion: ${suggestion?.title || "Code improvement"}`,
      "success",
    );
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

  // Toggle layout modes
  const toggleLayout = () => {
    const modes = ["split", "editor-only", "suggestions-only"];
    const currentIndex = modes.indexOf(layoutMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setLayoutMode(modes[nextIndex]);
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

          <Button
            variant="outline"
            size="sm"
            onClick={toggleLayout}
            title={`Layout: ${layoutMode}`}
          >
            {getLayoutIcon()}
          </Button>

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
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        {(layoutMode === "split" || layoutMode === "editor-only") && (
          <div
            className={`${layoutMode === "split" ? "flex-1" : "w-full"} flex flex-col`}
          >
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

        {/* Suggestions Panel */}
        {(layoutMode === "split" || layoutMode === "suggestions-only") && (
          <div
            className={`${layoutMode === "split" ? "w-80" : "w-full"} border-l`}
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
    </div>
  );
}
