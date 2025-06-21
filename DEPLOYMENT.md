# Deployment Guide

This guide covers different deployment options for the AI Code Assistant application.

## 🚀 Production Deployment

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+ and pip
- Git
- Domain name (optional)
- SSL certificate (recommended)

### Environment Setup

#### Backend Environment Variables
Create `backend/.env`:
```bash
# Flask Configuration
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=your-secret-key-here

# API Keys (optional - can be set via UI)
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
AZURE_OPENAI_API_KEY=your-azure-key
AZURE_OPENAI_ENDPOINT=your-azure-endpoint

# Database (optional)
DATABASE_URL=sqlite:///app.db

# CORS Settings
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

#### Frontend Environment Variables
Create `frontend/.env.production`:
```bash
VITE_API_BASE_URL=https://api.yourdomain.com
```

### Docker Deployment (Recommended)

#### 1. Create Dockerfile for Backend
Create `backend/Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/
COPY .env .env

EXPOSE 5000

CMD ["python", "src/app.py"]
```

#### 2. Create Dockerfile for Frontend
Create `frontend/Dockerfile`:
```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 3. Create docker-compose.yml
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
    volumes:
      - ./backend/.env:/app/.env

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
```

#### 4. Deploy with Docker
```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Deployment

#### Backend Deployment
```bash
# 1. Setup production environment
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set environment variables
export FLASK_ENV=production
export SECRET_KEY=your-secret-key

# 4. Start with Gunicorn (recommended)
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 src.app:app

# Or start with Python (development only)
python src/app.py
```

#### Frontend Deployment
```bash
# 1. Build for production
cd frontend
npm install
npm run build

# 2. Serve with nginx, Apache, or any static server
# The built files are in the 'dist' directory

# Example with nginx
sudo cp -r dist/* /var/www/html/
sudo systemctl restart nginx
```

### Cloud Platform Deployment

#### Heroku
1. **Backend (Heroku)**
```bash
# Create Procfile in backend/
echo "web: gunicorn -w 4 -b 0.0.0.0:\$PORT src.app:app" > backend/Procfile

# Deploy
heroku create your-app-backend
heroku config:set FLASK_ENV=production
git subtree push --prefix=backend heroku main
```

2. **Frontend (Netlify/Vercel)**
```bash
# Build command: npm run build
# Publish directory: dist
# Environment variables: VITE_API_BASE_URL=https://your-app-backend.herokuapp.com
```

#### AWS/GCP/Azure
- Use container services (ECS, Cloud Run, Container Instances)
- Deploy using the Docker setup above
- Configure load balancers and SSL certificates

### Nginx Configuration

Create `nginx.conf`:
```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:5000;
    }

    server {
        listen 80;
        server_name yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl;
        server_name yourdomain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
        }

        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

## 🔧 Configuration

### Security Considerations
1. **API Keys**: Never commit API keys to version control
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Configure CORS properly for your domain
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **Input Validation**: Validate all user inputs

### Performance Optimization
1. **Caching**: Implement Redis for session caching
2. **CDN**: Use CDN for static assets
3. **Compression**: Enable gzip compression
4. **Database**: Use PostgreSQL for production
5. **Monitoring**: Set up application monitoring

### Environment-Specific Settings

#### Development
```bash
FLASK_ENV=development
FLASK_DEBUG=True
VITE_API_BASE_URL=http://localhost:5000
```

#### Staging
```bash
FLASK_ENV=staging
FLASK_DEBUG=False
VITE_API_BASE_URL=https://staging-api.yourdomain.com
```

#### Production
```bash
FLASK_ENV=production
FLASK_DEBUG=False
VITE_API_BASE_URL=https://api.yourdomain.com
```

## 📊 Monitoring

### Health Checks
Add health check endpoints:
```python
@app.route('/health')
def health_check():
    return {'status': 'healthy', 'timestamp': datetime.utcnow()}
```

### Logging
Configure structured logging:
```python
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s'
)
```

### Metrics
- Monitor API response times
- Track error rates
- Monitor resource usage
- Set up alerts for failures

## 🔄 Updates and Maintenance

### Rolling Updates
```bash
# 1. Build new version
docker-compose build

# 2. Update with zero downtime
docker-compose up -d --no-deps backend
docker-compose up -d --no-deps frontend
```

### Backup Strategy
- Regular database backups
- Configuration file backups
- SSL certificate backups
- Application logs archival

### Troubleshooting
- Check application logs: `docker-compose logs`
- Monitor resource usage: `docker stats`
- Test API endpoints: `curl https://api.yourdomain.com/health`
- Verify SSL certificates: `openssl s_client -connect yourdomain.com:443`
