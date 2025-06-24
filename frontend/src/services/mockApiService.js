// Mock API service for testing when backend is not available
// This simulates the backend responses for development/testing

export class MockApiService {
  static async mockApiRequest(endpoint, options = {}) {
    // Simulate network delay
    await new Promise((resolve) =>
      setTimeout(resolve, 500 + Math.random() * 1000),
    );

    const method = options.method || "GET";
    const body = options.body ? JSON.parse(options.body) : null;

    console.log(`🔧 Mock API: ${method} ${endpoint}`, body);

    switch (endpoint) {
      case "/api/llm/providers":
        return this.mockProviders();

      case "/api/llm/models":
        return this.mockModels();

      case "/api/llm/test-connection":
        return this.mockTestConnection(body);

      case "/api/llm/analyze":
        return this.mockAnalyze(body);

      case "/api/llm/chat":
        return this.mockChat(body);

      default:
        throw new Error(`Mock API: Endpoint ${endpoint} not implemented`);
    }
  }

  static mockProviders() {
    return {
      providers: {
        openai: {
          name: "OpenAI",
          models: [
            "gpt-4o",
            "gpt-4o-mini",
            "gpt-4-turbo",
            "gpt-4",
            "gpt-3.5-turbo",
          ],
          default_model: "gpt-4o-mini",
          api_key_env: "OPENAI_API_KEY",
          base_url: null,
          allow_custom: true,
        },
        anthropic: {
          name: "Anthropic",
          models: [
            "claude-3-5-sonnet-20241022",
            "claude-3-5-haiku-20241022",
            "claude-3-opus-20240229",
          ],
          default_model: "claude-3-5-sonnet-20241022",
          api_key_env: "ANTHROPIC_API_KEY",
          base_url: "https://api.anthropic.com/v1",
          allow_custom: true,
        },
      },
      default_provider: "openai",
    };
  }

  static mockModels() {
    return {
      provider: "openai",
      models: [
        "gpt-4o",
        "gpt-4o-mini",
        "gpt-4-turbo",
        "gpt-4",
        "gpt-3.5-turbo",
      ],
      default_model: "gpt-4o-mini",
    };
  }

  static mockTestConnection(body) {
    const { provider, api_key } = body || {};

    // Simulate API key validation
    if (!api_key && provider !== "ollama") {
      return {
        success: false,
        error: "API key is required",
      };
    }

    if (api_key && api_key.length < 10) {
      return {
        success: false,
        error: "Invalid API key format",
      };
    }

    return {
      success: true,
      message: "Connection test successful (Mock)",
      response: "Connection successful - using mock backend for testing",
      provider: provider || "openai",
      model: body?.model || "gpt-4o-mini",
    };
  }

  static mockAnalyze(body) {
    const { code, type, language } = body || {};

    if (!code) {
      throw new Error("Code content required");
    }

    // Generate mock analysis based on code content
    const analysis = this.generateMockAnalysis(code, language, type);

    return {
      analysis,
      type: type || "general",
      session_id: `mock_${Date.now()}`,
      provider: body?.provider || "openai",
      model: body?.model || "gpt-4o-mini (Mock)",
      tokens_used: Math.floor(code.length / 4), // Rough token estimate
      context_limit: 4096,
    };
  }

  static mockChat(body) {
    const { message } = body || {};

    if (!message) {
      throw new Error("Message required");
    }

    // Generate mock improvement based on message content
    let response = "";

    if (message.toLowerCase().includes("improve")) {
      response = this.generateMockImprovement(message);
    } else {
      response = `Here's a response to: "${message.substring(0, 100)}..."\n\nThis is a mock response for testing purposes. The actual AI would provide detailed analysis and suggestions here.`;
    }

    return {
      response,
      session_id: body?.session_id || `mock_chat_${Date.now()}`,
      provider: body?.provider || "openai",
      model: body?.model || "gpt-4o-mini (Mock)",
    };
  }

  static generateMockAnalysis(code, language, type) {
    const suggestions = [];

    // Basic code analysis patterns
    if (code.includes("function") || code.includes("def")) {
      suggestions.push(
        "Consider adding documentation comments to your functions",
      );
    }

    if (code.includes("console.log") || code.includes("print(")) {
      suggestions.push(
        "Consider using a proper logging library instead of console/print statements",
      );
    }

    if (code.length > 1000) {
      suggestions.push(
        "Consider breaking this large code block into smaller, more manageable functions",
      );
    }

    if (code.includes("var ")) {
      suggestions.push(
        "Consider using const/let instead of var for better scoping",
      );
    }

    if (!code.includes("//") && !code.includes("#") && !code.includes("/*")) {
      suggestions.push("Add comments to explain complex logic");
    }

    // Performance suggestions
    if (code.includes("for") && code.includes("for")) {
      suggestions.push(
        "Multiple loops detected - consider optimizing for performance",
      );
    }

    // Security suggestions
    if (code.includes("eval(") || code.includes("innerHTML")) {
      suggestions.push(
        "Potential security risk detected - avoid eval() and innerHTML",
      );
    }

    let analysis = `## Code Analysis Results (Mock)\n\n`;
    analysis += `**Language:** ${language || "Unknown"}\n`;
    analysis += `**Analysis Type:** ${type || "General"}\n`;
    analysis += `**Code Length:** ${code.length} characters\n\n`;

    if (suggestions.length > 0) {
      analysis += `### Suggestions:\n\n`;
      suggestions.forEach((suggestion, index) => {
        analysis += `${index + 1}. ${suggestion}\n`;
      });
    } else {
      analysis += `### Overall Assessment:\n\n`;
      analysis += `Your code looks good! This is a mock analysis for testing purposes.\n`;
      analysis += `The actual AI would provide detailed suggestions for improvement.\n`;
    }

    analysis += `\n### Note:\n`;
    analysis += `This is a mock response. Start the Python backend server to get real AI analysis.`;

    return analysis;
  }

  static generateMockImprovement(originalPrompt) {
    return `Here's an improved version of your code:\n\n\`\`\`javascript\n// Improved code would appear here\nfunction improvedFunction() {\n  // Better implementation\n  return 'This is a mock improvement';\n}\n\`\`\`\n\n**Improvements made:**\n- Added proper function structure\n- Improved naming conventions\n- Added comments\n\n*Note: This is a mock response for testing. Start the backend server for real AI improvements.*`;
  }
}

// Check if we should use mock API (when backend is not available)
export const shouldUseMockApi = async () => {
  try {
    // Try to reach the actual backend
    const response = await fetch("/api/llm/providers", {
      method: "GET",
      signal: AbortSignal.timeout(2000), // 2 second timeout
    });
    return !response.ok;
  } catch (error) {
    // If we can't reach the backend, use mock
    return true;
  }
};
