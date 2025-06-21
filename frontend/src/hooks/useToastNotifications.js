import { useToast } from './use-toast'

export const useToastNotifications = () => {
  const { toast } = useToast()

  const showSuccess = (title, description) => {
    toast({
      title,
      description
    })
  }

  const showError = (title, description) => {
    toast({
      title,
      description,
      variant: "destructive"
    })
  }

  const showInfo = (title, description) => {
    toast({
      title,
      description,
      variant: "default"
    })
  }

  const showWarning = (title, description) => {
    toast({
      title,
      description,
      variant: "destructive" // Using destructive for warnings as there's no warning variant
    })
  }

  // Specific notification types for common scenarios
  const showConnectionSuccess = (provider, model) => {
    showSuccess(
      "Connection Successful",
      `Successfully connected to ${provider}/${model}`
    )
  }

  const showConnectionError = (error) => {
    showError(
      "Connection Failed",
      error || "Failed to connect to AI provider"
    )
  }

  const showAnalysisComplete = (provider, model) => {
    showSuccess(
      "Analysis Complete",
      `Analysis completed using ${provider}/${model}`
    )
  }

  const showAnalysisError = (error) => {
    showError(
      "Analysis Error",
      error || "Failed to analyze code"
    )
  }

  const showSettingsSaved = () => {
    showSuccess(
      "Settings Saved",
      "Your configuration has been saved successfully."
    )
  }

  const showSettingsCleared = () => {
    showInfo(
      "Settings Cleared",
      "All settings have been cleared."
    )
  }

  const showFileLoaded = (fileName, repoName) => {
    showSuccess(
      "File Loaded",
      `Loaded ${fileName} from ${repoName}`
    )
  }

  const showCopiedToClipboard = () => {
    showSuccess(
      "Copied!",
      "Code copied to clipboard"
    )
  }

  const showCopyError = () => {
    showError(
      "Error",
      "Failed to copy to clipboard"
    )
  }

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showConnectionSuccess,
    showConnectionError,
    showAnalysisComplete,
    showAnalysisError,
    showSettingsSaved,
    showSettingsCleared,
    showFileLoaded,
    showCopiedToClipboard,
    showCopyError
  }
}
