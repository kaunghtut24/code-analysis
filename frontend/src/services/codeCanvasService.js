import { apiRequest } from "@/lib/api";

export class CodeCanvasService {
  // Analyze code and get AI suggestions
  static async analyzeCode(code, language = "javascript") {
    try {
      const response = await apiRequest("/api/llm/analyze", {
        method: "POST",
        body: JSON.stringify({
          code,
          language,
          analysis_type: "improvement_suggestions",
        }),
      });
      return response;
    } catch (error) {
      console.error("Error analyzing code:", error);
      throw error;
    }
  }

  // Get specific code improvements for a selection
  static async getCodeImprovements(code, selection, language = "javascript") {
    try {
      const response = await apiRequest("/api/llm/improve", {
        method: "POST",
        body: JSON.stringify({
          code,
          selection,
          language,
          improvement_type: "refactor",
        }),
      });
      return response;
    } catch (error) {
      console.error("Error getting code improvements:", error);
      throw error;
    }
  }

  // Get real-time code suggestions as user types
  static async getSuggestions(code, cursorPosition, language = "javascript") {
    try {
      const response = await apiRequest("/api/llm/suggest", {
        method: "POST",
        body: JSON.stringify({
          code,
          cursor_position: cursorPosition,
          language,
          context: "code_completion",
        }),
      });
      return response;
    } catch (error) {
      console.error("Error getting suggestions:", error);
      throw error;
    }
  }

  // Check code for errors and issues
  static async validateCode(code, language = "javascript") {
    try {
      const response = await apiRequest("/api/llm/validate", {
        method: "POST",
        body: JSON.stringify({
          code,
          language,
          validation_type: "syntax_and_logic",
        }),
      });
      return response;
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
