import { apiRequest } from "@/lib/api";

export class CodeCanvasService {
  // Analyze code and get AI suggestions
  static async analyzeCode(code, language = "javascript") {
    try {
      const response = await apiRequest("/api/llm/analyze", {
        method: "POST",
        body: JSON.stringify({
          code,
          files: [
            { name: `code.${getFileExtension(language)}`, content: code },
          ],
          analysis_type: "code_improvement",
          language,
          provider: "openai",
          model: "gpt-4o-mini",
        }),
      });

      // Transform response to match expected format
      return {
        suggestions:
          response.suggestions || response.analysis?.suggestions || [],
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
      // Use the existing analyze endpoint with specific context
      const improvePrompt = `Please improve the following ${language} code:\n\n${selection.text || code}\n\nProvide the improved version with explanations.`;

      const response = await apiRequest("/api/llm/chat", {
        method: "POST",
        body: JSON.stringify({
          message: improvePrompt,
          session_id: `improve_${Date.now()}`,
          provider: "openai",
          model: "gpt-4o-mini",
        }),
      });

      return {
        improved_code: response.response || response.message,
        explanation: response.explanation,
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
      // Use analyze endpoint for suggestions
      const response = await apiRequest("/api/llm/analyze", {
        method: "POST",
        body: JSON.stringify({
          code,
          files: [
            { name: `code.${getFileExtension(language)}`, content: code },
          ],
          analysis_type: "suggestions",
          language,
          provider: "openai",
          model: "gpt-4o-mini",
        }),
      });

      return {
        quickFix: response.quickFix,
        suggestions: response.suggestions || [],
      };
    } catch (error) {
      console.error("Error getting suggestions:", error);
      return { quickFix: null, suggestions: [] };
    }
  }

  // Check code for errors and issues
  static async validateCode(code, language = "javascript") {
    try {
      const response = await apiRequest("/api/llm/analyze", {
        method: "POST",
        body: JSON.stringify({
          code,
          files: [
            { name: `code.${getFileExtension(language)}`, content: code },
          ],
          analysis_type: "validation",
          language,
          provider: "openai",
          model: "gpt-4o-mini",
        }),
      });

      return {
        errors: response.errors || [],
        warnings: response.warnings || [],
        suggestions: response.suggestions || [],
      };
    } catch (error) {
      console.error("Error validating code:", error);
      throw error;
    }
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
