# Production-Ready AI Platform

A full-stack AI chatbot platform with user authentication, multi-user project support, real-time chat, and hybrid model integration (local GPU + hosted APIs).

## Features

### 🔐 Authentication
- JWT-based authentication with access and refresh tokens
- Secure token storage and automatic refresh mechanism
- Session management with configurable expiration times
- Logout functionality that invalidates refresh tokens

### 📁 Multi-User Projects
- User-specific projects with CRUD operations
- Conversation history per project
- File upload support for documents and datasets
- Message persistence and retrieval

### 🤖 Model Integrations (Hybrid)
- Support for local GPU self-hosted models (HuggingFace, LocalAI)
- Compatible with hosted API streams (OpenAI-compatible APIs)
- Streaming responses for real-time chat experience
- Multiple model adapters: LocalAI, TGI, HuggingFace, OpenAI

### 🏗️ Infrastructure
- Docker Compose for easy deployment
- Health checks and service dependencies
- PostgreSQL database with Prisma ORM
- Next.js frontend with TypeScript
- Express backend with TypeScript

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 15+ (if not using Docker)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd notaf-ckingchatbot
```

### 2. Configure Environment

Create backend/.env:
```bash
cp backend/.env.example backend/.env
```

Edit backend/.env with your settings:
```env
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@db:5432/llmapp
JWT_SECRET=your_secure_random_string_here
JWT_REFRESH_SECRET=another_secure_random_string
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
MODEL_PROXY_URL=http://localai:8080
OPENAI_API_KEY=your_openai_key_here
UPLOAD_DIR=/data/uploads
```

Create frontend/.env.local:
```bash
cp frontend/.env.example frontend/.env.local
```

Edit frontend/.env.local:
```env
NEXT_PUBLIC_API_BASE=http://localhost:4000
```

### 3. Start Services

Using Docker Compose (recommended):
```bash
docker-compose up --build
```

This will start:
- PostgreSQL database on port 5432
- Backend API on port 4000
- Frontend UI on port 3000
- LocalAI service on port 8080 (optional)

### 4. Access the Application

Open http://localhost:3000 in your browser and:
1. Register a new account
2. Create a project
3. Start chatting with AI models

## Development

### Backend Development

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout and invalidate refresh token

### Projects
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `GET /api/projects/:id/messages` - Get project messages
- `POST /api/projects/:id/messages` - Add message to project
- `GET /api/projects/:id/files` - Get project files

### Model API
- `POST /api/model` - Send message to AI model (non-streaming)
- `POST /api/model/stream` - Send message with streaming response

### Files
- `POST /api/files/:projectId` - Upload file to project
- `GET /api/files/download/:id` - Download file

## Model Configuration

The platform supports multiple model providers:

### LocalAI (Local GPU)
```env
MODEL_PROXY_URL=http://localai:8080
```

### HuggingFace
```env
MODEL_PROXY_URL=https://api-inference.huggingface.co/models/your-model
HF_API_KEY=your_hf_token
```

### OpenAI-Compatible APIs
```env
MODEL_PROXY_URL=https://api.openai.com/v1
MODEL_API_KEY=your_api_key
```

## Production Deployment

### Security Checklist
- [ ] Change all JWT secrets to secure random strings
- [ ] Use managed PostgreSQL database
- [ ] Enable HTTPS/TLS
- [ ] Set up proper CORS policies
- [ ] Configure rate limiting
- [ ] Store uploads in S3 or similar object storage
- [ ] Enable database backups
- [ ] Set up monitoring and logging
- [ ] Use environment-specific configurations

### Recommended Infrastructure
- PostgreSQL: AWS RDS, Google Cloud SQL, or similar
- Object Storage: AWS S3, Google Cloud Storage
- Container Hosting: AWS ECS, Google Cloud Run, Azure Container Apps
- GPU Instances: AWS EC2 with GPU, Google Cloud GPUs

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Next.js   │────▶│   Express    │────▶│  PostgreSQL │
│   Frontend  │     │   Backend    │     │  Database   │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Model Adapters│
                    │ (LocalAI/HF/ │
                    │   OpenAI)    │
                    └──────────────┘
```

## Technologies

- **Frontend**: Next.js 14, React 18, TypeScript, SWR
- **Backend**: Node.js, Express, TypeScript, Prisma
- **Database**: PostgreSQL 15 with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **File Uploads**: Multer
- **AI Models**: LocalAI, HuggingFace, OpenAI-compatible APIs

## License

See LICENSE file for details.

## Support

For issues and questions, please open an issue on GitHub.