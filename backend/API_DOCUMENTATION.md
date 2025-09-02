# 📖 SANTOO API - DOCUMENTAÇÃO COMPLETA

![Santoo Logo](https://img.shields.io/badge/Santoo-Gospel%20Video%20Platform-blue?style=for-the-badge)
![API Version](https://img.shields.io/badge/API-v1.0-green?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge)

## 🎯 **VISÃO GERAL**

A API do Santoo é uma plataforma RESTful completa para compartilhamento de vídeos gospel. Permite autenticação JWT, upload de vídeos, sistema de curtidas, comentários, seguir usuários e muito mais.

**Base URL:** `http://localhost:3001`

---

## 🔑 **AUTENTICAÇÃO**

A API utiliza **JWT (JSON Web Tokens)** para autenticação. Tokens têm validade de 7 dias.

### Header de Autorização:
```
Authorization: Bearer <seu_jwt_token>
```

---

## 📋 **ENDPOINTS**

### 🔐 **AUTENTICAÇÃO** (`/api/auth`)

#### 1. Registro de Usuário
```http
POST /api/auth/register
Content-Type: application/json
```

**Body:**
```json
{
  "username": "mariagospel",
  "email": "maria@exemplo.com", 
  "password": "123456",
  "displayName": "Maria dos Santos",
  "bio": "Servo de Deus e amante da palavra"
}
```

**Response (201):**
```json
{
  "message": "Usuário criado com sucesso!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": {
    "id": "uuid-do-usuario",
    "username": "mariagospel",
    "displayName": "Maria dos Santos",
    "bio": "Servo de Deus e amante da palavra",
    "avatar": null,
    "isVerified": false,
    "followersCount": 0,
    "followingCount": 0,
    "videosCount": 0,
    "createdAt": "2025-09-02T23:45:00.000Z"
  }
}
```

#### 2. Login
```http
POST /api/auth/login
Content-Type: application/json
```

**Body:**
```json
{
  "identifier": "mariagospel",  // username ou email
  "password": "123456"
}
```

**Response (200):**
```json
{
  "message": "Login realizado com sucesso!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": { /* dados do usuário */ }
}
```

#### 3. Verificar Token
```http
POST /api/auth/verify
Content-Type: application/json
```

**Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
```

---

### 👥 **USUÁRIOS** (`/api/users`)

#### 1. Listar Usuários (Público)
```http
GET /api/users?search=gospel&page=1&limit=20&verified=true
```

**Query Parameters:**
- `search` (opcional): Busca por username ou displayName
- `page` (opcional): Página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 20, máx: 50)
- `verified` (opcional): Filtrar apenas verificados

**Response (200):**
```json
{
  "users": [
    {
      "id": "uuid",
      "username": "pastorjoao",
      "displayName": "Pastor João Silva",
      "avatar": "/uploads/avatars/avatar-123.jpg",
      "isVerified": true,
      "followersCount": 1543,
      "videosCount": 87,
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}
```

#### 2. Perfil Público
```http
GET /api/users/:username
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "username": "pastorjoao",
    "displayName": "Pastor João Silva",
    "bio": "Pregador da palavra há 15 anos",
    "avatar": "/uploads/avatars/avatar-123.jpg",
    "coverImage": "/uploads/covers/cover-456.jpg",
    "isVerified": true,
    "followersCount": 1543,
    "followingCount": 98,
    "videosCount": 87,
    "location": "São Paulo, SP",
    "website": "https://igrejanova.com.br",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "isFollowing": false  // se usuário logado está seguindo
  },
  "videos": [
    // últimos 6 vídeos
  ]
}
```

#### 3. Meu Perfil (Protegido)
```http
GET /api/users/me
Authorization: Bearer <token>
```

#### 4. Atualizar Perfil (Protegido)
```http
PUT /api/users/me
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
```
displayName: Pastor João Silva
bio: Servo de Deus há 15 anos
location: São Paulo, SP  
website: https://meusite.com
image: [arquivo de avatar] (opcional, máx 5MB)
```

#### 5. Seguir/Deixar de Seguir
```http
POST /api/users/:userId/follow
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Agora está seguindo",
  "following": true,
  "user": { /* dados do usuário seguido */ }
}
```

#### 6. Feed Personalizado
```http
GET /api/users/me/feed?page=1&limit=10
Authorization: Bearer <token>
```

---

### 🎥 **VÍDEOS** (`/api/videos`)

#### 1. Feed de Vídeos (Público)
```http
GET /api/videos?category=1&search=louvor&sortBy=popular&page=1&limit=10&userId=uuid
```

**Query Parameters:**
- `category` (opcional): ID da categoria
- `search` (opcional): Busca no título, descrição ou tags
- `sortBy` (opcional): `recent` (padrão), `popular`, `trending`
- `page`, `limit`: Paginação
- `userId` (opcional): Vídeos de um usuário específico

**Response (200):**
```json
{
  "videos": [
    {
      "id": "uuid-do-video",
      "title": "Louvores que Transformam Vidas",
      "description": "Uma seleção dos melhores louvores...",
      "videoUrl": "/uploads/videos/video-123.mp4",
      "thumbnailUrl": "/uploads/thumbnails/thumb-123.jpg",
      "duration": 1800, // em segundos
      "viewsCount": 5432,
      "likesCount": 234,
      "commentsCount": 45,
      "tags": "louvor, adoração, música gospel",
      "slug": "louvores-que-transformam-vidas",
      "createdAt": "2025-09-01T15:30:00.000Z",
      "User": {
        "id": "uuid",
        "username": "cantorpedro",
        "displayName": "Pedro Cantor",
        "avatar": "/uploads/avatars/pedro.jpg",
        "isVerified": true
      },
      "Category": {
        "id": 2,
        "name": "Música",
        "color": "#FF6B6B",
        "icon": "🎵"
      },
      "userLiked": false  // se usuário logado curtiu (apenas se logado)
    }
  ],
  "pagination": { /* paginação */ },
  "filters": {
    "category": "1",
    "search": "louvor", 
    "sortBy": "popular"
  }
}
```

#### 2. Detalhes do Vídeo
```http
GET /api/videos/:id
```

**Response (200):**
```json
{
  "video": {
    // dados completos do vídeo
    "User": { /* dados do autor */ },
    "Category": { /* dados da categoria */ },
    "comments": [
      // primeiros 5 comentários
    ],
    "userLiked": false,
    "userFollowing": false  // se segue o autor
  }
}
```

#### 3. Upload de Vídeo (Protegido)
```http
POST /api/videos
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
```
title: Testemunho de Cura Divina
description: Compartilho aqui como Deus me curou...
categoryId: 3
tags: testemunho, cura, milagre
video: [arquivo de vídeo] (obrigatório, máx 100MB)
thumbnail: [arquivo de imagem] (opcional, máx 5MB)
```

**Tipos de arquivo aceitos:**
- **Vídeos:** MP4, MPEG, MOV, WebM, OGG
- **Thumbnails:** JPEG, PNG, WebP, GIF

**Response (201):**
```json
{
  "message": "Vídeo enviado com sucesso!",
  "video": {
    "id": "uuid-novo-video",
    "title": "Testemunho de Cura Divina",
    "videoUrl": "/uploads/videos/video-456.mp4",
    "thumbnailUrl": "/uploads/thumbnails/thumb-456.jpg",
    // ... outros campos
  }
}
```

#### 4. Curtir/Descurtir Vídeo
```http
POST /api/videos/:id/like
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Vídeo curtido!",
  "liked": true,
  "likes": 235
}
```

#### 5. Atualizar Vídeo (Próprio)
```http
PUT /api/videos/:id
Authorization: Bearer <token>
Content-Type: application/json
```

#### 6. Deletar Vídeo (Próprio)
```http
DELETE /api/videos/:id  
Authorization: Bearer <token>
```

---

### 📂 **CATEGORIAS** (`/api/categories`)

#### 1. Listar Categorias
```http
GET /api/categories?withStats=true
```

**Response (200):**
```json
{
  "categories": [
    {
      "id": 1,
      "name": "Pregação",
      "description": "Mensagens, sermões e ensinamentos bíblicos",
      "color": "#8B4513",
      "icon": "⛪",
      "videosCount": 342  // se withStats=true
    },
    {
      "id": 2,
      "name": "Música", 
      "description": "Músicas gospel, louvores e adoração",
      "color": "#FF6B6B",
      "icon": "🎵"
    }
  ]
}
```

**Categorias disponíveis:**
1. **Pregação** ⛪ - Mensagens e sermões
2. **Música** 🎵 - Gospel, louvores, adoração
3. **Testemunho** 🙏 - Histórias de vida e transformação
4. **Estudo Bíblico** 📖 - Estudos da Palavra
5. **Jovens** 🌟 - Conteúdo para jovens cristãos
6. **Infantil** 👶 - Conteúdo educativo para crianças
7. **Live** 🔴 - Transmissões ao vivo
8. **Devocional** 🕊️ - Reflexões e momentos de oração

#### 2. Vídeos por Categoria
```http
GET /api/categories/:id?page=1&limit=10
```

#### 3. Estatísticas das Categorias
```http
GET /api/categories/stats/overview
```

#### 4. Categorias em Alta
```http
GET /api/categories/trending?days=7
```

---

### 💬 **COMENTÁRIOS** (`/api/comments`)

#### 1. Comentários de um Vídeo
```http
GET /api/comments/video/:videoId?page=1&limit=20
```

**Response (200):**
```json
{
  "comments": [
    {
      "id": "uuid-comentario",
      "content": "Que mensagem abençoada! Glória a Deus!",
      "createdAt": "2025-09-02T20:15:00.000Z",
      "editedAt": null,
      "User": {
        "id": "uuid-usuario",
        "username": "ana_crista",
        "displayName": "Ana Cristã",
        "avatar": "/uploads/avatars/ana.jpg",
        "isVerified": false
      },
      "Replies": [
        {
          "id": "uuid-resposta",
          "content": "Amém, irmã! Deus é fiel sempre!",
          "User": { /* dados do usuário */ }
        }
      ],
      "repliesCount": 3
    }
  ],
  "pagination": { /* paginação */ }
}
```

#### 2. Adicionar Comentário
```http
POST /api/comments
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "videoId": "uuid-do-video",
  "parentId": "uuid-comentario-pai", // opcional, para respostas
  "content": "Que mensagem abençoada! Deus abençoe!"
}
```

#### 3. Editar Comentário (Próprio)
```http
PUT /api/comments/:id
Authorization: Bearer <token>
```

#### 4. Deletar Comentário (Próprio)
```http
DELETE /api/comments/:id
Authorization: Bearer <token>
```

#### 5. Respostas de um Comentário
```http
GET /api/comments/:commentId/replies?page=1&limit=10
```

---

## 🔒 **SEGURANÇA E RATE LIMITING**

### Rate Limits:
- **Autenticação**: 5 tentativas por 15 minutos por IP
- **Upload**: Arquivo único por request
- **APIs gerais**: Sem limite (por enquanto)

### Validações:
- **Username**: 3-50 caracteres, letras, números e underscore
- **Password**: Mínimo 6 caracteres
- **Email**: Formato válido obrigatório
- **Uploads**: Tipos de arquivo e tamanho validados

---

## 📁 **ARQUIVOS ESTÁTICOS**

Arquivos enviados ficam disponíveis em:
```
http://localhost:3001/uploads/videos/nome-do-arquivo.mp4
http://localhost:3001/uploads/thumbnails/nome-do-thumbnail.jpg
http://localhost:3001/uploads/avatars/nome-do-avatar.jpg
```

---

## ⚠️ **CÓDIGOS DE ERRO**

### Códigos HTTP:
- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Dados inválidos
- `401` - Não autorizado (token inválido/ausente)
- `403` - Proibido (sem permissão)
- `404` - Recurso não encontrado
- `409` - Conflito (username/email já existe)
- `413` - Arquivo muito grande
- `429` - Muitas tentativas (rate limit)
- `500` - Erro interno do servidor

### Exemplo de Erro:
```json
{
  "error": "Token expirado. Faça login novamente.",
  "timestamp": "2025-09-02T23:45:00.000Z"
}
```

---

## 🧪 **TESTANDO A API**

### 1. Com cURL:
```bash
# Registro
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"teste123","email":"teste@santoo.app","password":"123456"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"teste123","password":"123456"}'

