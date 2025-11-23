# Security Policy

## Security Features

### Authentication & Authorization
- **JWT Tokens**: Access tokens with 15-minute expiration for security
- **Refresh Tokens**: 7-day expiration with secure storage in database
- **Password Hashing**: BCrypt with salt rounds for secure password storage
- **Token Invalidation**: Logout endpoint that invalidates refresh tokens

### Rate Limiting
The application implements comprehensive rate limiting to prevent abuse:

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 attempts per 15 minutes per IP
- **Model API**: 20 requests per minute per IP
- **File Uploads**: 10 uploads per hour per IP

Rate limits can be configured via environment variables:
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
MODEL_RATE_LIMIT_MAX=20
```

### Database Security
- **Parameterized Queries**: Using Prisma ORM to prevent SQL injection
- **Connection Pooling**: Managed by Prisma for optimal performance
- **Data Validation**: Input validation on all endpoints

### Best Practices for Production

#### 1. Environment Variables
- Change all default secrets (JWT_SECRET, JWT_REFRESH_SECRET)
- Use strong, randomly generated secrets (minimum 32 characters)
- Never commit .env files to version control

#### 2. HTTPS/TLS
- Always use HTTPS in production
- Implement TLS termination at load balancer or reverse proxy
- Use valid SSL certificates (Let's Encrypt recommended)

#### 3. Database
- Use managed database service (AWS RDS, Google Cloud SQL)
- Enable automated backups
- Use connection encryption
- Restrict database access to application servers only

#### 4. CORS Configuration
- Configure CORS to allow only trusted domains
- Update cors() configuration in server.ts for production

#### 5. File Uploads
- Validate file types and sizes
- Store uploads in object storage (S3, GCS) in production
- Implement virus scanning for uploaded files
- Set maximum file size limits

#### 6. API Keys
- Rotate API keys regularly
- Use different keys for development and production
- Store keys in secure secret management (AWS Secrets Manager, HashiCorp Vault)

#### 7. Monitoring & Logging
- Implement centralized logging (ELK Stack, CloudWatch)
- Monitor authentication failures
- Set up alerts for suspicious activity
- Log all security-relevant events

#### 8. Dependencies
- Regularly update dependencies
- Run npm audit to check for vulnerabilities
- Use automated dependency updates (Dependabot, Renovate)

## Reporting Security Issues

If you discover a security vulnerability, please email security@example.com instead of using the issue tracker.

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 48 hours and work to resolve the issue promptly.

## Security Checklist for Production Deployment

- [ ] Change all default secrets to strong random values
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS for production domains only
- [ ] Use managed database service with encryption
- [ ] Enable database backups
- [ ] Store file uploads in object storage
- [ ] Implement file type validation and size limits
- [ ] Set up monitoring and alerting
- [ ] Configure centralized logging
- [ ] Review and update rate limits based on usage
- [ ] Implement API key rotation schedule
- [ ] Set up automated security scanning
- [ ] Enable database connection encryption
- [ ] Review and restrict network access rules
- [ ] Implement API gateway or reverse proxy
- [ ] Set up DDoS protection
- [ ] Configure security headers (helmet.js)
- [ ] Implement CSRF protection for sensitive operations
- [ ] Regular security audits and penetration testing

## Updates and Patches

Security patches will be released as needed. Subscribe to releases to stay informed about security updates.

## Compliance

This application implements security best practices but users are responsible for ensuring compliance with relevant regulations (GDPR, HIPAA, etc.) based on their use case.
