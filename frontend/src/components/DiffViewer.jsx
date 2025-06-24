import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Check, X, Copy, Download } from "lucide-react";

export default function DiffViewer({
  original,
  modified,
  language = "javascript",
  onAccept,
  onReject,
  onCopy,
  suggestion = null,
  isVisible = true,
}) {
  const diffEditorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    diffEditorRef.current = editor;

    // Configure diff editor settings
    editor.updateOptions({
      fontSize: 14,
      lineHeight: 20,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      readOnly: true,
      renderSideBySide: true,
      ignoreTrimWhitespace: true,
      renderIndicators: true,
      originalEditable: false,
      modifiedEditable: false,
    });
  };

  const handleAccept = () => {
    if (onAccept) {
      onAccept(modified, suggestion);
    }
  };

  const handleReject = () => {
    if (onReject) {
      onReject(suggestion);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(modified);
      if (onCopy) {
        onCopy("Improved code copied to clipboard!");
      }
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([modified], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `improved_code.${getFileExtension(language)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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

  if (!isVisible) return null;

  return (
    <div className="flex flex-col h-full bg-white border rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Code Improvement Preview
          </h3>
          {suggestion && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              {suggestion.type || "AI Suggestion"}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex items-center space-x-1"
          >
            <Copy className="w-4 h-4" />
            <span>Copy</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex items-center space-x-1"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleReject}
            className="flex items-center space-x-1 text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4" />
            <span>Reject</span>
          </Button>

          <Button
            size="sm"
            onClick={handleAccept}
            className="flex items-center space-x-1 bg-green-600 hover:bg-green-700"
          >
            <Check className="w-4 h-4" />
            <span>Accept</span>
          </Button>
        </div>
      </div>

      {/* Suggestion Description */}
      {suggestion && suggestion.description && (
        <div className="p-4 bg-blue-50 border-b">
          <p className="text-sm text-blue-800">
            <strong>Improvement:</strong> {suggestion.description}
          </p>
          {suggestion.reasoning && (
            <p className="text-xs text-blue-600 mt-1">
              <strong>Reasoning:</strong> {suggestion.reasoning}
            </p>
          )}
        </div>
      )}

      {/* Diff Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={language}
          theme="vs"
          onMount={handleEditorDidMount}
          original={original}
          modified={modified}
          options={{
            selectOnLineNumbers: true,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineHeight: 20,
            minimap: { enabled: false },
            folding: true,
            lineNumbers: "on",
            renderWhitespace: "selection",
            tabSize: 2,
            insertSpaces: true,
            renderSideBySide: true,
            ignoreTrimWhitespace: false,
            renderIndicators: true,
            originalEditable: false,
            modifiedEditable: false,
            readOnly: true,
          }}
        />
      </div>

      {/* Footer with statistics */}
      <div className="p-3 bg-gray-50 border-t text-sm text-gray-600">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <span>Original: {original.split("\n").length} lines</span>
            <span>Modified: {modified.split("\n").length} lines</span>
            <span>
              Change:{" "}
              {modified.split("\n").length - original.split("\n").length > 0
                ? "+"
                : ""}
              {modified.split("\n").length - original.split("\n").length} lines
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-200 border border-red-400 rounded-sm"></div>
            <span className="text-xs">Removed</span>
            <div className="w-3 h-3 bg-green-200 border border-green-400 rounded-sm ml-4"></div>
            <span className="text-xs">Added</span>
          </div>
        </div>
      </div>
    </div>
  );
}
