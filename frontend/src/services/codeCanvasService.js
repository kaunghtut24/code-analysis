import { apiRequest } from "@/lib/api";

// Helper function to get file extension for languages
const getFileExtension = (language) => {
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
  return extensions[language] || "txt";
};

export class CodeCanvasService {
  // Get current LLM configuration from localStorage
  static getLLMConfig() {
    const provider = localStorage.getItem("llmProvider") || "openai";
    const model = localStorage.getItem("llmModel") || "gpt-4o-mini";
    const temperature = parseFloat(localStorage.getItem("temperature")) || 0.7;
    const maxTokens = localStorage.getItem("maxTokens") || "";

    // Get API key based on provider
    const apiKeyMap = {
      openai: localStorage.getItem("openaiKey"),
      anthropic: localStorage.getItem("anthropicKey"),
      azure: localStorage.getItem("azureKey"),
      ollama: localStorage.getItem("ollamaKey"),
      custom: localStorage.getItem("customKey"),
    };

    const apiKey = apiKeyMap[provider] || "";
    const customBaseUrl = localStorage.getItem("customBaseUrl") || "";

    return {
      provider,
      model,
      api_key: apiKey,
      base_url: customBaseUrl || undefined,
      temperature,
      max_tokens: maxTokens ? parseInt(maxTokens) : undefined,
    };
  }

  // Analyze code and get AI suggestions
  static async analyzeCode(code, language = "javascript") {
    try {
      const config = this.getLLMConfig();

      const response = await apiRequest("/api/llm/analyze", {
        method: "POST",
        body: JSON.stringify({
          code,
          files: [
            { name: `code.${getFileExtension(language)}`, content: code },
          ],
          type: "code_improvement",
          language,
          session_id: `analyze_${Date.now()}`,
          ...config,
        }),
      });

      // Parse the analysis text to extract suggestions
      const suggestions = this.parseAnalysisForSuggestions(
        response.analysis,
        language,
      );

      return {
        suggestions,
        analysis: response.analysis,
        session_id: response.session_id,
      };
    } catch (error) {
      console.error("Error analyzing code:", error);
      throw error;
    }
  }

  // Get specific code improvements for a selection
  static async getCodeImprovements(code, selection, language = "javascript") {
    try {
      const config = this.getLLMConfig();

      // Use the existing chat endpoint with specific improvement prompt
      const improvePrompt = `Please improve the following ${language} code and provide ONLY the improved code without explanations:\n\n${selection.text || code}`;

      const response = await apiRequest("/api/llm/chat", {
        method: "POST",
        body: JSON.stringify({
          message: improvePrompt,
          session_id: `improve_${Date.now()}`,
          ...config,
        }),
      });

      return {
        improved_code: response.response || response.message,
        explanation: `Improved ${language} code`,
        session_id: response.session_id,
      };
    } catch (error) {
      console.error("Error getting code improvements:", error);
      throw error;
    }
  }

  // Get real-time code suggestions as user types
  static async getSuggestions(code, cursorPosition, language = "javascript") {
    try {
      const config = this.getLLMConfig();

      // Use analyze endpoint for suggestions
      const response = await apiRequest("/api/llm/analyze", {
        method: "POST",
        body: JSON.stringify({
          code,
          type: "suggestions",
          language,
          session_id: `suggestions_${Date.now()}`,
          ...config,
        }),
      });

      return {
        quickFix: { message: "AI suggestions available" },
        suggestions: this.parseAnalysisForSuggestions(
          response.analysis,
          language,
        ),
      };
    } catch (error) {
      console.error("Error getting suggestions:", error);
      return { quickFix: null, suggestions: [] };
    }
  }

  // Check code for errors and issues
  static async validateCode(code, language = "javascript") {
    try {
      const config = this.getLLMConfig();

      const response = await apiRequest("/api/llm/analyze", {
        method: "POST",
        body: JSON.stringify({
          code,
          type: "validation",
          language,
          session_id: `validate_${Date.now()}`,
          ...config,
        }),
      });

      const suggestions = this.parseAnalysisForSuggestions(
        response.analysis,
        language,
      );

      return {
        errors: suggestions.filter((s) => s.severity === "error"),
        warnings: suggestions.filter((s) => s.severity === "warning"),
        suggestions: suggestions.filter(
          (s) => s.severity === "info" || s.severity === "improvement",
        ),
      };
    } catch (error) {
      console.error("Error validating code:", error);
      throw error;
    }
  }

  // Parse AI analysis text to extract structured suggestions
  static parseAnalysisForSuggestions(analysisText, language) {
    if (!analysisText) return [];

    const suggestions = [];
    const lines = analysisText.split("\n");

    let currentSuggestion = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Look for common patterns in AI responses
      if (line.match(/^(\d+\.|\-|\*)/)) {
        if (currentSuggestion) {
          suggestions.push(currentSuggestion);
        }

        currentSuggestion = {
          title: line.replace(/^(\d+\.|\-|\*)/, "").trim(),
          message: line.replace(/^(\d+\.|\-|\*)/, "").trim(),
          description: "",
          type: this.inferSuggestionType(line),
          severity: this.inferSeverity(line),
          line: Math.floor(Math.random() * 10) + 1, // Random line for demo
          reasoning: "",
          code_snippet: "",
        };
      } else if (currentSuggestion && line) {
        currentSuggestion.description += line + " ";
        if (
          line.toLowerCase().includes("because") ||
          line.toLowerCase().includes("reason")
        ) {
          currentSuggestion.reasoning += line + " ";
        }
      }
    }

