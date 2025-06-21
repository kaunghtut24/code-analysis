import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, Send, Loader2 } from 'lucide-react'
import ChatMessage from '../ChatMessage'

export default function ChatInterface({
  chatMessages,
  chatInput,
  onChatInputChange,
  onSendMessage,
  loading,
  hasValidConfig,
  isApiKeyRequired,
  copiedStates,
  onCopy
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSendMessage()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <span>Analysis & Chat</span>
        </CardTitle>
        <CardDescription>
          AI analysis results and interactive chat
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat Messages */}
        <div className="h-64 sm:h-96 overflow-y-auto border rounded-lg p-2 sm:p-4 mobile-scroll">
          {chatMessages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No analysis yet. Enter some code and click "Analyze Code" to get started.</p>
            </div>
          ) : (
            chatMessages.map((message, index) => (
              <ChatMessage
                key={index}
                message={message}
                index={index}
                onCopy={onCopy}
                copiedStates={copiedStates}
              />
            ))
          )}
          {loading && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Textarea
            placeholder="Ask a follow-up question..."
            value={chatInput}
            onChange={(e) => onChatInputChange(e.target.value)}
            className="flex-1 min-h-[60px] resize-none"
            onKeyDown={handleKeyDown}
            disabled={!hasValidConfig}
          />
          <Button
            onClick={onSendMessage}
            disabled={loading || !chatInput.trim() || !hasValidConfig}
            className="w-full sm:w-auto sm:self-end"
          >
            <Send className="h-4 w-4 mr-2 sm:mr-0" />
            <span className="sm:hidden">Send Message</span>
          </Button>
        </div>
        
        {!hasValidConfig && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
            <p className="text-xs text-yellow-800">
              {isApiKeyRequired
                ? "Configure your AI provider API key in Settings to enable chat functionality."
                : "Configure your AI provider in Settings to enable chat functionality."
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
