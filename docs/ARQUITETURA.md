# 🏗️ ARQUITETURA TÉCNICA - SANTOO

## 📋 RESUMO EXECUTIVO
Documentação completa da arquitetura do sistema Santoo - plataforma gospel de vídeos.

## 🎯 TECNOLOGIAS ESCOLHIDAS

### Frontend Stack
```javascript
📱 INTERFACE:
- HTML5 (estrutura semântica)
- CSS3 (Grid, Flexbox, Custom Properties)
- Vanilla JavaScript (ES6+, Modules)
- PWA (Service Worker, Web App Manifest)

🎨 DESIGN:
- Dark Theme (#1a1a1a base)
- Mobile First (responsive)
- WCAG 2.1 AA (acessibilidade)
- 60fps animations (CSS transforms)
```

### Backend Stack  
```javascript
🔧 SERVIDOR:
- Node.js v18+ (runtime)
- Express.js (web framework)
- MongoDB (database NoSQL)
- Mongoose (ODM)
- Socket.io (real-time)

🔐 SEGURANÇA:
- JWT (autenticação)
- bcrypt (hash passwords)
- helmet (security headers)
- cors (CORS policy)
- rate-limit (DDoS protection)
```

## 🗂️ DATABASE SCHEMA

### User Collection
```javascript
{
  _id: ObjectId,
  username: String (unique, required),
  email: String (unique, required),
  passwordHash: String (required),
  profile: {
    displayName: String,
    bio: String (max 300 chars),
    avatar: String (URL),
    verified: Boolean (default: false),
    createdAt: Date,
    lastLogin: Date
  },
  stats: {
    followers: Number (default: 0),
    following: Number (default: 0), 
    totalVideos: Number (default: 0),
    totalLikes: Number (default: 0)
  },
  preferences: {
    darkMode: Boolean (default: true),
    notifications: Boolean (default: true),
    privacy: String (public/private)
  }
}
```

### Video Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  content: {
    title: String (required, max 100 chars),
    description: String (max 500 chars),
    category: String (pregação/música/testemunho),
    tags: [String] (max 10 tags)
  },
  media: {
    videoUrl: String (Cloudinary URL),
    thumbnailUrl: String,
    duration: Number (seconds),
    resolution: String (720p/1080p),
    size: Number (bytes)
  },
  engagement: {
    views: Number (default: 0),
    likes: Number (default: 0),
    comments: Number (default: 0),
    shares: Number (default: 0)
  },
  metadata: {
    uploadDate: Date,
    isPublic: Boolean (default: true),
    isApproved: Boolean (default: false),
    flagCount: Number (default: 0)
  }
}
```

## 🔄 FLUXOS PRINCIPAIS

### 1. Autenticação Flow
```mermaid
User -> Frontend: Login/Register
Frontend -> Backend: POST /auth/login
Backend -> Database: Verify credentials  
Backend -> Frontend: JWT token
Frontend -> LocalStorage: Store token
Frontend -> Dashboard: Redirect
```

### 2. Upload Flow
```mermaid
User -> Frontend: Select video
Frontend -> Validation: Check size/format
Frontend -> Cloudinary: Upload video
Cloudinary -> Frontend: Video URL
Frontend -> Backend: POST /videos/create
Backend -> Database: Save video metadata
Backend -> Frontend: Success response
```

### 3. Feed Flow
```mermaid
User -> Frontend: Open app
Frontend -> Backend: GET /videos/feed
Backend -> Database: Query videos
Backend -> Algorithm: Personalize feed
Backend -> Frontend: Video list
Frontend -> User: Render feed
```

## 🚀 PERFORMANCE TARGETS

### Frontend
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s  
- Cumulative Layout Shift: < 0.1
- Bundle Size: < 250KB gzipped

### Backend  
- API Response Time: < 200ms
- Database Query: < 100ms
- Video Upload: < 30s (100MB)
- Concurrent Users: 1000+

## 🛡️ SEGURANÇA

### Autenticação
- JWT com expire em 24h
- Refresh tokens com 30 dias
- Rate limiting: 100 req/min por IP
- Password hash com bcrypt (12 rounds)

### Upload Security
- File type validation (mp4, mov, webm)
- Max file size: 100MB
- Virus scanning integration
- Content moderation (auto + manual)

### Data Protection
- HTTPS only (SSL/TLS)
- SQL injection protection
- XSS prevention
- CSRF protection

## 📊 MONITORAMENTO

### Métricas Key
- Daily Active Users (DAU)
- Video Upload Rate
- Average Session Duration
- Video Completion Rate
- API Error Rate

### Alertas
- Response time > 500ms
- Error rate > 1%
- Database connection issues
- Storage usage > 80%

## 🔧 DEPLOYMENT

### Staging Environment
- Frontend: Vercel Preview
- Backend: Railway (staging)
- Database: MongoDB Atlas (dev cluster)

### Production Environment
- Frontend: Vercel (main branch)
- Backend: Railway (production)
- Database: MongoDB Atlas (production cluster)
- CDN: Cloudinary (optimized delivery)

## 📋 DEVELOPMENT WORKFLOW

### Git Strategy
- main: production ready
- develop: integration branch
- feature/*: feature branches
- hotfix/*: emergency fixes

### Code Quality
- ESLint + Prettier
- Husky pre-commit hooks
- Jest unit tests (>70% coverage)
- Cypress E2E tests
- Lighthouse CI (performance)

## 🚀 ESCALABILIDADE

### Horizontal Scaling
- Load balancer (NGINX)
- Multiple backend instances
- Database sharding strategy
- Redis cache layer

### Optimization
- CDN for static assets
- Database indexing
- Query optimization
- Image/video compression

---

**Última atualização**: 02/09/2025  
**Versão**: 1.0.0