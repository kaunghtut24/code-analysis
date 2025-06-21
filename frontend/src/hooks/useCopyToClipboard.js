import { useState } from 'react'
import { useToast } from './use-toast'

export const useCopyToClipboard = () => {
  const [copiedStates, setCopiedStates] = useState({})
  const { toast } = useToast()

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedStates(prev => ({ ...prev, [id]: true }))
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [id]: false }))
      }, 2000)
      toast({
        title: "Copied!",
        description: "Code copied to clipboard"
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      })
    }
  }

  return {
    copiedStates,
    copyToClipboard
  }
}
