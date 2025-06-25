# ⚡ Fly.io Quick Start - AI Code Assistant

## 🚀 Deploy in 5 Minutes

### Prerequisites
- [Fly.io account](https://fly.io) with payment method
- [Fly.io CLI](https://fly.io/docs/hands-on/install-flyctl/) installed
- Git repository cloned locally

---

## 📋 Quick Deployment Steps

### 1. Install Fly.io CLI

#### Windows (PowerShell as Administrator)
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

#### macOS/Linux
```bash
curl -L https://fly.io/install.sh | sh
```

### 2. Login to Fly.io
```bash
flyctl auth login
```

### 3. Initialize App
```bash
# Navigate to project directory
cd code-analysis

# Switch to flyio-deployment branch
git checkout flyio-deployment

# Initialize Fly.io app
flyctl launch --no-deploy

# Choose:
# - App name: ai-code-assistant (or your choice)
# - Region: Choose closest to your users
# - PostgreSQL: Yes
# - Redis: No
```

### 4. Set Environment Variables
```bash
# Generate and set secret key
flyctl secrets set SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")

# Set environment
flyctl secrets set FLASK_ENV=production
flyctl secrets set NODE_ENV=production

# Set AI provider API key (choose one or more)
flyctl secrets set OPENAI_API_KEY=sk-your-openai-key
flyctl secrets set ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Optional: GitHub integration
flyctl secrets set GITHUB_TOKEN=ghp-your-github-token
```

### 5. Deploy
```bash
# Deploy application
flyctl deploy

# Monitor deployment
flyctl logs
```

### 6. Verify
```bash
# Check status
flyctl status

# Open in browser
flyctl open

# Test health endpoint
curl $(flyctl info --json | jq -r '.Hostname')/api/llm/providers
```

---

## 🛠️ Alternative: Automated Deployment

### Windows (PowerShell)
```powershell
# Run automated deployment script
.\deploy-flyio.ps1
```

### macOS/Linux
```bash
# Run automated deployment script
./deploy-flyio.sh
```

---

## 🔧 Configuration Summary

### Files Created for Fly.io
- `fly.toml` - Fly.io configuration
- `Dockerfile.flyio` - Optimized Dockerfile
- `backend/src/init_db.py` - Database initialization
- `deploy-flyio.sh` / `deploy-flyio.ps1` - Deployment scripts

### Key Features
- ✅ **Auto-scaling**: Scales to zero when idle
- ✅ **PostgreSQL**: Persistent database storage
- ✅ **Health checks**: Automatic monitoring
- ✅ **HTTPS**: Automatic SSL certificates
- ✅ **Global CDN**: Fast content delivery

---

## 💰 Cost Estimate

### Fly.io Pricing (Pay-as-you-go)
- **Machines**: ~$0.0000022/second when running
- **Storage**: $0.15/GB/month
- **Bandwidth**: $0.02/GB outbound
- **PostgreSQL**: Included in machine costs

### Typical Monthly Costs
- **Light usage**: $5-15/month
- **Medium usage**: $15-30/month
- **Heavy usage**: $30+/month

### Cost Optimization
```bash
# Auto-stop when idle (saves money)
flyctl scale count 0 --max-per-region 1

# Use smaller machines for development
flyctl scale memory 512
```

---

## 🔍 Monitoring & Management

### Essential Commands
```bash
# Check app status
flyctl status

# View real-time logs
flyctl logs -f

# Scale application
flyctl scale count 1

# Update secrets
flyctl secrets set NEW_SECRET=value

# SSH into machine
flyctl ssh console

# Database access
flyctl postgres connect -a ai-code-assistant-db
```

### Health Monitoring
- **Health endpoint**: `/api/llm/providers`
- **Auto-restart**: On health check failures
- **Metrics**: Available in Fly.io dashboard

---

## 🚨 Troubleshooting

### Common Issues & Solutions

#### Build Failures
```bash
# Check build logs
flyctl logs

# Test build locally
docker build -f Dockerfile.flyio -t test .
```

#### App Won't Start
```bash
# Check machine status
flyctl machine list

# View startup logs
flyctl logs --app ai-code-assistant

# Restart machine
flyctl machine restart
```

#### Database Connection Issues
```bash
# Check database status
flyctl postgres list

# Verify DATABASE_URL is set
flyctl secrets list | grep DATABASE_URL

# Test database connection
flyctl postgres connect -a ai-code-assistant-db
```

#### Health Check Failures
```bash
# Test health endpoint locally
curl http://localhost:5000/api/llm/providers

# Check health check configuration in fly.toml
# Increase timeout if needed
```

---

## 🔄 Updates & Maintenance

### Deploy Updates
```bash
# After making code changes
git add .
git commit -m "Update application"
git push origin flyio-deployment

# Deploy to Fly.io
flyctl deploy
```

### Rollback
```bash
# List recent releases
flyctl releases

# Rollback to previous version
flyctl releases rollback
```

### Environment Updates
```bash
# Update API keys
flyctl secrets set OPENAI_API_KEY=new-key

# Remove old secrets
flyctl secrets unset OLD_SECRET
```

---

## ✅ Success Checklist

### ✅ Deployment Successful When:
- [ ] `flyctl status` shows "running"
- [ ] Health endpoint returns 200 OK
- [ ] Frontend loads in browser
- [ ] AI features work with configured providers
- [ ] Database operations complete successfully
- [ ] No critical errors in logs

### ✅ Ready for Production When:
- [ ] Custom domain configured (optional)
- [ ] Monitoring alerts set up
- [ ] Backup strategy implemented
- [ ] Performance tested under load
- [ ] Security review completed

---

## 🎯 Next Steps

### After Successful Deployment
1. **Configure custom domain** (optional)
2. **Set up monitoring alerts**
3. **Test all AI features**
4. **Share with users**
5. **Monitor usage and costs**

### Scaling for Production
```bash
# Increase machine count for high availability
flyctl scale count 2

# Use larger machines for better performance
flyctl scale memory 1024

# Deploy to multiple regions
flyctl regions add lax syd
```

---

## 📞 Support

### Getting Help
- **Fly.io Docs**: [fly.io/docs](https://fly.io/docs)
- **Community**: [community.fly.io](https://community.fly.io)
- **Discord**: [fly.io/discord](https://fly.io/discord)

### Application Issues
- **Logs**: `flyctl logs`
- **Status**: `flyctl status`
- **GitHub Issues**: For application-specific problems

---

## 🎉 You're Live!

**Congratulations! Your AI Code Assistant is now running on Fly.io!** 🚀

Your application is:
- ✅ **Globally accessible** with automatic HTTPS
- ✅ **Auto-scaling** based on demand
- ✅ **Monitored** with health checks
- ✅ **Backed up** with PostgreSQL
- ✅ **Cost-optimized** with pay-as-you-go pricing

**Happy coding with your AI assistant in the cloud!** 🌟
