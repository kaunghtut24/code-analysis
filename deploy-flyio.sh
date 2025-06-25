#!/bin/bash

# Fly.io Deployment Script for AI Code Assistant
# This script automates the deployment process to Fly.io

set -e  # Exit on any error

echo "🚀 AI Code Assistant - Fly.io Deployment Script"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if flyctl is installed
check_flyctl() {
    if ! command -v flyctl &> /dev/null; then
        print_error "flyctl is not installed. Please install it first:"
        echo "  Windows: iwr https://fly.io/install.ps1 -useb | iex"
        echo "  macOS/Linux: curl -L https://fly.io/install.sh | sh"
        exit 1
    fi
    print_success "flyctl is installed"
}

# Check if user is logged in
check_auth() {
    if ! flyctl auth whoami &> /dev/null; then
        print_error "Not logged in to Fly.io. Please run: flyctl auth login"
        exit 1
    fi
    print_success "Authenticated with Fly.io"
}

# Generate secret key
generate_secret_key() {
    python3 -c "import secrets; print(secrets.token_urlsafe(32))"
}

# Set environment variables
set_secrets() {
    print_status "Setting up environment variables..."
    
    # Generate and set secret key
    SECRET_KEY=$(generate_secret_key)
    flyctl secrets set SECRET_KEY="$SECRET_KEY" --stage
    
    # Set environment
    flyctl secrets set FLASK_ENV=production --stage
    flyctl secrets set NODE_ENV=production --stage
    
    print_success "Basic environment variables set"
    
    # Prompt for API keys
    echo ""
    print_warning "Please set your AI provider API keys:"
    echo "Example commands:"
    echo "  flyctl secrets set OPENAI_API_KEY=sk-your-key"
    echo "  flyctl secrets set ANTHROPIC_API_KEY=sk-ant-your-key"
    echo "  flyctl secrets set GITHUB_TOKEN=ghp-your-token"
    echo ""
    read -p "Press Enter after setting your API keys..."
}

# Create and attach database
setup_database() {
    print_status "Setting up PostgreSQL database..."
    
    DB_NAME="ai-code-assistant-db"
    APP_NAME=$(flyctl info --json | jq -r '.Name' 2>/dev/null || echo "ai-code-assistant")
    
    # Check if database already exists
    if flyctl postgres list | grep -q "$DB_NAME"; then
        print_warning "Database $DB_NAME already exists"
    else
        print_status "Creating PostgreSQL database..."
        flyctl postgres create --name "$DB_NAME" --region iad
    fi
    
    # Attach database
    print_status "Attaching database to app..."
    flyctl postgres attach --app "$APP_NAME" "$DB_NAME" || print_warning "Database might already be attached"
    
    print_success "Database setup complete"
}

# Deploy application
deploy_app() {
    print_status "Deploying application to Fly.io..."
    
    # Build and deploy
    flyctl deploy --dockerfile Dockerfile.flyio
    
    print_success "Deployment complete!"
}

# Verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Get app URL
    APP_URL=$(flyctl info --json | jq -r '.Hostname' 2>/dev/null)
    
    if [ "$APP_URL" != "null" ] && [ -n "$APP_URL" ]; then
        print_status "Testing health endpoint..."
        
        # Wait a moment for app to start
        sleep 10
        
        if curl -f "https://$APP_URL/api/llm/providers" &> /dev/null; then
            print_success "Health check passed!"
            print_success "Application is running at: https://$APP_URL"
        else
            print_warning "Health check failed. Check logs with: flyctl logs"
        fi
    else
        print_warning "Could not determine app URL. Check status with: flyctl status"
    fi
}

# Show post-deployment info
show_info() {
    echo ""
    echo "🎉 Deployment Complete!"
    echo "======================"
    echo ""
    echo "Useful commands:"
    echo "  flyctl status          - Check app status"
    echo "  flyctl logs           - View application logs"
    echo "  flyctl open           - Open app in browser"
    echo "  flyctl ssh console    - SSH into the machine"
    echo "  flyctl scale count 1  - Scale to 1 machine"
    echo ""
    echo "To update your app:"
    echo "  git push origin flyio-deployment"
    echo "  flyctl deploy"
    echo ""
}

# Check if app exists and create if needed
check_app_exists() {
    if flyctl info &> /dev/null; then
        print_success "Fly.io app exists"
        return 0
    else
        print_warning "Fly.io app not found. Creating app..."

        echo ""
        print_warning "Please follow the prompts to create your Fly.io app:"
        echo "- App name: ai-code-assistant (or your choice)"
        echo "- Region: Choose closest to your users"
        echo "- PostgreSQL: Yes"
        echo "- Redis: No"
        echo ""

        if flyctl launch --no-deploy; then
            print_success "App created successfully"
            return 0
        else
            print_error "Failed to create app. Please run 'flyctl launch --no-deploy' manually"
            return 1
        fi
    fi
}

# Main deployment flow
main() {
    echo "Starting deployment process..."
    echo ""

    # Pre-flight checks
    check_flyctl
    check_auth

    # Check if app exists and create if needed
    if ! check_app_exists; then
        exit 1
    fi
    
    # Setup process
    set_secrets
    setup_database
    deploy_app
    verify_deployment
    show_info
    
    print_success "All done! Your AI Code Assistant is live on Fly.io! 🚀"
}

# Handle script arguments
case "${1:-}" in
    "secrets")
        check_flyctl
        check_auth
        set_secrets
        ;;
    "database")
        check_flyctl
        check_auth
        setup_database
        ;;
    "deploy")
        check_flyctl
        check_auth
        deploy_app
        ;;
    "verify")
        verify_deployment
        ;;
    *)
        main
        ;;
esac
