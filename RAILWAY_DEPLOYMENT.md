# 🚀 Railway Deployment Guide - AI Code Assistant

## 📋 Pre-Deployment Checklist

### ✅ Repository Preparation
- [x] **Dockerfile**: Multi-stage build configuration
- [x] **railway.json**: Railway-specific configuration
- [x] **Procfile**: Process definition for Railway
- [x] **package.json**: Root-level build scripts
- [x] **Requirements**: Updated with PostgreSQL and Gunicorn
- [x] **Environment Config**: Production-ready Flask configuration

### ✅ Code Modifications for Cloud
- [x] **Database**: PostgreSQL support added for Railway
- [x] **Ollama Handling**: Graceful fallback when Ollama unavailable
- [x] **Environment Variables**: Production configuration support
- [x] **Static Files**: Proper frontend serving configuration
- [x] **Health Checks**: API endpoint for Railway health monitoring

---

## 🔧 Railway Setup Instructions

### Step 1: Create Railway Project
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway new
```

### Step 2: Connect Repository
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `code-analysis` repository
5. Railway will auto-detect the configuration

### Step 3: Add PostgreSQL Database
1. In your Railway project dashboard
2. Click "New Service"
3. Select "Database" → "PostgreSQL"
4. Railway will automatically set `DATABASE_URL` environment variable

### Step 4: Configure Environment Variables
Set these in Railway dashboard under "Variables":

#### Required Variables
```bash
# Application
SECRET_KEY=your-super-secret-key-here
FLASK_ENV=production
NODE_ENV=production

# Database (automatically set by Railway PostgreSQL)
DATABASE_URL=postgresql://... (auto-generated)

# AI Providers (at least one required)
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Optional
GITHUB_TOKEN=ghp_your-github-token
AZURE_OPENAI_API_KEY=your-azure-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
```

#### Generate Secret Key
```python
import secrets
print(secrets.token_urlsafe(32))
```

---

## 🏗️ Build Process

### Railway Build Steps
1. **Frontend Build**: `npm run build:railway`
   - Installs frontend dependencies
   - Builds React app with Vite
   - Outputs to `frontend/dist/`

2. **Backend Setup**: 
   - Installs Python dependencies
   - Configures Flask for production
   - Sets up PostgreSQL connection

3. **Static File Serving**:
   - Flask serves built frontend from `frontend/dist/`
   - Single-page app routing handled

### Build Configuration
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build:railway"
  },
  "deploy": {
    "startCommand": "python backend/src/main.py",
    "healthcheckPath": "/api/llm/providers"
  }
}
```

---

## 🌐 Production Features

### ✅ Cloud-Optimized Features
- **PostgreSQL Database**: Persistent data storage
- **Auto-Scaling**: Railway handles traffic spikes
- **HTTPS**: Automatic SSL certificates
- **CDN**: Global content delivery
- **Health Monitoring**: Automatic restart on failures

### ✅ AI Provider Support
- **OpenAI**: GPT-3.5, GPT-4 models
- **Anthropic**: Claude models
- **Azure OpenAI**: Enterprise OpenAI access
- **Custom Providers**: Configurable endpoints
- **Ollama**: Disabled in cloud (local development only)

### ✅ Fallback Behavior
- **No Ollama**: Gracefully falls back to cloud providers
- **Demo Mode**: Works without any API keys (limited functionality)
- **Error Handling**: Proper error messages for missing configuration

---

## 🔍 Deployment Verification

### Health Check Endpoints
```bash
# Check application status
curl https://your-app.railway.app/api/llm/providers

# Test AI functionality (requires API key)
curl -X POST https://your-app.railway.app/api/llm/test-connection \
  -H "Content-Type: application/json" \
  -d '{"provider":"openai","model":"gpt-3.5-turbo","api_key":"your-key"}'
```

### Expected Responses
```json
{
  "providers": {
    "openai": {...},
    "anthropic": {...},
    "azure": {...}
  },
  "default_provider": "openai",
  "environment": "cloud"
}
```

---

## 🚨 Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check build logs in Railway dashboard
# Common fixes:
- Ensure Node.js 18+ in package.json engines
- Verify frontend/package.json exists
- Check for syntax errors in build scripts
```

#### 2. Database Connection Issues
```bash
# Verify DATABASE_URL is set
# Check PostgreSQL service is running
# Ensure psycopg2-binary is in requirements.txt
```

#### 3. Static File 404 Errors
```bash
# Verify frontend build completed successfully
# Check Flask static_folder configuration
# Ensure index.html exists in frontend/dist/
```

#### 4. AI Provider Errors
```bash
# Verify API keys are set correctly
# Check provider endpoints are accessible
# Test with simple API calls first
```

### Debug Commands
```bash
# Check environment variables
railway variables

# View application logs
railway logs

# Connect to database
railway connect postgresql
```

---

## 📊 Performance Optimization

### Railway-Specific Optimizations
- **Build Caching**: Dependencies cached between builds
- **Static Assets**: Served efficiently by Railway CDN
- **Database Pooling**: PostgreSQL connection optimization
- **Memory Management**: Proper Python memory handling

### Monitoring
- **Railway Metrics**: CPU, memory, network usage
- **Application Logs**: Structured logging for debugging
- **Health Checks**: Automatic failure detection
- **Alerts**: Email notifications for issues

---

## 🔄 Deployment Workflow

### Automatic Deployment
```bash
# Push to main branch triggers deployment
git push origin main

# Railway automatically:
1. Detects changes
2. Runs build process
3. Deploys new version
4. Runs health checks
5. Routes traffic to new deployment
```

### Manual Deployment
```bash
# Using Railway CLI
railway up

# Or redeploy from dashboard
# Project → Deployments → Redeploy
```

---

## 🎯 Post-Deployment Tasks

### 1. Configure Custom Domain (Optional)
1. Railway Dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. SSL certificate auto-generated

### 2. Set Up Monitoring
1. Enable Railway metrics
2. Configure log retention
3. Set up alert notifications
4. Monitor resource usage

### 3. User Testing
1. Test all AI features with cloud providers
2. Verify file upload/download functionality
3. Check responsive design on mobile
4. Test error handling scenarios

---

## 💰 Cost Considerations

### Railway Pricing
- **Hobby Plan**: $5/month (suitable for development)
- **Pro Plan**: $20/month (recommended for production)
- **Usage-based**: Additional costs for high traffic

### AI Provider Costs
- **OpenAI**: Pay-per-token usage
- **Anthropic**: Pay-per-token usage
- **Azure**: Enterprise pricing available

### Optimization Tips
- Use caching to reduce AI API calls
- Implement rate limiting for cost control
- Monitor usage patterns
- Consider model selection based on cost/performance

---

## ✅ Deployment Ready

**Status**: ✅ **READY FOR RAILWAY DEPLOYMENT**

**Configuration**: Complete  
**Dependencies**: Updated  
**Environment**: Production-ready  
**Documentation**: Comprehensive  

### Quick Deploy Command
```bash
# One-command deployment
railway up --detach
```

**Your AI Code Assistant is ready for the cloud! 🚀**
