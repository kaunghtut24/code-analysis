# Contributing to AI Code Assistant

Thank you for your interest in contributing to AI Code Assistant! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues
- Use the [GitHub Issues](https://github.com/kaunghtut24/code-analysis/issues) page
- Search existing issues before creating a new one
- Provide detailed information including:
  - Steps to reproduce
  - Expected vs actual behavior
  - Environment details (OS, browser, versions)
  - Screenshots or error messages

### Suggesting Features
- Open a [GitHub Discussion](https://github.com/kaunghtut24/code-analysis/discussions)
- Describe the feature and its use case
- Explain why it would be valuable
- Consider implementation complexity

### Code Contributions

#### 1. Fork and Clone
```bash
# Fork the repository on GitHub
git clone https://github.com/your-username/code-analysis.git
cd code-analysis
```

#### 2. Set Up Development Environment
```bash
# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install
```

#### 3. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

#### 4. Make Changes
- Follow the coding standards below
- Write tests for new functionality
- Update documentation as needed
- Test your changes thoroughly

#### 5. Commit and Push
```bash
git add .
git commit -m "feat: add new feature description"
git push origin feature/your-feature-name
```

#### 6. Create Pull Request
- Open a PR against the `main` branch
- Provide a clear description of changes
- Link related issues
- Ensure all checks pass

## 📝 Coding Standards

### Python (Backend)
- Follow PEP 8 style guide
- Use type hints where appropriate
- Write docstrings for functions and classes
- Use meaningful variable and function names

```python
def analyze_code(code: str, analysis_type: str) -> dict:
    """
    Analyze code using AI provider.
    
    Args:
        code: The code to analyze
        analysis_type: Type of analysis to perform
        
    Returns:
        Dictionary containing analysis results
    """
    pass
```

### JavaScript/React (Frontend)
- Use ES6+ features
- Follow React best practices
- Use functional components with hooks
- Use meaningful component and variable names

```jsx
// Good
const CodeAnalyzer = ({ githubToken, setSidebarOpen }) => {
  const [code, setCode] = useState('')
  
  return (
    <div className="code-analyzer">
      {/* Component content */}
    </div>
  )
}

// Use descriptive prop names
<ChatMessage 
  message={message}
  onCopy={handleCopy}
  copiedStates={copiedStates}
/>
```

### CSS/Styling
- Use Tailwind CSS classes
- Follow mobile-first responsive design
- Use semantic class names for custom CSS
- Maintain consistent spacing and colors

```jsx
// Good - Mobile-first responsive
<div className="p-4 sm:p-6 lg:p-8">
  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
    Title
  </h1>
</div>
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
python -m pytest tests/
```

### Frontend Testing
```bash
cd frontend
npm run test
```

### Manual Testing
- Test on different screen sizes
- Verify mobile responsiveness
- Test with different AI providers
- Check error handling

## 📚 Documentation

### Code Documentation
- Add comments for complex logic
- Update README.md for new features
- Include examples in documentation
- Keep API documentation current

### Commit Messages
Use conventional commit format:
- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation changes
- `style:` formatting changes
- `refactor:` code refactoring
- `test:` adding tests
- `chore:` maintenance tasks

Examples:
```
feat: add copy button to code blocks
fix: resolve mobile sidebar overlay issue
docs: update deployment instructions
style: improve responsive design for tablets
```

## 🔍 Code Review Process

### For Contributors
- Ensure your code follows the style guide
- Write clear commit messages
- Test your changes thoroughly
- Update documentation as needed
- Be responsive to feedback

### For Reviewers
- Be constructive and helpful
- Focus on code quality and maintainability
- Check for security issues
- Verify tests pass
- Ensure documentation is updated

## 🚀 Release Process

### Version Numbering
We follow [Semantic Versioning](https://semver.org/):
- `MAJOR.MINOR.PATCH`
- Major: Breaking changes
- Minor: New features (backward compatible)
- Patch: Bug fixes

### Release Checklist
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Version numbers bumped
- [ ] Changelog updated
- [ ] Security review completed

## 🛡️ Security

### Reporting Security Issues
- **DO NOT** open public issues for security vulnerabilities
- Email security concerns to: [security@example.com]
- Include detailed information about the vulnerability
- Allow time for investigation before public disclosure

### Security Guidelines
- Never commit API keys or secrets
- Validate all user inputs
- Use HTTPS in production
- Follow OWASP security guidelines
- Keep dependencies updated

## 📞 Getting Help

### Community Support
- [GitHub Discussions](https://github.com/kaunghtut24/code-analysis/discussions)
- [GitHub Issues](https://github.com/kaunghtut24/code-analysis/issues)

### Development Questions
- Check existing documentation first
- Search closed issues and discussions
- Provide context and code examples
- Be specific about your environment

## 🎉 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- GitHub contributor graphs

Thank you for contributing to AI Code Assistant! 🚀
