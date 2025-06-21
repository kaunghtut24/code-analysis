import { toast } from 'sonner'

export const useToast = () => {
  return {
    toast: (options) => {
      if (options.variant === 'destructive') {
        toast.error(options.title, {
          description: options.description
        })
      } else {
        toast.success(options.title, {
          description: options.description
        })
      }
    }
  }
}

