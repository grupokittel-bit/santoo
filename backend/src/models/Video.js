// MODELO DE VÍDEO
// Define como os vídeos são salvos no banco

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Video = sequelize.define('Video', {
  id: {
    type: DataTypes.UUID,           // ID único universal
    defaultValue: DataTypes.UUIDV4, // Gera automaticamente
    primaryKey: true
  },
  
  // === DADOS DO VÍDEO ===
  title: {
    type: DataTypes.STRING(200),    // Título do vídeo (máx 200 chars)
    allowNull: false,               // Obrigatório
    validate: {
      len: [1, 200]                 // Entre 1 e 200 caracteres
    }
  },
  
  description: {
    type: DataTypes.TEXT,           // Descrição completa
    allowNull: true,                // Opcional
    validate: {
      len: [0, 2000]                // Máximo 2000 caracteres
    }
  },
  
  // === ARQUIVOS ===
  videoUrl: {
    type: DataTypes.STRING(500),    // URL do arquivo de vídeo
    allowNull: false                // Obrigatório (sem validação isUrl para paths locais)
  },
  
  thumbnailUrl: {
    type: DataTypes.STRING(500),    // URL da thumbnail/capa
    allowNull: true                 // Opcional (sem validação isUrl para paths locais)
  },
  
  // === METADADOS ===
  duration: {
    type: DataTypes.FLOAT,          // Duração em segundos (aceita decimais)
    allowNull: true,                // Opcional
    validate: { min: 0 }
  },
  
  fileSize: {
    type: DataTypes.BIGINT,         // Tamanho do arquivo em bytes
    allowNull: true,                // Opcional
    validate: { min: 0 }
  },
  
  resolution: {
    type: DataTypes.STRING(20),     // Resolução (720p, 1080p, etc)
    allowNull: true,                // Opcional
    validate: {
      is: /^\d+p$|^\d+x\d+$/        // Formato: 720p ou 1920x1080
    }
  },
  
  // === CONFIGURAÇÕES ===
  isPublic: {
    type: DataTypes.BOOLEAN,        // Vídeo público?
    defaultValue: true
  },
  
  isActive: {
    type: DataTypes.BOOLEAN,        // Vídeo ativo?
    defaultValue: true
  },
  
  allowComments: {
    type: DataTypes.BOOLEAN,        // Permite comentários?
    defaultValue: true
  },
  
  allowDownload: {
    type: DataTypes.BOOLEAN,        // Permite download?
    defaultValue: false
  },
  
  // === MODERAÇÃO ===
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'processing'),
    defaultValue: 'pending'         // Status da moderação
  },
  
  rejectionReason: {
    type: DataTypes.TEXT,           // Motivo da rejeição
    allowNull: true
  },
  
  // === ESTATÍSTICAS ===
  viewsCount: {
    type: DataTypes.INTEGER,        // Número de visualizações
    defaultValue: 0,
    validate: { min: 0 }
  },
  
  likesCount: {
    type: DataTypes.INTEGER,        // Número de curtidas
    defaultValue: 0,
    validate: { min: 0 }
  },
  
  commentsCount: {
    type: DataTypes.INTEGER,        // Número de comentários
    defaultValue: 0,
    validate: { min: 0 }
  },
  
  sharesCount: {
    type: DataTypes.INTEGER,        // Número de compartilhamentos
    defaultValue: 0,
    validate: { min: 0 }
  },
  
  // === SEO ===
  tags: {
    type: DataTypes.JSON,           // Tags do vídeo (array)
    allowNull: true,
    defaultValue: []
  },
  
  slug: {
    type: DataTypes.STRING(255),    // URL amigável
    allowNull: true,                // Será gerado automaticamente
    unique: true
  },
  
  // === RELACIONAMENTOS (serão definidos em associations.js) ===
  userId: {
    type: DataTypes.UUID,           // ID do usuário que postou
    allowNull: false,               // Obrigatório
    references: {
      model: 'users',
      key: 'id'
    }
  },
  
  categoryId: {
    type: DataTypes.INTEGER,        // ID da categoria
    allowNull: false,               // Obrigatório
    references: {
      model: 'categories',
      key: 'id'
    }
  }
  
}, {
  // === CONFIGURAÇÕES DA TABELA ===
  tableName: 'videos',              // Nome da tabela no banco
  timestamps: true,                 // Adiciona createdAt e updatedAt
  paranoid: true,                   // Soft delete
  
  // === HOOKS ===
  hooks: {
    // Antes de criar, gera slug se não fornecido
    beforeCreate: async (video) => {
      if (!video.slug) {
        const slug = video.title
          .toLowerCase()
          .normalize('NFD')         // Remove acentos
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
          .replace(/\s+/g, '-')     // Substitui espaços por hífen
          .replace(/-+/g, '-')      // Remove hífens duplicados
          .trim();
        
        // Garante que slug é único
        let uniqueSlug = slug;
        let counter = 1;
        
        while (await Video.findOne({ where: { slug: uniqueSlug } })) {
          uniqueSlug = `${slug}-${counter}`;
          counter++;
        }
        
        video.slug = uniqueSlug;
      }
    }
  },
  
  // === ÍNDICES ===
  indexes: [
    {
      fields: ['userId']            // Busca por usuário
    },
    {
      fields: ['categoryId']        // Busca por categoria
    },
    {
      fields: ['isPublic', 'isActive', 'status'] // Listagem pública
    },
    {
      fields: ['createdAt']         // Ordenação por data
    },
    {
      fields: ['viewsCount']        // Ordenação por popularidade
    },
    {
      fields: ['slug']              // Busca por slug
    }
  ]
});

// === MÉTODOS DO VÍDEO ===

// Incrementa visualização
Video.prototype.incrementViews = async function() {
  this.viewsCount += 1;
  await this.save({ fields: ['viewsCount'] });
};

// Retorna dados públicos do vídeo
Video.prototype.toPublicJSON = function() {
  return {
    id: this.id,
    title: this.title,
    description: this.description,
    videoUrl: this.videoUrl,
    thumbnailUrl: this.thumbnailUrl,
    duration: this.duration,
    resolution: this.resolution,
    viewsCount: this.viewsCount,
    likesCount: this.likesCount,
    commentsCount: this.commentsCount,
    sharesCount: this.sharesCount,
    tags: this.tags,
    slug: this.slug,
    createdAt: this.createdAt,
    // Dados do relacionamento serão incluídos nas consultas
    User: this.User ? this.User.toPublicJSON() : null,
    Category: this.Category || null
  };
};

module.exports = Video;