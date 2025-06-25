import { apiRequest } from "@/lib/api";

// Cache for storing analysis results to save tokens
class AnalysisCache {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 100; // Maximum number of cached analyses
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
    this.hitCount = 0;
    this.missCount = 0;
  }

  // Generate cache key based on code content and settings
  generateKey(code, language, provider, model, baseUrl = '') {
    const codeHash = this.hashCode(code);
    const urlHash = baseUrl ? `_${this.hashCode(baseUrl)}` : '';
    return `${codeHash}_${language}_${provider}_${model}${urlHash}`;
  }

  // Simple hash function for code content
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Get cached analysis if available and not expired
  get(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('✅ Using cached analysis result - saving tokens!');
      this.hitCount++;
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key); // Remove expired cache
    }
    this.missCount++;
    return null;
  }

  // Store analysis result in cache
  set(key, data) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    console.log(`💾 Cached analysis result (${this.cache.size}/${this.maxCacheSize})`);
  }

  // Clear cache
  clear() {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  // Clear cache for specific code (for refresh functionality)
  clearForCode(code, language, provider, model, baseUrl) {
    const keyToRemove = this.generateKey(code, language, provider, model, baseUrl);
    if (this.cache.has(keyToRemove)) {
      this.cache.delete(keyToRemove);
      console.log('🗑️ Cleared cache for current code');
    }
  }

  // Get cache statistics
  getStats() {
    const total = this.hitCount + this.missCount;
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: total > 0 ? (this.hitCount / total * 100).toFixed(1) : 0,
      hits: this.hitCount,
      misses: this.missCount
    };
  }
}

