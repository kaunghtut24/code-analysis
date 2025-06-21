# AI Code Assistant

A powerful web application for analyzing and improving code using multiple AI providers including OpenAI, Anthropic, Azure OpenAI, and local Ollama models.

## ✨ Features

### 🤖 Multi-Provider AI Support
- **OpenAI**: GPT-4o, GPT-4o-mini, GPT-4-turbo, and more
- **Anthropic**: Claude-3.5-Sonnet, Claude-3-Opus, Claude-3-Haiku
- **Azure OpenAI**: Enterprise-grade OpenAI models
- **Ollama**: Local AI models (completely offline)
- **Custom Providers**: Any OpenAI-compatible API

### 📱 Mobile-First Responsive Design
- **Mobile Optimized**: Perfect experience on phones and tablets
- **Touch-Friendly**: 44px minimum touch targets
- **Responsive Layout**: Adapts to any screen size
- **Mobile Navigation**: Collapsible sidebar with smooth animations

### 💬 Advanced Chat Interface
- **Code Block Detection**: Automatic formatting of code snippets
- **Copy Buttons**: One-click copying for all code blocks and inline code
- **Syntax Highlighting**: Language-specific code formatting
- **Follow-up Questions**: Interactive conversations about your code
- **Session Memory**: Maintains context throughout conversations

### 🔍 Code Analysis Features
- **Multiple Analysis Types**: General, Debug, Improve, Correct
- **Repository Integration**: Direct GitHub repository browsing
- **File Analysis**: Analyze individual files or entire codebases
- **Real-time Results**: Instant AI-powered code insights

### 🔧 Developer Experience
- **Easy Setup**: Simple configuration with API keys
- **Flexible Models**: Use preset models or enter custom model names
- **Temperature Control**: Adjust AI creativity/focus
- **Connection Testing**: Verify API connections before use

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.8+ and pip
- **Git** for repository access
- **API Keys** for your chosen AI provider

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/kaunghtut24/code-analysis.git
cd code-analysis
```

2. **Setup Backend**
```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

3. **Setup Frontend**
```bash
cd ../frontend
npm install
```

### Configuration

1. **Start the Backend**
```bash
cd backend
# Activate virtual environment if not already active
python src/app.py
```

2. **Start the Frontend**
```bash
cd frontend
npm run dev
```

3. **Open your browser** to `http://localhost:3000`

4. **Configure API Keys** in Settings:
   - GitHub Personal Access Token
   - AI Provider API Key (OpenAI, Anthropic, etc.)
   - Or setup Ollama for local models

## 🔑 API Key Setup

### GitHub Token
1. Go to [GitHub Settings > Tokens](https://github.com/settings/tokens)
2. Generate a new token with `repo` scope
3. Add it in Settings > GitHub Token

### AI Provider Keys

#### OpenAI
1. Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add it in Settings > AI Provider API Key

#### Anthropic
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Generate an API key
3. Select "Anthropic" provider and add your key

#### Ollama (Local)
1. Install [Ollama](https://ollama.ai)
2. Pull a model: `ollama pull llama3.2:3b`
3. Start Ollama: `ollama serve`
4. Select "Ollama (Local)" - no API key needed!

## 📖 Usage Guide

### Analyzing Code
1. **Direct Input**: Paste code in the Code Analyzer
2. **Repository Browse**: Use Repository Explorer to select files
3. **Choose Analysis Type**: General, Debug, Improve, or Correct
4. **Get Results**: AI analysis with actionable insights

### Chat Features
- **Ask Follow-ups**: Continue conversations about your code
- **Copy Code**: Click copy buttons on any code snippet
- **Mobile Friendly**: Optimized for mobile devices

### Repository Integration
1. Configure GitHub token in Settings
2. Browse your repositories in Repository Explorer
3. Navigate folders and select files
4. Analyze directly from repository files

## 🛠️ Development

### Project Structure
```
code-analysis/
├── backend/           # Flask API server
│   ├── src/
│   │   ├── app.py    # Main application
│   │   └── routes/   # API endpoints
│   └── requirements.txt
├── frontend/          # React application
│   ├── src/
│   │   ├── components/
│   │   └── lib/
│   └── package.json
└── README.md
```

### Available Scripts

#### Backend
```bash
cd backend
python src/app.py          # Start development server
pip install -r requirements.txt  # Install dependencies
```

#### Frontend
```bash
cd frontend
npm run dev                # Start development server
npm run build             # Build for production
npm run preview           # Preview production build
```

### Environment Variables
Create `.env` files for configuration:

**Backend (.env)**
```
FLASK_ENV=development
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
```

**Frontend (.env.local)**
```
VITE_API_BASE_URL=http://localhost:5000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/kaunghtut24/code-analysis/issues)
- **Discussions**: [GitHub Discussions](https://github.com/kaunghtut24/code-analysis/discussions)

## 🙏 Acknowledgments

- Built with React, Flask, and Tailwind CSS
- AI integration via LangChain
- Icons by Lucide React
- UI components by shadcn/ui
