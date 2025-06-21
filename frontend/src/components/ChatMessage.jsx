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
              return <span key={inlineIndex}>{formatMarkdownText(inlinePart)}</span>
            })}
          </span>
        )
      } else {
        // Regular text with markdown formatting
        return <span key={partIndex}>{formatMarkdownText(part)}</span>
      }
    })
  }

  const parseTable = (lines, startIndex) => {
    const tableLines = []
    let i = startIndex

    // More flexible table detection - collect lines that contain pipes
    while (i < lines.length) {
      const line = lines[i].trim()

      // Check if this looks like a table line (contains |)
      if (line.includes('|')) {
        tableLines.push(line)
        i++
      } else if (line === '') {
        // Empty line - check if next line is also a table line
        if (i + 1 < lines.length && lines[i + 1].trim().includes('|')) {
          i++
          continue
        } else {
          break
        }
      } else {
        break
      }
    }

    if (tableLines.length < 2) {
      return { table: null, nextIndex: startIndex + 1 }
    }

    // Find the header row (first non-separator row)
    let headerRowIndex = 0
    let separatorRowIndex = -1

    // Look for separator row (contains dashes)
    for (let j = 0; j < tableLines.length; j++) {
      if (tableLines[j].includes('-') && tableLines[j].includes('|')) {
        separatorRowIndex = j
        break
      }
    }

    // If we found a separator, header is the row before it
    if (separatorRowIndex > 0) {
      headerRowIndex = separatorRowIndex - 1
    }

    const headerRow = tableLines[headerRowIndex]

    // Parse headers - split by | and clean up
    let headers = headerRow.split('|')

    // Remove empty first/last elements if they exist
    if (headers[0].trim() === '') headers = headers.slice(1)
    if (headers[headers.length - 1].trim() === '') headers = headers.slice(0, -1)

    // Clean up header text
    headers = headers.map(h => h.trim())

    if (headers.length === 0) {
      return { table: null, nextIndex: startIndex + 1 }
    }

    // Parse data rows (skip header and separator)
    const rows = []
    const dataStartIndex = separatorRowIndex >= 0 ? separatorRowIndex + 1 : headerRowIndex + 1

    for (let j = dataStartIndex; j < tableLines.length; j++) {
      const row = tableLines[j]
      if (row.includes('|')) {
        let cells = row.split('|')

        // Remove empty first/last elements if they exist
        if (cells[0].trim() === '') cells = cells.slice(1)
        if (cells[cells.length - 1].trim() === '') cells = cells.slice(0, -1)

        // Clean up cell text
        cells = cells.map(c => c.trim())

        // Only add rows that have the right number of columns (or close to it)
        if (cells.length >= headers.length - 1 && cells.length <= headers.length + 1) {
          // Pad with empty cells if needed
          while (cells.length < headers.length) {
            cells.push('')
          }
          // Truncate if too many cells
          if (cells.length > headers.length) {
            cells = cells.slice(0, headers.length)
          }
          rows.push(cells)
        }
      }
    }

    if (rows.length === 0) {
      return { table: null, nextIndex: startIndex + 1 }
    }

    return {
      table: { headers, rows },
      nextIndex: i
    }
  }

  const formatMarkdownText = (text) => {
    if (!text) return text

    // Process text line by line to handle different markdown elements
    const lines = text.split('\n')
    const result = []
    let currentIndex = 0
    let i = 0

    while (i < lines.length) {
      const line = lines[i]

      // Check for tables (lines with | characters) - more flexible detection
      if (line.includes('|')) {
        const tableResult = parseTable(lines, i)
        if (tableResult.table) {
          result.push(
            <div key={currentIndex++} className="my-4 overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300 text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    {tableResult.table.headers.map((header, headerIndex) => (
                      <th key={headerIndex} className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-900">
                        {formatInlineMarkdown(header)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableResult.table.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="border border-gray-300 px-2 py-2 text-gray-800 align-top">
                          <div className="whitespace-pre-wrap break-words">
                            {formatInlineMarkdown(cell)}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
          i = tableResult.nextIndex
          continue
        }
      }

      // Headers (### text)
      if (line.match(/^#{1,6}\s/)) {
        const level = line.match(/^#{1,6}/)[0].length
        const headerText = line.replace(/^#{1,6}\s/, '')
        const headerClasses = {
          1: 'text-lg font-bold mt-3 mb-2 text-gray-900',
          2: 'text-base font-bold mt-3 mb-2 text-gray-900',
          3: 'text-sm font-bold mt-2 mb-1 text-gray-900',
          4: 'text-sm font-semibold mt-2 mb-1 text-gray-800',
          5: 'text-xs font-semibold mt-1 mb-1 text-gray-800',
          6: 'text-xs font-medium mt-1 mb-1 text-gray-700'
        }

        result.push(
          <div key={currentIndex++} className={headerClasses[level]}>
            {formatInlineMarkdown(headerText)}
          </div>
        )
        i++
        continue
      }

      // Numbered lists (1. text)
      if (line.match(/^\d+\.\s/)) {
        result.push(
          <div key={currentIndex++} className="ml-4 my-1 flex items-start">
            <span className="font-medium text-blue-600 mr-2 flex-shrink-0">
              {line.match(/^\d+\./)[0]}
            </span>
            <span>{formatInlineMarkdown(line.replace(/^\d+\.\s/, ''))}</span>
          </div>
        )
        i++
        continue
      }

      // Bullet points (- text)
      if (line.match(/^-\s/)) {
        result.push(
          <div key={currentIndex++} className="ml-4 my-1 flex items-start">
            <span className="text-blue-600 mr-2 flex-shrink-0">•</span>
            <span>{formatInlineMarkdown(line.slice(2))}</span>
          </div>
        )
        i++
        continue
      }

      // Horizontal rules (--- or ***)
      if (line.match(/^(-{3,}|\*{3,})$/)) {
        result.push(
          <hr key={currentIndex++} className="my-4 border-gray-300" />
        )
        i++
        continue
      }

      // Blockquotes (> text)
      if (line.match(/^>\s/)) {
        result.push(
          <div key={currentIndex++} className="ml-4 my-2 pl-3 border-l-4 border-blue-300 bg-blue-50 py-2">
            <span className="text-gray-700 italic">{formatInlineMarkdown(line.slice(2))}</span>
          </div>
        )
        i++
        continue
      }

      // Regular text line
      if (line.trim()) {
        result.push(
          <div key={currentIndex++} className="my-1">
            {formatInlineMarkdown(line)}
          </div>
        )
      } else {
        // Empty line - add spacing
        result.push(<div key={currentIndex++} className="h-2" />)
      }
      i++
    }

    return result
  }

  const formatInlineMarkdown = (text) => {
    if (!text) return text

    // Split by bold and italic patterns
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)

    return parts.map((part, index) => {
      // Bold text (**text**)
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong key={index} className="font-semibold text-gray-900">
            {part.slice(2, -2)}
          </strong>
        )
      }

      // Italic text (*text*) - but not if it's part of **text**
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2 && !part.startsWith('**')) {
        return (
          <em key={index} className="italic text-gray-800">
            {part.slice(1, -1)}
          </em>
        )
      }

      // Regular text
      return <span key={index}>{part}</span>
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
