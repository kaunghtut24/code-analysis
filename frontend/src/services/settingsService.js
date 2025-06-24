import { apiRequest } from "@/lib/api";

export const settingsService = {
  async fetchProviders() {
    try {
      return await apiRequest("/api/llm/providers");
    } catch (error) {
      throw new Error("Failed to load AI providers");
    }
  },

  async fetchModels(provider) {
    try {
      return await apiRequest(`/api/llm/models?provider=${provider}`);
    } catch (error) {
      throw new Error(`Failed to load models for ${provider}`);
    }
  },

  async testConnection(testData) {
    try {
      return await apiRequest("/api/llm/test-connection", {
        method: "POST",
        body: JSON.stringify(testData),
      });
    } catch (error) {
      return {
        success: false,
        error: error.message || "Connection test failed",
      };
    }
  },

  saveSettings(settings) {
    const {
      githubToken,
      apiKeys,
      selectedProvider,
      selectedModel,
      customModel,
      useCustomModel,
      customBaseUrl,
      temperature,
      maxTokens,
      topP,
      frequencyPenalty,
      presencePenalty,
      useDefaultParams,
      showAdvancedParams,
    } = settings;

    localStorage.setItem("githubToken", githubToken);
    localStorage.setItem("openaiKey", apiKeys.openai);
    localStorage.setItem("anthropicKey", apiKeys.anthropic);
    localStorage.setItem("azureKey", apiKeys.azure);
    localStorage.setItem("ollamaKey", apiKeys.ollama);
    localStorage.setItem("customKey", apiKeys.custom);
    localStorage.setItem("llmProvider", selectedProvider);
    localStorage.setItem("llmModel", selectedModel);
    localStorage.setItem("customModel", customModel);
    localStorage.setItem("useCustomModel", useCustomModel.toString());
    localStorage.setItem("customBaseUrl", customBaseUrl);
    localStorage.setItem("temperature", temperature[0].toString());
    localStorage.setItem("maxTokens", maxTokens);
    localStorage.setItem("topP", topP);
    localStorage.setItem("frequencyPenalty", frequencyPenalty);
    localStorage.setItem("presencePenalty", presencePenalty);
    localStorage.setItem("useDefaultParams", useDefaultParams.toString());
    localStorage.setItem("showAdvancedParams", showAdvancedParams.toString());
  },

  clearSettings() {
    const keys = [
      "githubToken",
      "openaiKey",
      "anthropicKey",
      "azureKey",
      "ollamaKey",
      "customKey",
      "llmProvider",
      "llmModel",
      "customModel",
      "useCustomModel",
      "customBaseUrl",
      "temperature",
      "maxTokens",
      "topP",
      "frequencyPenalty",
      "presencePenalty",
      "useDefaultParams",
      "showAdvancedParams",
    ];

    keys.forEach((key) => localStorage.removeItem(key));
  },

  loadSettings() {
    return {
      githubToken: localStorage.getItem("githubToken") || "",
      apiKeys: {
        openai: localStorage.getItem("openaiKey") || "",
        anthropic: localStorage.getItem("anthropicKey") || "",
        azure: localStorage.getItem("azureKey") || "",
        ollama: localStorage.getItem("ollamaKey") || "",
        custom: localStorage.getItem("customKey") || "",
      },
      selectedProvider: localStorage.getItem("llmProvider") || "openai",
      selectedModel: localStorage.getItem("llmModel") || "gpt-4o-mini",
      customModel: localStorage.getItem("customModel") || "",
      useCustomModel: localStorage.getItem("useCustomModel") === "true",
      customBaseUrl: localStorage.getItem("customBaseUrl") || "",
      temperature: [parseFloat(localStorage.getItem("temperature")) || 0.7],
      maxTokens: localStorage.getItem("maxTokens") || "",
      topP: localStorage.getItem("topP") || "",
      frequencyPenalty: localStorage.getItem("frequencyPenalty") || "",
      presencePenalty: localStorage.getItem("presencePenalty") || "",
      useDefaultParams: localStorage.getItem("useDefaultParams") !== "false",
      showAdvancedParams: localStorage.getItem("showAdvancedParams") === "true",
    };
  },

  getProviderName(provider) {
    const providerNames = {
      openai: "OpenAI",
      anthropic: "Anthropic",
      azure: "Azure OpenAI",
      ollama: "Ollama (Local)",
      custom: "Custom Provider",
    };
    return providerNames[provider] || provider;
  },

  getApiKeyPlaceholder(provider) {
    const placeholders = {
      openai: "sk-xxxxxxxxxxxxxxxxxxxx",
      anthropic: "sk-ant-xxxxxxxxxxxxxxxxxxxx",
      azure: "your-azure-api-key",
      ollama: "No API key needed for local Ollama",
      custom: "your-custom-api-key",
    };
    return placeholders[provider] || "your-api-key";
  },
};
