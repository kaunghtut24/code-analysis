/**
 * Programming Language Detection Utility
 * Detects programming language based on code content and patterns
 */

export const detectLanguage = (code) => {
  if (!code || typeof code !== 'string') {
    return { language: 'unknown', confidence: 0 }
  }

  const patterns = {
    javascript: {
      keywords: ['function', 'const', 'let', 'var', 'async', 'await', 'import', 'export', 'require'],
      patterns: [
        /function\s+\w+\s*\(/,
        /const\s+\w+\s*=/,
        /let\s+\w+\s*=/,
        /var\s+\w+\s*=/,
        /=>\s*{/,
        /require\s*\(/,
        /import\s+.*from/,
        /export\s+(default\s+)?/,
        /console\.log\s*\(/,
        /\.then\s*\(/,
        /\.catch\s*\(/
      ],
      extensions: ['.js', '.jsx', '.mjs', '.ts', '.tsx']
    },
    python: {
      keywords: ['def', 'class', 'import', 'from', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'with'],
      patterns: [
        /def\s+\w+\s*\(/,
        /class\s+\w+/,
        /import\s+\w+/,
        /from\s+\w+\s+import/,
        /if\s+__name__\s*==\s*['"']__main__['"']/,
        /print\s*\(/,
        /len\s*\(/,
        /range\s*\(/,
        /:\s*$/m,
        /^\s*#/m
      ],
      extensions: ['.py', '.pyw', '.pyx']
    },
    java: {
      keywords: ['public', 'private', 'protected', 'class', 'interface', 'extends', 'implements', 'static', 'final'],
      patterns: [
        /public\s+class\s+\w+/,
        /public\s+static\s+void\s+main/,
        /System\.out\.print/,
        /import\s+java\./,
        /package\s+\w+/,
        /\w+\s+\w+\s*\([^)]*\)\s*{/,
        /new\s+\w+\s*\(/,
        /\.length\b/,
        /instanceof\s+/
      ],
      extensions: ['.java']
    },
    cpp: {
      keywords: ['#include', 'using', 'namespace', 'class', 'struct', 'template', 'public', 'private', 'protected'],
      patterns: [
        /#include\s*<.*>/,
        /using\s+namespace\s+std/,
        /std::/,
        /cout\s*<<|cin\s*>>/,
        /int\s+main\s*\(/,
        /class\s+\w+/,
        /struct\s+\w+/,
        /template\s*</,
        /\w+::\w+/,
        /delete\s+/,
        /new\s+\w+/
      ],
      extensions: ['.cpp', '.cc', '.cxx', '.c++', '.hpp', '.h']
    },
    c: {
      keywords: ['#include', 'int', 'char', 'float', 'double', 'void', 'struct', 'typedef', 'static', 'extern'],
      patterns: [
        /#include\s*<.*\.h>/,
        /int\s+main\s*\(/,
        /printf\s*\(/,
        /scanf\s*\(/,
        /malloc\s*\(/,
        /free\s*\(/,
        /struct\s+\w+/,
        /typedef\s+/,
        /\w+\s*\*\s*\w+/,
        /sizeof\s*\(/
      ],
      extensions: ['.c', '.h']
    },
    csharp: {
      keywords: ['using', 'namespace', 'class', 'public', 'private', 'protected', 'static', 'void', 'string'],
      patterns: [
        /using\s+System/,
        /namespace\s+\w+/,
        /public\s+class\s+\w+/,
        /Console\.WriteLine/,
        /public\s+static\s+void\s+Main/,
        /\[.*\]/,
        /get\s*;\s*set\s*;/,
        /var\s+\w+\s*=/,
        /string\s+\w+/
      ],
      extensions: ['.cs']
    },
    php: {
      keywords: ['<?php', 'function', 'class', 'public', 'private', 'protected', 'static', 'echo', 'print'],
      patterns: [
        /<\?php/,
        /\$\w+/,
        /echo\s+/,
        /print\s+/,
        /function\s+\w+\s*\(/,
        /class\s+\w+/,
        /public\s+function/,
        /private\s+function/,
        /->/,
        /\$this->/
      ],
      extensions: ['.php', '.phtml']
    },
    ruby: {
      keywords: ['def', 'class', 'module', 'end', 'if', 'elsif', 'else', 'unless', 'case', 'when'],
      patterns: [
        /def\s+\w+/,
        /class\s+\w+/,
        /module\s+\w+/,
        /end\s*$/m,
        /puts\s+/,
        /require\s+['"']/,
        /@\w+/,
        /\|\w+\|/,
        /\.each\s+do/,
        /=>\s*/
      ],
      extensions: ['.rb', '.rbw']
    },
    go: {
      keywords: ['package', 'import', 'func', 'var', 'const', 'type', 'struct', 'interface', 'go', 'defer'],
      patterns: [
        /package\s+\w+/,
        /import\s+['"']/,
        /func\s+\w+\s*\(/,
        /func\s+main\s*\(/,
        /fmt\.Print/,
        /var\s+\w+\s+\w+/,
        /type\s+\w+\s+struct/,
        /go\s+\w+\s*\(/,
        /defer\s+/,
        /:=/
      ],
      extensions: ['.go']
    },
    rust: {
      keywords: ['fn', 'let', 'mut', 'struct', 'enum', 'impl', 'trait', 'use', 'mod', 'pub'],
      patterns: [
        /fn\s+\w+\s*\(/,
        /let\s+(mut\s+)?\w+/,
        /struct\s+\w+/,
        /enum\s+\w+/,
        /impl\s+\w+/,
        /trait\s+\w+/,
        /use\s+\w+/,
        /println!\s*\(/,
        /match\s+\w+/,
        /&str\b/,
        /String::/
      ],
      extensions: ['.rs']
    },
    sql: {
      keywords: ['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'TABLE'],
      patterns: [
        /SELECT\s+.*\s+FROM/i,
        /INSERT\s+INTO/i,
        /UPDATE\s+\w+\s+SET/i,
        /DELETE\s+FROM/i,
        /CREATE\s+TABLE/i,
        /ALTER\s+TABLE/i,
        /DROP\s+TABLE/i,
        /WHERE\s+/i,
        /JOIN\s+/i,
        /GROUP\s+BY/i,
        /ORDER\s+BY/i
      ],
      extensions: ['.sql']
    },
    html: {
      keywords: ['html', 'head', 'body', 'div', 'span', 'script', 'style', 'link'],
      patterns: [
        /<html/i,
        /<head>/i,
        /<body>/i,
        /<div/i,
        /<script/i,
        /<style/i,
        /<link/i,
        /<!DOCTYPE/i,
        /<\/\w+>/,
        /class\s*=/,
        /id\s*=/
      ],
      extensions: ['.html', '.htm']
    },
    css: {
      keywords: ['color', 'background', 'margin', 'padding', 'border', 'font', 'display', 'position'],
      patterns: [
        /\w+\s*{[^}]*}/,
        /\.\w+\s*{/,
        /#\w+\s*{/,
        /color\s*:/,
        /background\s*:/,
        /margin\s*:/,
        /padding\s*:/,
        /font-size\s*:/,
        /display\s*:/,
        /@media/,
        /!important/
      ],
      extensions: ['.css', '.scss', '.sass', '.less']
    }
  }

  let scores = {}
  
  // Initialize scores
  Object.keys(patterns).forEach(lang => {
    scores[lang] = 0
  })

  // Score based on keywords and patterns
  Object.entries(patterns).forEach(([language, config]) => {
    // Check keywords
    config.keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
      const matches = code.match(regex)
      if (matches) {
        scores[language] += matches.length * 2
      }
    })

    // Check patterns
    config.patterns.forEach(pattern => {
      const matches = code.match(pattern)
      if (matches) {
        scores[language] += matches.length * 3
      }
    })
  })

  // Find the language with the highest score
  const sortedLanguages = Object.entries(scores)
    .sort(([,a], [,b]) => b - a)
    .filter(([,score]) => score > 0)

  if (sortedLanguages.length === 0) {
    return { language: 'unknown', confidence: 0 }
  }

  const [topLanguage, topScore] = sortedLanguages[0]
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0)
  const confidence = totalScore > 0 ? Math.min(topScore / totalScore, 1) : 0

  return {
    language: topLanguage,
    confidence: Math.round(confidence * 100) / 100,
    alternatives: sortedLanguages.slice(1, 3).map(([lang, score]) => ({
      language: lang,
      confidence: Math.round((score / totalScore) * 100) / 100
    }))
  }
}

export const getLanguageDisplayName = (language) => {
  const displayNames = {
    javascript: 'JavaScript',
    python: 'Python',
    java: 'Java',
    cpp: 'C++',
    c: 'C',
    csharp: 'C#',
    php: 'PHP',
    ruby: 'Ruby',
    go: 'Go',
    rust: 'Rust',
    sql: 'SQL',
    html: 'HTML',
    css: 'CSS',
    unknown: 'Unknown'
  }
  
  return displayNames[language] || language
}
