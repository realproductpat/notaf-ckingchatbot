# Deployment Guide

This guide covers deploying the AI platform to various environments.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Monitoring & Maintenance](#monitoring--maintenance)

## Prerequisites

### Required
- Docker and Docker Compose (for containerized deployment)
- PostgreSQL 15+ (if not using Docker)
- Node.js 18+ (for local development)
- Git

### Recommended for Production
- Managed PostgreSQL database
- Object storage (S3, GCS) for file uploads
- Load balancer with SSL termination
- Container orchestration (Kubernetes, ECS)
- CI/CD pipeline (GitHub Actions, GitLab CI)

## Local Development

### 1. Clone Repository
```bash
git clone <repository-url>
cd notaf-ckingchatbot
```

### 2. Configure Environment
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your settings

# Frontend
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local
```

### 3. Install Dependencies
```bash
# Backend
cd backend
npm install
npm run prisma:generate

# Frontend
cd ../frontend
npm install
```

### 4. Setup Database
```bash
cd backend
npm run prisma:migrate
```

### 5. Run Development Servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Access the application at http://localhost:3000

## Docker Deployment

### Basic Docker Compose

```bash
# Create environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Edit with your configuration
nano backend/.env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Docker Compose

Create a `docker-compose.prod.yml`:

```yaml
version: "3.8"
services:
  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://user:password@external-db:5432/llmapp
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
    ports:
      - "4000:4000"
    restart: always
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:4000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_BASE: https://api.yourdomain.com
    ports:
      - "3000:3000"
    restart: always
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: always
```

## Cloud Deployment

### AWS Deployment

#### Using AWS ECS (Elastic Container Service)

1. **Create ECR Repositories**
```bash
aws ecr create-repository --repository-name ai-platform-backend
aws ecr create-repository --repository-name ai-platform-frontend
```

2. **Build and Push Images**
```bash
# Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
cd backend
docker build -t ai-platform-backend .
docker tag ai-platform-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/ai-platform-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/ai-platform-backend:latest

# Build and push frontend
cd ../frontend
docker build -t ai-platform-frontend .
docker tag ai-platform-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/ai-platform-frontend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/ai-platform-frontend:latest
```

3. **Create RDS Database**
```bash
aws rds create-db-instance \
  --db-instance-identifier ai-platform-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.3 \
  --master-username admin \
  --master-user-password <secure-password> \
  --allocated-storage 20
```

4. **Create ECS Task Definitions and Services**
Use the AWS Console or CLI to create task definitions and services for backend and frontend.

### Google Cloud Platform

#### Using Google Cloud Run

1. **Setup GCloud CLI**
```bash
gcloud auth login
gcloud config set project <project-id>
```

2. **Create Cloud SQL Instance**
```bash
gcloud sql instances create ai-platform-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1
```

3. **Deploy Backend**
```bash
cd backend
gcloud run deploy ai-platform-backend \
  --source . \
  --region=us-central1 \
  --allow-unauthenticated \
  --set-env-vars="DATABASE_URL=<connection-string>,JWT_SECRET=<secret>"
```

4. **Deploy Frontend**
```bash
cd frontend
gcloud run deploy ai-platform-frontend \
  --source . \
  --region=us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NEXT_PUBLIC_API_BASE=<backend-url>"
```

### Azure Deployment

Use Azure Container Instances or Azure App Service with Container support.

## Environment Configuration

### Backend Environment Variables

```env
# Required
PORT=4000
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=<generate-with: openssl rand -base64 32>
JWT_REFRESH_SECRET=<generate-with: openssl rand -base64 32>

# Optional but recommended
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
MODEL_PROXY_URL=http://model-service:8080
OPENAI_API_KEY=sk-...
UPLOAD_DIR=/app/uploads

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
MODEL_RATE_LIMIT_MAX=20
```

### Frontend Environment Variables

```env
NEXT_PUBLIC_API_BASE=https://api.yourdomain.com
```

## Database Setup

### Initial Migration

```bash
cd backend
npm run prisma:migrate
```

### Backup Strategy

#### PostgreSQL Backup
```bash
# Create backup
pg_dump -h <host> -U <user> -d llmapp > backup.sql

# Restore backup
psql -h <host> -U <user> -d llmapp < backup.sql
```

#### Automated Backups (AWS RDS)
RDS provides automated backups. Configure retention period in AWS Console.

## Monitoring & Maintenance

### Health Checks

Backend health endpoint: `GET /health`

Expected response:
```json
{
  "ok": true
}
```

### Logging

Configure centralized logging:

**Using Winston (add to backend)**
```bash
npm install winston
```

**CloudWatch Logs (AWS)**
Configure in ECS task definition or Lambda

**Stackdriver (GCP)**
Automatically available in Cloud Run

### Monitoring Metrics

Key metrics to monitor:
- Response time (p50, p95, p99)
- Error rate
- Request rate
- Database connections
- Memory usage
- CPU usage
- Disk usage

### Scaling

**Horizontal Scaling**
- Add more container instances
- Use load balancer to distribute traffic

**Vertical Scaling**
- Increase container resources (CPU/memory)
- Upgrade database instance type

### Maintenance Tasks

**Regular**
- Monitor logs for errors
- Check rate limit effectiveness
- Review authentication failures
- Update dependencies

**Monthly**
- Review and optimize database queries
- Analyze usage patterns
- Update security patches
- Rotate API keys

**Quarterly**
- Security audit
- Performance optimization
- Capacity planning
- Disaster recovery testing

## Troubleshooting

### Common Issues

**Database Connection Errors**
- Check DATABASE_URL format
- Verify network connectivity
- Confirm database credentials

**Authentication Failures**
- Verify JWT_SECRET is set correctly
- Check token expiration settings
- Review rate limiting logs

**Model API Errors**
- Verify MODEL_PROXY_URL
- Check API key configuration
- Review model service logs

### Debug Mode

Enable debug logging:
```env
NODE_ENV=development
DEBUG=*
```

## CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Build and push Docker images
        run: |
          # Build and push images
          
      - name: Deploy to ECS
        run: |
          # Update ECS service
```

## Support

For deployment issues, please:
1. Check logs: `docker-compose logs`
2. Verify environment variables
3. Review this documentation
4. Open an issue on GitHub
