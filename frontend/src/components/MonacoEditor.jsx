import { useRef, useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { CodeCanvasService, debounce } from "@/services/codeCanvasService";

export default function MonacoEditor({
  value,
  onChange,
  language = "javascript",
  theme = "vs-dark",
  aiSuggestionsEnabled = true,
  onSuggestionApply,
}) {
  const editorRef = useRef(null);
  const [decorations, setDecorations] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Handle editor mount
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    // Configure editor settings
    editor.updateOptions({
      fontSize: 14,
      lineHeight: 20,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      suggestOnTriggerCharacters: true,
      quickSuggestions: true,
      wordBasedSuggestions: true,
    });

    // Add custom actions
    editor.addAction({
      id: "ai-improve-selection",
      label: "AI: Improve Selection",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI],
      contextMenuGroupId: "navigation",
      contextMenuOrder: 1.5,
      run: handleImproveSelection,
    });

    editor.addAction({
      id: "ai-explain-code",
      label: "AI: Explain Code",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyE],
      contextMenuGroupId: "navigation",
      contextMenuOrder: 1.6,
      run: handleExplainCode,
    });

    // Setup AI suggestion provider
    if (aiSuggestionsEnabled) {
      setupAISuggestions(editor, monaco);
    }
  };

  // Setup AI suggestions
  const setupAISuggestions = (editor, monaco) => {
    // Debounced analysis function
    const debouncedAnalyze = debounce(async () => {
      if (!value || isAnalyzing) return;

      setIsAnalyzing(true);
      try {
        const analysis = await CodeCanvasService.analyzeCode(value, language);
        updateEditorDecorations(editor, monaco, analysis.suggestions || []);
        setSuggestions(analysis.suggestions || []);
      } catch (error) {
        console.error("AI analysis failed:", error);
      } finally {
        setIsAnalyzing(false);
      }
    }, 1500);

    // Listen for content changes
    editor.onDidChangeModelContent(() => {
      debouncedAnalyze();
    });

    // Listen for cursor position changes for contextual suggestions
    editor.onDidChangeCursorPosition(async (e) => {
      if (!aiSuggestionsEnabled) return;

      try {
        const position = e.position;
        const contextSuggestions = await CodeCanvasService.getSuggestions(
          value,
          { line: position.lineNumber, column: position.column },
          language,
        );

        // Add hover provider for AI suggestions
        if (contextSuggestions.quickFix) {
          addQuickFixProvider(
            editor,
            monaco,
            position,
            contextSuggestions.quickFix,
          );
        }
      } catch (error) {
        console.error("Context suggestions failed:", error);
      }
    });
  };

  // Update editor decorations with AI suggestions
  const updateEditorDecorations = (editor, monaco, suggestions) => {
    const newDecorations = suggestions.map((suggestion) => ({
      range: new monaco.Range(
        suggestion.line,
        suggestion.startColumn || 1,
        suggestion.line,
        suggestion.endColumn || 100,
      ),
      options: {
        className: getSuggestionClassName(suggestion.severity),
        hoverMessage: {
          value: `**AI Suggestion**: ${suggestion.message}\n\n*Click to apply: ${suggestion.fix}*`,
        },
        glyphMarginClassName: "ai-suggestion-glyph",
        glyphMarginHoverMessage: {
          value: "AI Improvement Available",
        },
      },
    }));

    const decorationIds = editor.deltaDecorations(decorations, newDecorations);
    setDecorations(decorationIds);
  };

  // Get CSS class for suggestion severity
  const getSuggestionClassName = (severity) => {
    switch (severity) {
      case "error":
        return "ai-suggestion-error";
      case "warning":
        return "ai-suggestion-warning";
      case "info":
        return "ai-suggestion-info";
      case "improvement":
        return "ai-suggestion-improvement";
      default:
        return "ai-suggestion-info";
    }
  };

  // Add quick fix provider
  const addQuickFixProvider = (editor, monaco, position, quickFix) => {
    const model = editor.getModel();
    if (!model) return;

    // Create marker for quick fix
    monaco.editor.setModelMarkers(model, "ai-quickfix", [
      {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column + 1,
        message: quickFix.message,
        severity: monaco.MarkerSeverity.Info,
      },
    ]);
  };

  // Handle improve selection action
  const handleImproveSelection = async () => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = editor.getSelection();
    const selectedText = editor.getModel().getValueInRange(selection);

    if (!selectedText.trim()) {
      // If no selection, analyze the current line
      const position = editor.getPosition();
      const line = editor.getModel().getLineContent(position.lineNumber);

      try {
        const improvement = await CodeCanvasService.getCodeImprovements(
          value,
          {
            text: line,
            line: position.lineNumber,
          },
          language,
        );

        if (improvement.improved_code) {
          applyImprovement(editor, improvement, position.lineNumber);
        }
      } catch (error) {
        console.error("Failed to improve code:", error);
      }
    } else {
      // Improve selected text
      try {
        const improvement = await CodeCanvasService.getCodeImprovements(
          value,
          {
            text: selectedText,
            startLine: selection.startLineNumber,
            endLine: selection.endLineNumber,
          },
          language,
        );

        if (improvement.improved_code) {
          editor.executeEdits("ai-improvement", [
            {
              range: selection,
              text: improvement.improved_code,
            },
          ]);

          if (onSuggestionApply) {
            onSuggestionApply(improvement);
          }
        }
      } catch (error) {
        console.error("Failed to improve selection:", error);
      }
    }
  };

  // Handle explain code action
  const handleExplainCode = async () => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = editor.getSelection();
    const selectedText = editor.getModel().getValueInRange(selection);

    if (selectedText.trim()) {
      // Create explanation popup or sidebar
      try {
        const explanation = await CodeCanvasService.analyzeCode(
          selectedText,
          language,
        );
        // You can implement a modal or sidebar to show explanation
        console.log("Code explanation:", explanation);
      } catch (error) {
        console.error("Failed to explain code:", error);
      }
    }
  };

  // Apply AI improvement
  const applyImprovement = (editor, improvement, lineNumber) => {
    const line = editor.getModel().getLineContent(lineNumber);
    const range = {
      startLineNumber: lineNumber,
      startColumn: 1,
      endLineNumber: lineNumber,
      endColumn: line.length + 1,
    };

    editor.executeEdits("ai-improvement", [
      {
        range,
        text: improvement.improved_code,
      },
    ]);

    if (onSuggestionApply) {
      onSuggestionApply(improvement);
    }
  };

  // Add custom CSS for AI suggestions
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .ai-suggestion-error {
        background-color: rgba(255, 0, 0, 0.2);
        border-bottom: 2px solid #ff0000;
      }
      .ai-suggestion-warning {
        background-color: rgba(255, 165, 0, 0.2);
        border-bottom: 2px solid #ffa500;
      }
      .ai-suggestion-info {
        background-color: rgba(0, 123, 255, 0.2);
        border-bottom: 2px solid #007bff;
      }
      .ai-suggestion-improvement {
        background-color: rgba(40, 167, 69, 0.2);
        border-bottom: 2px solid #28a745;
      }
      .ai-suggestion-glyph {
        background-color: #007bff;
        border-radius: 50%;
        width: 8px;
        height: 8px;
        margin-left: 4px;
        margin-top: 6px;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <Editor
        value={value}
        onChange={onChange}
        language={language}
        theme={theme}
        onMount={handleEditorDidMount}
        options={{
          selectOnLineNumbers: true,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          fontSize: 14,
          lineHeight: 20,
          minimap: { enabled: true },
          folding: true,
          lineNumbers: "on",
          renderWhitespace: "selection",
          tabSize: 2,
          insertSpaces: true,
        }}
      />

      {isAnalyzing && (
        <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-md text-sm">
          AI Analyzing...
        </div>
      )}
    </div>
  );
}
