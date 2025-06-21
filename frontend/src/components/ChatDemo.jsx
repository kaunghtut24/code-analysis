import { useState } from 'react'
import ChatMessage from './ChatMessage'
import MobileHeader from './MobileHeader'
import { Button } from '@/components/ui/button'

export default function ChatDemo() {
  const [copiedStates, setCopiedStates] = useState({})

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedStates(prev => ({ ...prev, [id]: true }))
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [id]: false }))
      }, 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const sampleMessages = [
    {
      type: 'user',
      content: 'Can you help me create a React component?',
      timestamp: new Date(),
    },
    {
      type: 'assistant',
      content: `I'll help you create a React component! Here's a basic example:

\`\`\`jsx
import React, { useState } from 'react';

function MyComponent({ title }) {
  const [count, setCount] = useState(0);

  return (
    <div className="component">
      <h2>{title}</h2>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

export default MyComponent;
\`\`\`

This component includes:
- Props (\`title\`)
- State management with \`useState\`
- Event handling
- JSX rendering

You can also use inline code like \`useState\` or \`useEffect\` for hooks.`,
      timestamp: new Date(),
      model: 'gpt-4o-mini'
    },
    {
      type: 'user',
      content: 'How do I add CSS styling?',
      timestamp: new Date(),
    },
    {
      type: 'assistant',
      content: `There are several ways to add CSS styling to React components:

## 1. CSS Modules
\`\`\`css
/* MyComponent.module.css */
.component {
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
}

.title {
  color: #333;
  font-size: 1.5rem;
}
\`\`\`

\`\`\`jsx
import styles from './MyComponent.module.css';

function MyComponent() {
  return (
    <div className={styles.component}>
      <h2 className={styles.title}>Hello World</h2>
    </div>
  );
}
\`\`\`

## 2. Tailwind CSS (recommended)
\`\`\`jsx
function MyComponent() {
  return (
    <div className="p-4 border border-gray-300 rounded-lg">
      <h2 className="text-xl font-semibold text-gray-800">Hello World</h2>
    </div>
  );
}
\`\`\`

Use \`className\` instead of \`class\` in JSX!`,
      timestamp: new Date(),
      model: 'gpt-4o-mini'
    }
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <MobileHeader title="Chat Demo" showBack={true} />

      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 lg:block hidden">Chat Formatting Demo</h1>
          <div className="border rounded-lg p-4 h-64 sm:h-96 overflow-y-auto mobile-scroll">
        {sampleMessages.map((message, index) => (
          <ChatMessage
            key={index}
            message={message}
            index={index}
            onCopy={copyToClipboard}
            copiedStates={copiedStates}
          />
        ))}
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>This demo shows:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Code blocks with syntax highlighting headers</li>
              <li>Copy buttons for code snippets</li>
              <li>Inline code formatting</li>
              <li>Responsive design for mobile devices</li>
              <li>Proper text wrapping and spacing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