# Feed de vídeos
curl http://localhost:3001/api/videos

# Perfil próprio (com token)
curl -H "Authorization: Bearer SEU_TOKEN_JWT" \
  http://localhost:3001/api/users/me
```

### 2. Ferramentas Recomendadas:
- **Postman** - Interface gráfica completa
- **Insomnia** - Cliente REST moderno
- **Thunder Client** - Extensão do VSCode
- **httpie** - Cliente de linha de comando amigável

---

## 🚀 **PRÓXIMOS RECURSOS**

- ✨ Sistema de notificações em tempo real
- 📊 Analytics e métricas avançadas
- 🔍 Busca com Elasticsearch
- 📱 Push notifications mobile
- 🎬 Streaming de vídeo otimizado
- 🤖 Moderação automática de conteúdo
- 🔒 OAuth2 (Google, Facebook)
- 📈 Dashboard administrativo

---

## 📞 **SUPORTE**

- 📧 **Email**: dev@santoo.app
- 🐛 **Issues**: [GitHub Issues](https://github.com/grupo-santoo/backend/issues)
- 📖 **Docs**: [Documentação Online](https://docs.santoo.app)

---

**🎉 API Santoo v1.0 - Desenvolvida com ❤️ para a comunidade gospel**

*"Portanto ide, fazei discípulos de todas as nações..." - Mateus 28:19*