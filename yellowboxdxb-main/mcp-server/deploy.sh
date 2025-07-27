#!/bin/bash

# Yellow Box MCP Server Deployment Script

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="yellowbox-8e0e6"
SERVICE_NAME="mcp-server"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo -e "${GREEN}Yellow Box MCP Server Deployment${NC}"
echo "=================================="

# Check if running in correct directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must run from mcp-server directory${NC}"
    exit 1
fi

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    # Check for Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Docker is required but not installed${NC}"
        exit 1
    fi
    
    # Check for gcloud
    if ! command -v gcloud &> /dev/null; then
        echo -e "${RED}Google Cloud SDK is required but not installed${NC}"
        exit 1
    fi
    
    # Check for .env file
    if [ ! -f ".env" ]; then
        echo -e "${RED}.env file not found. Copy .env.example and configure it${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Prerequisites check passed${NC}"
}

# Function to build Docker image
build_image() {
    echo -e "${YELLOW}Building Docker image...${NC}"
    docker build -t ${IMAGE_NAME}:latest -t ${IMAGE_NAME}:$(date +%Y%m%d-%H%M%S) .
    echo -e "${GREEN}Docker image built successfully${NC}"
}

# Function to push to Google Container Registry
push_image() {
    echo -e "${YELLOW}Pushing image to GCR...${NC}"
    docker push ${IMAGE_NAME}:latest
    echo -e "${GREEN}Image pushed successfully${NC}"
}

# Function to deploy to Cloud Run
deploy_cloud_run() {
    echo -e "${YELLOW}Deploying to Cloud Run...${NC}"
    
    # Read environment variables
    source .env
    
    gcloud run deploy ${SERVICE_NAME} \
        --image ${IMAGE_NAME}:latest \
        --platform managed \
        --region ${REGION} \
        --project ${PROJECT_ID} \
        --allow-unauthenticated \
        --memory 2Gi \
        --cpu 2 \
        --timeout 300 \
        --concurrency 1000 \
        --max-instances 10 \
        --min-instances 1 \
        --set-env-vars "NODE_ENV=production" \
        --set-env-vars "FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}" \
        --set-env-vars "SOCKET_IO_CORS_ORIGIN=https://yellowbox.com,https://app.yellowbox.com" \
        --set-secrets "FIREBASE_PRIVATE_KEY=mcp-firebase-key:latest" \
        --set-secrets "JWT_SECRET=mcp-jwt-secret:latest" \
        --set-secrets "N8N_WEBHOOK_AUTH_TOKEN=mcp-n8n-token:latest"
    
    echo -e "${GREEN}Deployment completed successfully${NC}"
}

# Function to set up Redis on Google Cloud
setup_redis() {
    echo -e "${YELLOW}Setting up Redis instance...${NC}"
    
    # Check if Redis instance exists
    if gcloud redis instances describe yellowbox-mcp-redis --region=${REGION} &> /dev/null; then
        echo -e "${GREEN}Redis instance already exists${NC}"
    else
        echo "Creating Redis instance..."
        gcloud redis instances create yellowbox-mcp-redis \
            --size=1 \
            --region=${REGION} \
            --redis-version=redis_6_x \
            --network=default \
            --project=${PROJECT_ID}
    fi
    
    # Get Redis host
    REDIS_HOST=$(gcloud redis instances describe yellowbox-mcp-redis \
        --region=${REGION} \
        --format="value(host)")
    
    echo -e "${GREEN}Redis host: ${REDIS_HOST}${NC}"
}

# Function to create secrets
create_secrets() {
    echo -e "${YELLOW}Creating/updating secrets...${NC}"
    
    # Read from .env file
    source .env
    
    # Create or update secrets
    echo "${FIREBASE_PRIVATE_KEY}" | gcloud secrets create mcp-firebase-key \
        --data-file=- --project=${PROJECT_ID} 2>/dev/null || \
    echo "${FIREBASE_PRIVATE_KEY}" | gcloud secrets versions add mcp-firebase-key \
        --data-file=- --project=${PROJECT_ID}
    
    echo "${JWT_SECRET}" | gcloud secrets create mcp-jwt-secret \
        --data-file=- --project=${PROJECT_ID} 2>/dev/null || \
    echo "${JWT_SECRET}" | gcloud secrets versions add mcp-jwt-secret \
        --data-file=- --project=${PROJECT_ID}
    
    echo "${N8N_WEBHOOK_AUTH_TOKEN}" | gcloud secrets create mcp-n8n-token \
        --data-file=- --project=${PROJECT_ID} 2>/dev/null || \
    echo "${N8N_WEBHOOK_AUTH_TOKEN}" | gcloud secrets versions add mcp-n8n-token \
        --data-file=- --project=${PROJECT_ID}
    
    echo -e "${GREEN}Secrets created/updated${NC}"
}

# Main deployment flow
main() {
    echo "Deployment started at $(date)"
    
    # Check prerequisites
    check_prerequisites
    
    # Authenticate with Google Cloud
    echo -e "${YELLOW}Authenticating with Google Cloud...${NC}"
    gcloud auth configure-docker
    
    # Build and push image
    build_image
    push_image
    
    # Set up infrastructure
    create_secrets
    setup_redis
    
    # Deploy to Cloud Run
    deploy_cloud_run
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
        --platform managed \
        --region ${REGION} \
        --format "value(status.url)")
    
    echo ""
    echo -e "${GREEN}Deployment completed successfully!${NC}"
    echo "Service URL: ${SERVICE_URL}"
    echo "WebSocket endpoint: ${SERVICE_URL}${SOCKET_IO_PATH}"
    echo ""
    echo "Next steps:"
    echo "1. Update Yellow Box web app with new MCP server URL"
    echo "2. Configure N8N webhooks to point to ${SERVICE_URL}/api/webhooks/n8n"
    echo "3. Test WebSocket connection from web app"
    echo "4. Monitor logs: gcloud logging read \"resource.type=cloud_run_revision AND resource.labels.service_name=${SERVICE_NAME}\""
}

# Run main function
main

echo "Deployment finished at $(date)"