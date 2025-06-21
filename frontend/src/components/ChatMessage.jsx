import { useState } from 'react'
import { Bot, User, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function ChatMessage({ message, index, onCopy, copiedStates }) {
  const formatContent = (content) => {
    // Split content by code blocks (```...```)
    const parts = content.split(/(```[\s\S]*?```)/g)
    
    return parts.map((part, partIndex) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // This is a code block
        const codeContent = part.slice(3, -3).trim()
        const lines = codeContent.split('\n')
        const language = lines[0] && !lines[0].includes(' ') ? lines[0] : ''
        const code = language ? lines.slice(1).join('\n') : codeContent
        const copyId = `${index}-${partIndex}`
        
        return (
          <div key={partIndex} className="my-3 bg-gray-900 rounded-lg overflow-hidden code-block">
            <div className="flex items-center justify-between px-3 py-2 bg-gray-800 text-gray-300 text-xs">
              <span className="font-medium">{language || 'code'}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopy(code, copyId)}
                className="h-6 px-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                title="Copy code"
              >
                {copiedStates[copyId] ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            <pre className="p-3 text-sm text-gray-100 overflow-x-auto mobile-scroll">
              <code className="font-mono">{code}</code>
            </pre>
          </div>
        )
      } else if (part.includes('`') && !part.startsWith('```')) {
        // Handle inline code
        const inlineParts = part.split(/(`[^`]+`)/g)
        return (
          <span key={partIndex}>
            {inlineParts.map((inlinePart, inlineIndex) => {
              if (inlinePart.startsWith('`') && inlinePart.endsWith('`')) {
                const inlineCode = inlinePart.slice(1, -1)
                const copyId = `${index}-${partIndex}-${inlineIndex}`
                return (
                  <span key={inlineIndex} className="relative inline-flex items-center group">
                    <code className="inline-code font-mono">
                      {inlineCode}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCopy(inlineCode, copyId)}
                      className="ml-1 h-4 w-4 p-0 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy code"
                    >
                      {copiedStates[copyId] ? (
                        <Check className="h-2 w-2" />
                      ) : (
                        <Copy className="h-2 w-2" />
                      )}
                    </Button>
                  </span>
                )
              }
              return <span key={inlineIndex}>{inlinePart}</span>
            })}
          </span>
        )
      } else {
        // Regular text
        return <span key={partIndex}>{part}</span>
      }
    })
  }

  return (
    <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[90%] sm:max-w-[85%] lg:max-w-[80%] rounded-lg p-3 shadow-sm chat-message ${
        message.type === 'user'
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 text-gray-900'
      }`}>
        <div className="flex items-center space-x-2 mb-2 flex-wrap">
          {message.type === 'user' ? (
            <User className="h-4 w-4 flex-shrink-0" />
          ) : (
            <Bot className="h-4 w-4 flex-shrink-0" />
          )}
          <span className="text-xs opacity-75 flex-shrink-0">
            {message.timestamp.toLocaleTimeString()}
          </span>
          {message.model && (
            <Badge variant="secondary" className="text-xs">
              {message.model}
            </Badge>
          )}
        </div>
        <div className="text-sm leading-relaxed">
          {formatContent(message.content)}
        </div>
      </div>
    </div>
  )
}