// Global cache instance
const analysisCache = new AnalysisCache();

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
  // Request queue to prevent concurrent Ollama requests
  static requestQueue = [];
  static isProcessingQueue = false;

  // Add request to queue for Ollama to prevent concurrent issues
  static async queueRequest(requestFn) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ requestFn, resolve, reject });
      this.processQueue();
    });
  }

  // Process queued requests one at a time for Ollama
  static async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const { requestFn, resolve, reject } = this.requestQueue.shift();

      try {
        const result = await requestFn();
        resolve(result);
      } catch (error) {
        reject(error);
      }

      // Small delay between requests to prevent overwhelming Ollama
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    this.isProcessingQueue = false;
  }

  // Get current LLM configuration from localStorage
  static getLLMConfig() {
    const provider = localStorage.getItem("llmProvider") || "openai";
    const baseModel = localStorage.getItem("llmModel") || "gpt-4o-mini";
    const customModel = localStorage.getItem("customModel") || "";
    const useCustomModel = localStorage.getItem("useCustomModel") === "true";
    const temperature = parseFloat(localStorage.getItem("temperature")) || 0.7;
    const maxTokens = localStorage.getItem("maxTokens") || "";

    // Use custom model if enabled and available, otherwise use base model
    const model = useCustomModel && customModel ? customModel : baseModel;

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

    // For Ollama, set the correct base URL
    let baseUrl = customBaseUrl;
    if (provider === 'ollama' && !baseUrl) {
      baseUrl = 'http://localhost:11434/v1';
    }

    const config = {
      provider,
      model,
      api_key: apiKey,
      base_url: baseUrl || undefined,
      temperature,
    };

    // Only add max_tokens if it's a valid number
    if (maxTokens && !isNaN(parseInt(maxTokens))) {
      config.max_tokens = parseInt(maxTokens);
    }

    // Debug logging for Ollama (updated)
    if (provider === 'ollama') {
      console.log('🔧 Ollama Config (Fixed):', {
        provider: config.provider,
        model: config.model,
        baseModel: baseModel,
        customModel: customModel,
        useCustomModel: useCustomModel,
        base_url: config.base_url,
        hasApiKey: !!config.api_key,
        maxTokens: config.max_tokens
      });
    }

    return config;
  }

  // Clear cache for refresh functionality
  static clearCacheForCode(code, language = "javascript") {
    const config = this.getLLMConfig();
    analysisCache.clearForCode(code, language, config.provider, config.model, config.base_url);
  }

  // Check if real AI is available (API key configured or local model)
  static isRealAIAvailable() {
    const config = this.getLLMConfig();

    // Local models that don't require API keys
    const localProviders = ['ollama'];

    // For local providers, just check if provider is configured
    if (localProviders.includes(config.provider)) {
      console.log(`✅ Using local AI provider: ${config.provider}`);
      return true;
    }

    // For cloud providers, check if API key is configured
    const hasApiKey = config.api_key && config.api_key.trim() !== '';
    if (hasApiKey) {
      console.log(`✅ Using cloud AI provider: ${config.provider}`);
      return true;
    }

    console.log(`❌ No AI configured - provider: ${config.provider}, hasApiKey: ${hasApiKey}`);
    return false;
  }

  // Check if provider requires API key
  static requiresApiKey(provider) {
    const localProviders = ['ollama'];
    return !localProviders.includes(provider);
  }

  // Analyze code and get AI suggestions with caching
  static async analyzeCode(code, language = "javascript") {
    try {
      const config = this.getLLMConfig();

      // Check if real AI is available
      if (!this.isRealAIAvailable()) {
        console.log('🔄 No AI configured - using demo suggestions');
        return this.getDemoAnalysis(code, language);
      }

      // Generate cache key (include base_url for local models)
      const cacheKey = analysisCache.generateKey(
        code,
        language,
        config.provider,
        config.model,
        config.base_url // Include base URL for local models like Ollama
      );

      // Check cache first to save tokens
      const cachedResult = analysisCache.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      const isLocal = !this.requiresApiKey(config.provider);
      console.log(`🤖 Making ${isLocal ? 'local' : 'cloud'} AI API call for code analysis (${config.provider}/${config.model})`);
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
          use_cache: true, // Tell backend to use caching too
          ...config,
        }),
      });

      // Parse the analysis text to extract suggestions
      const suggestions = this.parseAnalysisForSuggestions(
        response.analysis,
        language,
      );

      const result = {
        suggestions,
        analysis: response.analysis,
        session_id: response.session_id,
        cached: false,
        provider: config.provider,
        model: config.model
      };

      // Cache the result to save tokens for future requests
      analysisCache.set(cacheKey, result);

      return result;
    } catch (error) {
      console.error("Error analyzing code:", error);

      // Enhanced error handling for Ollama
      if (config.provider === 'ollama') {
        const errorMessage = error.message || '';
        console.log('🔧 Ollama Error Details:', {
          error: errorMessage,
          model: config.model,
          provider: config.provider,
          baseUrl: config.base_url
        });

        if (errorMessage.includes('model') && errorMessage.includes('not found')) {
          console.log(`❌ Ollama model "${config.model}" not found. Please run: ollama pull ${config.model}`);
          return this.getOllamaModelNotFoundAnalysis(code, language, config.model);
        } else if (errorMessage.includes('Connection') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('500')) {
          console.log('❌ Ollama server not accessible. Please ensure Ollama is running on http://localhost:11434');
          return this.getOllamaNotRunningAnalysis(code, language);
        }
      }

      console.log('🔄 Falling back to demo suggestions due to error');
      // Fallback to demo suggestions if real AI fails
      return this.getDemoAnalysis(code, language);
    }
  }

  // Get specific code improvements for a selection with caching
  static async getCodeImprovements(code, selection, language = "javascript") {
    try {
      const config = this.getLLMConfig();

      // Check if real AI is available
      if (!this.isRealAIAvailable()) {
        console.log('🔄 No AI configured - generating demo improvement');
        return this.getDemoImprovement(code, selection, language);
      }

      // Generate cache key for improvements
      const improvementText = selection.text || code;
      const cacheKey = analysisCache.generateKey(
        `improve_${improvementText}`,
        language,
        config.provider,
        config.model,
        config.base_url // Include base URL for local models
      );

      // Check cache first
      const cachedResult = analysisCache.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      const isLocal = !this.requiresApiKey(config.provider);
      console.log(`🤖 Making ${isLocal ? 'local' : 'cloud'} AI API call for code improvement (${config.provider}/${config.model})`);

      // Create language-specific improvement prompt
      const improvePrompt = this.createImprovementPrompt(improvementText, selection, language);

      // Use queue for Ollama to prevent concurrent request issues
      const requestData = {
        message: improvePrompt,
        session_id: `improve_${Date.now()}`,
        ...config,
      };

      const makeRequest = async () => {
        return await apiRequest("/api/llm/chat", {
          method: "POST",
          body: JSON.stringify(requestData),
        });
      };

      const response = config.provider === 'ollama'
        ? await this.queueRequest(makeRequest)
        : await makeRequest();

      const result = {
        improved_code: response.response || response.message,
        explanation: `Improved ${language} code using ${config.provider}/${config.model}`,
        session_id: response.session_id,
        cached: false,
        provider: config.provider,
        model: config.model
      };

      // Cache the improvement result
      analysisCache.set(cacheKey, result);

      return result;
    } catch (error) {
      console.error("Error getting code improvements:", error);
      console.log('🔄 Falling back to demo improvement due to error');
      // Fallback to demo improvement
      return this.getDemoImprovement(code, selection, language);
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

  // Create language-specific improvement prompt
  static createImprovementPrompt(code, selection, language) {
    const languageRules = {
      javascript: {
        rules: [
          "Use modern ES6+ syntax (const/let, arrow functions, destructuring)",
          "Follow async/await patterns for promises",
          "Use proper error handling with try-catch",
          "Avoid var declarations",
          "Use template literals for string interpolation",
          "Follow camelCase naming conventions"
        ],
        patterns: "React hooks, functional components, modern JavaScript patterns"
      },
      python: {
        rules: [
          "Follow PEP 8 style guidelines",
          "Use type hints where appropriate",
          "Use list/dict comprehensions when suitable",
          "Follow snake_case naming conventions",
          "Use context managers for resource handling",
          "Add proper docstrings"
        ],
        patterns: "Pythonic idioms, proper exception handling, clean code practices"
      },
      java: {
        rules: [
          "Follow Java naming conventions (camelCase for methods, PascalCase for classes)",
          "Use proper access modifiers",
          "Implement proper exception handling",
          "Use generics where appropriate",
          "Follow SOLID principles",
          "Use try-with-resources for resource management"
        ],
        patterns: "Object-oriented design, proper encapsulation, clean architecture"
      },
      cpp: {
        rules: [
          "Use modern C++11/14/17/20 features",
          "Prefer smart pointers over raw pointers",
          "Use RAII principles",
          "Follow const-correctness",
          "Use range-based for loops",
          "Avoid memory leaks"
        ],
        patterns: "Modern C++ idioms, memory safety, performance optimization"
      }
    };

    const langConfig = languageRules[language] || languageRules.javascript;
    const suggestionType = selection.type || 'general improvement';

    return `Please improve the following ${language} code following these specific rules:

${langConfig.rules.map(rule => `- ${rule}`).join('\n')}

Focus on: ${langConfig.patterns}
Improvement type: ${suggestionType}

Original code:
\`\`\`${language}
${code}
\`\`\`

Please provide ONLY the improved code without explanations. Ensure the code follows ${language} best practices and is production-ready.`;
  }

  // Ollama model not found error analysis
  static getOllamaModelNotFoundAnalysis(code, language, modelName) {
    console.log(`🎭 Generating demo analysis - Ollama model "${modelName}" not found`);

    const suggestions = this.generateLanguageSpecificSuggestions(code, language);

    return {
      suggestions,
      analysis: `Demo analysis for ${language} code. The Ollama model "${modelName}" was not found. Please run "ollama pull ${modelName}" to download the model, then try again.`,
      session_id: `ollama_model_missing_${Date.now()}`,
      cached: false,
      provider: 'demo',
      model: 'fallback',
      error_type: 'model_not_found',
      error_message: `Please run: ollama pull ${modelName}`
    };
  }

  // Ollama not running error analysis
  static getOllamaNotRunningAnalysis(code, language) {
    console.log('🎭 Generating demo analysis - Ollama server not accessible');

    const suggestions = this.generateLanguageSpecificSuggestions(code, language);

    return {
      suggestions,
      analysis: `Demo analysis for ${language} code. Ollama server is not accessible. Please ensure Ollama is running on http://localhost:11434, then try again.`,
      session_id: `ollama_not_running_${Date.now()}`,
      cached: false,
      provider: 'demo',
      model: 'fallback',
      error_type: 'server_not_running',
      error_message: 'Please start Ollama server: ollama serve'
    };
  }

  // Demo analysis fallback when real AI is not available
  static getDemoAnalysis(code, language) {
    console.log('🎭 Generating demo analysis - configure AI provider (API key or local model) for real AI suggestions');

    const suggestions = this.generateLanguageSpecificSuggestions(code, language);

    return {
      suggestions,
      analysis: `Demo analysis for ${language} code. Configure an AI provider (API key or local model like Ollama) in Settings for real AI-powered suggestions.`,
      session_id: `demo_${Date.now()}`,
      cached: false,
      provider: 'demo',
      model: 'fallback'
    };
  }

  // Demo improvement fallback
  static getDemoImprovement(code, selection, language) {
    console.log('🎭 Generating demo improvement - configure AI provider (API key or local model) for real AI improvements');

    const improvedCode = this.generateLanguageSpecificImprovement(code, selection, language);

    return {
      improved_code: improvedCode,
      explanation: `Demo improvement for ${language} code. Configure an AI provider (API key or local model like Ollama) in Settings for real AI-powered improvements.`,
      session_id: `demo_improve_${Date.now()}`,
      cached: false,
      provider: 'demo',
      model: 'fallback'
    };
  }

  // Generate language-specific suggestions based on code analysis
  static generateLanguageSpecificSuggestions(code, language) {
    const suggestions = [];
    const codeLines = code.split('\n');

    // Language-specific analysis
    switch (language) {
      case 'javascript':
        suggestions.push(...this.analyzeJavaScript(code, codeLines));
        break;
      case 'python':
        suggestions.push(...this.analyzePython(code, codeLines));
        break;
      case 'java':
        suggestions.push(...this.analyzeJava(code, codeLines));
        break;
      case 'cpp':
      case 'c':
        suggestions.push(...this.analyzeCpp(code, codeLines));
        break;
      default:
        suggestions.push(...this.analyzeGeneric(code, codeLines));
    }

    return suggestions.slice(0, 4); // Limit to 4 suggestions
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

      // Check if real AI is available
      if (!this.isRealAIAvailable()) {
        console.log('🎭 Generating demo smart suggestions - no AI configured');
        return {
          suggestions: this.generateDemoSmartSuggestions(code, language)
        };
      }

      const smartPrompt = `Analyze this ${language} code and provide smart, contextual suggestions for improvements, optimizations, and best practices. Focus on practical, actionable advice:\n\n${code}`;

      const requestData = {
        message: smartPrompt,
        session_id: `smart_${Date.now()}`,
        ...config,
      };

      // Debug logging for problematic requests
      if (config.provider === 'ollama') {
        console.log('🔍 Smart Suggestions Request:', {
          messageLength: smartPrompt.length,
          sessionId: requestData.session_id,
          provider: requestData.provider,
          model: requestData.model,
          hasBaseUrl: !!requestData.base_url
        });
      }

      // Use queue for Ollama to prevent concurrent request issues
      const makeRequest = async () => {
        return await apiRequest("/api/llm/chat", {
          method: "POST",
          body: JSON.stringify(requestData),
        });
      };

      const response = config.provider === 'ollama'
        ? await this.queueRequest(makeRequest)
        : await makeRequest();

      return {
        suggestions: this.parseSmartSuggestions(response.response || response.message),
        session_id: response.session_id,
      };
    } catch (error) {
      console.error("Error getting smart suggestions:", error);
      // Fallback to demo suggestions
      return {
        suggestions: this.generateDemoSmartSuggestions(code, language)
      };
    }
  }

  // Get contextual hints based on current code context
  static async getContextualHints(code, language = "javascript") {
    try {
      const config = this.getLLMConfig();

      // Check if real AI is available
      if (!this.isRealAIAvailable()) {
        console.log('🎭 Generating demo contextual hints - no AI configured');
        return {
          hints: this.generateDemoContextualHints(code, language)
        };
      }

      const hintPrompt = `Provide contextual hints and tips for this ${language} code. Focus on language-specific best practices, common patterns, and helpful shortcuts:\n\n${code}`;

      const requestData = {
        message: hintPrompt,
        session_id: `hints_${Date.now()}`,
        ...config,
      };

      // Debug logging for problematic requests
      if (config.provider === 'ollama') {
        console.log('🔍 Contextual Hints Request:', {
          messageLength: hintPrompt.length,
          sessionId: requestData.session_id,
          provider: requestData.provider,
          model: requestData.model,
          hasBaseUrl: !!requestData.base_url
        });
      }

      // Use queue for Ollama to prevent concurrent request issues
      const makeRequest = async () => {
        return await apiRequest("/api/llm/chat", {
          method: "POST",
          body: JSON.stringify(requestData),
        });
      };

      const response = config.provider === 'ollama'
        ? await this.queueRequest(makeRequest)
        : await makeRequest();

      return {
        hints: this.parseContextualHints(response.response || response.message),
        session_id: response.session_id,
      };
    } catch (error) {
      console.error("Error getting contextual hints:", error);
      // Fallback to demo hints
      return {
        hints: this.generateDemoContextualHints(code, language)
      };
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
  // JavaScript-specific analysis
  static analyzeJavaScript(code, codeLines) {
    const suggestions = [];

    // Check for var usage
    if (code.includes('var ')) {
      suggestions.push({
        id: 'js-var-usage',
        type: 'best_practice',
        severity: 'warning',
        title: 'Use modern variable declarations',
        message: 'Replace var with let or const',
        description: 'Modern variable declarations provide better scoping and prevent common bugs.',
        line: this.findLineContaining(codeLines, 'var '),
        confidence: 0.90,
        estimatedImpact: 'medium',
        code_snippet: '// Instead of:\n// var name = "John";\n\n// Use:\nconst name = "John"; // for constants\nlet age = 30; // for variables',
        reasoning: 'let and const provide block scoping and prevent hoisting issues.'
      });
    }

    // Check for traditional for loops
    if (code.includes('for (') && code.includes('.length')) {
      suggestions.push({
        id: 'js-loop-optimization',
        type: 'performance',
        severity: 'info',
        title: 'Optimize loop performance',
        message: 'Consider using modern array methods',
        description: 'Replace traditional for loops with modern array methods for better readability and performance.',
        line: this.findLineContaining(codeLines, 'for ('),
        confidence: 0.85,
        estimatedImpact: 'medium',
        code_snippet: '// Instead of:\n// for (let i = 0; i < items.length; i++) {\n//   processItem(items[i]);\n// }\n\n// Use:\nitems.forEach(item => processItem(item));\n// or\nconst results = items.map(item => processItem(item));',
        reasoning: 'Modern array methods are more readable and often more performant.'
      });
    }

    // Check for innerHTML usage (security)
    if (code.includes('innerHTML')) {
      suggestions.push({
        id: 'js-xss-prevention',
        type: 'security',
        severity: 'error',
        title: 'Potential XSS vulnerability',
        message: 'Sanitize user input before rendering',
        description: 'Direct insertion of user input into DOM can lead to XSS attacks.',
        line: this.findLineContaining(codeLines, 'innerHTML'),
        confidence: 0.95,
        estimatedImpact: 'high',
        code_snippet: '// Instead of:\n// element.innerHTML = userInput;\n\n// Use:\nelement.textContent = userInput;\n// or with sanitization:\nelement.innerHTML = DOMPurify.sanitize(userInput);',
        reasoning: 'Using textContent or proper sanitization prevents XSS attacks.'
      });
    }

    return suggestions;
  }

  // Python-specific analysis
  static analyzePython(code, codeLines) {
    const suggestions = [];

    // Check for missing type hints
    if (code.includes('def ') && !code.includes(': ')) {
      suggestions.push({
        id: 'py-type-hints',
        type: 'best_practice',
        severity: 'info',
        title: 'Add type hints',
        message: 'Consider adding type hints for better code documentation',
        description: 'Type hints improve code readability and help with IDE support.',
        line: this.findLineContaining(codeLines, 'def '),
        confidence: 0.80,
        estimatedImpact: 'medium',
        code_snippet: '# Instead of:\n# def process_data(data):\n#     return data.upper()\n\n# Use:\ndef process_data(data: str) -> str:\n    return data.upper()',
        reasoning: 'Type hints improve code documentation and IDE support.'
      });
    }

    // Check for list comprehension opportunities
    if (code.includes('for ') && code.includes('append(')) {
      suggestions.push({
        id: 'py-list-comprehension',
        type: 'performance',
        severity: 'info',
        title: 'Use list comprehension',
        message: 'Replace loop with list comprehension',
        description: 'List comprehensions are more Pythonic and often faster.',
        line: this.findLineContaining(codeLines, 'append('),
        confidence: 0.85,
        estimatedImpact: 'medium',
        code_snippet: '# Instead of:\n# result = []\n# for item in items:\n#     result.append(process(item))\n\n# Use:\nresult = [process(item) for item in items]',
        reasoning: 'List comprehensions are more Pythonic and often faster.'
      });
    }

    return suggestions;
  }

  // Java-specific analysis
  static analyzeJava(code, codeLines) {
    const suggestions = [];

    // Check for raw types
    if (code.includes('List ') && !code.includes('List<')) {
      suggestions.push({
        id: 'java-generics',
        type: 'best_practice',
        severity: 'warning',
        title: 'Use generics',
        message: 'Specify generic types for type safety',
        description: 'Using generics provides compile-time type checking and eliminates casting.',
        line: this.findLineContaining(codeLines, 'List '),
        confidence: 0.90,
        estimatedImpact: 'medium',
        code_snippet: '// Instead of:\n// List items = new ArrayList();\n\n// Use:\nList<String> items = new ArrayList<>();',
        reasoning: 'Generics provide type safety and eliminate the need for casting.'
      });
    }

    return suggestions;
  }

  // C++ specific analysis
  static analyzeCpp(code, codeLines) {
    const suggestions = [];

    // Check for raw pointers
    if (code.includes('*') && !code.includes('unique_ptr') && !code.includes('shared_ptr')) {
      suggestions.push({
        id: 'cpp-smart-pointers',
        type: 'best_practice',
        severity: 'warning',
        title: 'Use smart pointers',
        message: 'Consider using smart pointers for automatic memory management',
        description: 'Smart pointers help prevent memory leaks and provide automatic cleanup.',
        line: this.findLineContaining(codeLines, '*'),
        confidence: 0.85,
        estimatedImpact: 'high',
        code_snippet: '// Instead of:\n// int* ptr = new int(42);\n// delete ptr;\n\n// Use:\nauto ptr = std::make_unique<int>(42);\n// Automatic cleanup',
        reasoning: 'Smart pointers provide automatic memory management and prevent leaks.'
      });
    }

    return suggestions;
  }

  // Generic analysis for other languages
  static analyzeGeneric(code, codeLines) {
    const suggestions = [];

    // Generic code quality suggestions
    if (codeLines.length > 50) {
      suggestions.push({
        id: 'generic-complexity',
        type: 'refactor',
        severity: 'info',
        title: 'Consider breaking down large functions',
        message: 'Large functions can be hard to maintain',
        description: 'Breaking down large functions improves readability and maintainability.',
        line: Math.floor(codeLines.length / 2),
        confidence: 0.70,
        estimatedImpact: 'medium',
        code_snippet: '// Consider breaking this function into smaller, focused functions\n// Each function should have a single responsibility',
        reasoning: 'Smaller functions are easier to test, debug, and maintain.'
      });
    }

    return suggestions;
  }

  // Generate language-specific code improvement
  static generateLanguageSpecificImprovement(code, selection, language) {
    const improvementText = selection.text || code;

    // Simple improvements based on language
    switch (language) {
      case 'javascript':
        return this.improveJavaScript(improvementText);
      case 'python':
        return this.improvePython(improvementText);
      case 'java':
        return this.improveJava(improvementText);
      default:
        return `// Improved ${language} code\n${improvementText}\n\n// Configure your API key in Settings for real AI-powered improvements`;
    }
  }

  // JavaScript improvement examples
  static improveJavaScript(code) {
    let improved = code;

    // Replace var with const/let
    improved = improved.replace(/var\s+(\w+)\s*=/g, 'const $1 =');

    // Add basic error handling if missing
    if (!improved.includes('try') && improved.includes('fetch')) {
      improved = `try {\n  ${improved}\n} catch (error) {\n  console.error('Error:', error);\n}`;
    }

    return improved;
  }

  // Python improvement examples
  static improvePython(code) {
    let improved = code;

    // Add type hints to functions
    improved = improved.replace(/def\s+(\w+)\s*\(([^)]*)\):/g, 'def $1($2) -> None:');

    return improved;
  }

  // Java improvement examples
  static improveJava(code) {
    let improved = code;

    // Add generics to raw types
    improved = improved.replace(/List\s+(\w+)\s*=/g, 'List<Object> $1 =');

    return improved;
  }

  // Helper method to find line containing text
  static findLineContaining(lines, searchText) {
    const index = lines.findIndex(line => line.includes(searchText));
    return index >= 0 ? index + 1 : null;
  }

  // Get cache statistics for debugging
  static getCacheStats() {
    return analysisCache.getStats();
  }

  // Clear cache manually
  static clearCache() {
    analysisCache.clear();
    console.log('🗑️ Analysis cache cleared');
  }

  // Generate demo smart suggestions
  static generateDemoSmartSuggestions(code, language) {
    const suggestions = [];

    if (language === 'javascript') {
      if (code.includes('console.log')) {
        suggestions.push({
          message: "Consider using a proper logging library for production code",
          type: "best_practice"
        });
      }
      if (code.includes('==')) {
        suggestions.push({
          message: "Use strict equality (===) instead of loose equality (==)",
          type: "best_practice"
        });
      }
    }

    return suggestions.slice(0, 2);
  }

  // Generate demo contextual hints
  static generateDemoContextualHints(code, language) {
    const hints = [];

    const languageHints = {
      javascript: [
        { message: "Use const for values that don't change, let for variables that do" },
        { message: "Consider using arrow functions for shorter syntax" }
      ],
      python: [
        { message: "Use list comprehensions for concise data transformations" },
        { message: "Follow PEP 8 style guidelines for consistent code" }
      ],
      java: [
        { message: "Use generics for type safety" },
        { message: "Consider using try-with-resources for automatic resource management" }
      ]
    };

    return languageHints[language] || languageHints.javascript;
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