    if (currentSuggestion) {
      suggestions.push(currentSuggestion);
    }

    // If no structured suggestions found, create a general one
    if (suggestions.length === 0 && analysisText.length > 10) {
      suggestions.push({
        title: "AI Analysis Available",
        message: "Code analysis completed successfully",
        description: analysisText.substring(0, 200) + "...",
        type: "general",
        severity: "info",
        line: 1,
        reasoning: "Based on AI analysis",
        code_snippet: "",
      });
    }

    return suggestions;
  }

  // Infer suggestion type from text
  static inferSuggestionType(text) {
    const lowerText = text.toLowerCase();
    if (
      lowerText.includes("performance") ||
      lowerText.includes("optimize") ||
      lowerText.includes("slow")
    ) {
      return "performance";
    }
    if (
      lowerText.includes("security") ||
      lowerText.includes("vulnerability") ||
      lowerText.includes("attack")
    ) {
      return "security";
    }
    if (
      lowerText.includes("refactor") ||
      lowerText.includes("restructure") ||
      lowerText.includes("organize")
    ) {
      return "refactor";
    }
    if (
      lowerText.includes("best practice") ||
      lowerText.includes("convention") ||
      lowerText.includes("standard")
    ) {
      return "best_practice";
    }
    return "general";
  }

  // Infer severity from text
  static inferSeverity(text) {
    const lowerText = text.toLowerCase();
    if (
      lowerText.includes("error") ||
      lowerText.includes("bug") ||
      lowerText.includes("critical") ||
      lowerText.includes("fail")
    ) {
      return "error";
    }
    if (
      lowerText.includes("warning") ||
      lowerText.includes("caution") ||
      lowerText.includes("potential")
    ) {
      return "warning";
    }
    if (
      lowerText.includes("improve") ||
      lowerText.includes("enhance") ||
      lowerText.includes("optimize")
    ) {
      return "improvement";
    }
    return "info";
  }

  // Get smart suggestions based on code patterns and context
  static async getSmartSuggestions(code, language = "javascript") {
    try {
      const config = this.getLLMConfig();

      const smartPrompt = `Analyze this ${language} code and provide smart, contextual suggestions for improvements, optimizations, and best practices. Focus on practical, actionable advice:\n\n${code}`;

      const response = await apiRequest("/api/llm/chat", {
        method: "POST",
        body: JSON.stringify({
          message: smartPrompt,
          session_id: `smart_${Date.now()}`,
          ...config,
        }),
      });

      return {
        suggestions: this.parseSmartSuggestions(response.response || response.message),
        session_id: response.session_id,
      };
    } catch (error) {
      console.error("Error getting smart suggestions:", error);
      return { suggestions: [] };
    }
  }

  // Get contextual hints based on current code context
  static async getContextualHints(code, language = "javascript") {
    try {
      const config = this.getLLMConfig();

      const hintPrompt = `Provide contextual hints and tips for this ${language} code. Focus on language-specific best practices, common patterns, and helpful shortcuts:\n\n${code}`;

      const response = await apiRequest("/api/llm/chat", {
        method: "POST",
        body: JSON.stringify({
          message: hintPrompt,
          session_id: `hints_${Date.now()}`,
          ...config,
        }),
      });

      return {
        hints: this.parseContextualHints(response.response || response.message),
        session_id: response.session_id,
      };
    } catch (error) {
      console.error("Error getting contextual hints:", error);
      return { hints: [] };
    }
  }

  // Parse smart suggestions from AI response
  static parseSmartSuggestions(text) {
    const suggestions = [];
    const lines = text.split('\n').filter(line => line.trim());

    lines.forEach(line => {
      if (line.match(/^[\d\-\*]/)) {
        suggestions.push({
          message: line.replace(/^[\d\-\*\.\s]+/, '').trim(),
          type: 'smart',
          confidence: 0.8
        });
      }
    });

    return suggestions.slice(0, 5); // Limit to 5 smart suggestions
  }

  // Parse contextual hints from AI response
  static parseContextualHints(text) {
    const hints = [];
    const lines = text.split('\n').filter(line => line.trim());

    lines.forEach(line => {
      if (line.match(/^[\d\-\*]/)) {
        hints.push({
          message: line.replace(/^[\d\-\*\.\s]+/, '').trim(),
          type: 'hint',
          category: 'general'
        });
      }
    });

    return hints.slice(0, 3); // Limit to 3 hints
  }

  // Apply AI suggested changes to code
  static applyChanges(originalCode, changes) {
    let modifiedCode = originalCode;

    // Sort changes by position (reverse order to maintain positions)
    const sortedChanges = [...changes].sort(
      (a, b) => b.startLine - a.startLine,
    );

    for (const change of sortedChanges) {
      const lines = modifiedCode.split("\n");

      switch (change.type) {
        case "replace":
          lines.splice(
            change.startLine - 1,
            change.endLine - change.startLine + 1,
            ...change.newContent.split("\n"),
          );
          break;
        case "insert":
          lines.splice(
            change.startLine - 1,
            0,
            ...change.newContent.split("\n"),
          );
          break;
        case "delete":
          lines.splice(
            change.startLine - 1,
            change.endLine - change.startLine + 1,
          );
          break;
      }

      modifiedCode = lines.join("\n");
    }

    return modifiedCode;
  }
}

// Debounce utility for real-time analysis
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
