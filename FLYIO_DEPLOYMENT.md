# 🚀 Fly.io Deployment Guide - AI Code Assistant

## 📋 Prerequisites

### ✅ Required Tools
- **Fly.io CLI**: Install from [fly.io/docs/hands-on/install-flyctl/](https://fly.io/docs/hands-on/install-flyctl/)
- **Docker**: Required for building images
- **Git**: For version control

### ✅ Fly.io Account
1. Sign up at [fly.io](https://fly.io)
2. Verify your account
3. Add payment method (required for deployment)

---

## 🛠️ Installation & Setup

### Step 1: Install Fly.io CLI

#### Windows (PowerShell)
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

#### macOS/Linux
```bash
curl -L https://fly.io/install.sh | sh
```

#### Verify Installation
```bash
flyctl version
```

### Step 2: Login to Fly.io
```bash
flyctl auth login
```

---

## 🚀 Deployment Process

### Step 1: Initialize Fly.io App
```bash
# Navigate to project directory
cd /path/to/code-analysis

# Initialize Fly.io app (this will create/update fly.toml)
flyctl launch --no-deploy

# Follow the prompts:
# - App name: ai-code-assistant (or your preferred name)
# - Region: Choose closest to your users
# - PostgreSQL: Yes (recommended)
# - Redis: No (not needed)
```

### Step 2: Configure Environment Variables
```bash
# Set required environment variables
flyctl secrets set SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")
flyctl secrets set FLASK_ENV=production
flyctl secrets set NODE_ENV=production

# Set AI provider API keys (at least one required)
flyctl secrets set OPENAI_API_KEY=sk-your-openai-key
flyctl secrets set ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Optional: GitHub integration
flyctl secrets set GITHUB_TOKEN=ghp-your-github-token

# Optional: Azure OpenAI
flyctl secrets set AZURE_OPENAI_API_KEY=your-azure-key
flyctl secrets set AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
```

### Step 3: Add PostgreSQL Database
```bash
# Create PostgreSQL database
flyctl postgres create --name ai-code-assistant-db

# Attach database to your app
flyctl postgres attach --app ai-code-assistant ai-code-assistant-db
```

### Step 4: Deploy Application
```bash
# Deploy to Fly.io
flyctl deploy

# Monitor deployment
flyctl logs
```

---

## 🔧 Configuration Details

### Fly.toml Configuration
The `fly.toml` file contains:
- **App settings**: Name, region, scaling
- **Build configuration**: Dockerfile path
- **HTTP service**: Port, health checks
- **Environment variables**: Production settings
- **Machine specs**: Memory, CPU allocation

### Key Features
- **Auto-scaling**: Scales to zero when not in use
- **Health checks**: Monitors `/api/llm/providers` endpoint
- **HTTPS**: Automatic SSL certificates
- **Global deployment**: Multiple regions available

---

## 🌐 Post-Deployment

### Verify Deployment
```bash
# Check app status
flyctl status

# View logs
flyctl logs

# Open in browser
flyctl open
```

### Test Endpoints
```bash
# Get your app URL
APP_URL=$(flyctl info --json | jq -r '.Hostname')

# Test health endpoint
curl https://$APP_URL/api/llm/providers

# Test AI functionality
curl -X POST https://$APP_URL/api/llm/test-connection \
  -H "Content-Type: application/json" \
  -d '{"provider":"openai","model":"gpt-3.5-turbo"}'
```

---

## 📊 Monitoring & Management

### View Application Metrics
```bash
# App status and metrics
flyctl status

# Real-time logs
flyctl logs -f

# Machine information
flyctl machine list
```

### Scaling
```bash
# Scale up/down
flyctl scale count 2

# Change machine size
flyctl scale memory 2048

# Auto-scaling (recommended)
flyctl scale count 1 --max-per-region 3
```

### Database Management
```bash
# Connect to database
flyctl postgres connect -a ai-code-assistant-db

# Database proxy for local access
flyctl proxy 5432 -a ai-code-assistant-db
```

---

## 🔄 Updates & Maintenance

### Deploy Updates
```bash
# Deploy latest changes
git push origin flyio-deployment
flyctl deploy

# Deploy specific version
flyctl deploy --image-ref registry.fly.io/ai-code-assistant:latest
```

### Rollback
```bash
# List releases
flyctl releases

# Rollback to previous version
flyctl releases rollback
```

### Environment Variables
```bash
# List current secrets
flyctl secrets list

# Update secret
flyctl secrets set OPENAI_API_KEY=new-key

# Remove secret
flyctl secrets unset OLD_SECRET
```

---

## 💰 Cost Optimization

### Fly.io Pricing
- **Free tier**: 3 shared-cpu-1x machines
- **Paid usage**: $0.0000022/second per machine
- **Storage**: $0.15/GB/month
- **Bandwidth**: $0.02/GB

### Cost-Saving Tips
```bash
# Auto-stop when idle
flyctl scale count 0 --max-per-region 1

# Use smaller machines for development
flyctl scale memory 512

# Monitor usage
flyctl billing show
```

---

## 🚨 Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check build logs
flyctl logs --app ai-code-assistant

# Local build test
docker build -f Dockerfile.flyio -t ai-code-assistant .
```

#### 2. Database Connection Issues
```bash
# Check database status
flyctl status --app ai-code-assistant-db

# Verify DATABASE_URL is set
flyctl secrets list | grep DATABASE_URL
```

#### 3. Health Check Failures
```bash
# Check health endpoint locally
curl http://localhost:5000/api/llm/providers

# Adjust health check timeout in fly.toml
```

#### 4. Memory Issues
```bash
# Increase memory allocation
flyctl scale memory 1024

# Monitor memory usage
flyctl metrics
```

### Debug Commands
```bash
# SSH into machine
flyctl ssh console

# View machine logs
flyctl logs --app ai-code-assistant

# Check machine status
flyctl machine list
```

---

## 🔒 Security Best Practices

### Environment Variables
- Use `flyctl secrets` for sensitive data
- Never commit API keys to version control
- Rotate secrets regularly

### Database Security
- Use strong passwords
- Enable SSL connections
- Regular backups

### Application Security
- Keep dependencies updated
- Monitor for vulnerabilities
- Use HTTPS only

---

## 📈 Performance Optimization

### Caching
- Enable application-level caching
- Use Redis for session storage (optional)
- Implement CDN for static assets

### Database
- Use connection pooling
- Optimize queries
- Regular maintenance

### Monitoring
```bash
# Set up monitoring
flyctl monitor dashboard

# Custom metrics
flyctl metrics
```

---

## ✅ Deployment Checklist

### Pre-Deployment
- [x] Fly.io CLI installed and authenticated
- [x] Docker installed and running
- [x] Environment variables configured
- [x] Database created and attached

### Deployment
- [x] `flyctl launch` completed
- [x] Secrets configured
- [x] Database attached
- [x] `flyctl deploy` successful

### Post-Deployment
- [x] Health checks passing
- [x] Application accessible
- [x] AI features working
- [x] Database connected
- [x] Monitoring configured

---

## 🎯 Success Criteria

### ✅ Deployment Successful When:
- Application builds without errors
- Health checks return 200 status
- Frontend loads and is interactive
- AI features work with configured providers
- Database operations complete successfully
- Logs show no critical errors

---

## 📞 Support Resources

### Fly.io Documentation
- [Official Docs](https://fly.io/docs/)
- [Community Forum](https://community.fly.io/)
- [Discord](https://fly.io/discord)

### Application Support
- Check logs: `flyctl logs`
- Monitor status: `flyctl status`
- Community: GitHub Issues

**Your AI Code Assistant is ready for Fly.io! 🚀**
