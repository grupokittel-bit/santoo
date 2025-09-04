// MODELO BIBLE POST
// Define como os posts da Bíblia Explicada ficam salvos no banco

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BiblePost = sequelize.define('BiblePost', {
  id: {
    type: DataTypes.UUID,           // ID único universal
    defaultValue: DataTypes.UUIDV4, // Gera automaticamente
    primaryKey: true
  },
  
  // === CONTEÚDO PRINCIPAL ===
  title: {
    type: DataTypes.STRING(200),    // Título do post (máx 200 chars)
    allowNull: false,               // Obrigatório
    validate: {
      len: [10, 200],               // Entre 10 e 200 caracteres
      notEmpty: true
    }
  },
  
  verse_reference: {
    type: DataTypes.STRING(50),     // Referência bíblica (ex: "Salmos 119:105")
    allowNull: false,               // Obrigatório
    validate: {
      len: [3, 50],                 // Mínimo 3 caracteres
      notEmpty: true,
      // Validação de formato básico: "Livro X:Y" ou "Livro X:Y-Z"
      is: {
        args: /^[A-Za-zÀ-ÿ\s]+\s\d+:\d+(-\d+)?$/,
        msg: 'Referência deve ter formato: "Livro X:Y" (ex: "Salmos 119:105")'
      }
    }
  },
  
  original_text: {
    type: DataTypes.TEXT,           // Versículo completo original
    allowNull: false,               // Obrigatório
    validate: {
      len: [10, 1000],              // Entre 10 e 1000 caracteres
      notEmpty: true
    }
  },
  
  // === EXPLICAÇÕES ESTRUTURADAS ===
  historical_context: {
    type: DataTypes.TEXT,           // Contexto histórico da época
    allowNull: false,               // Obrigatório
    validate: {
      len: [20, 2000],              // Entre 20 e 2000 caracteres
      notEmpty: true
    }
  },
  
  modern_translation: {
    type: DataTypes.TEXT,           // Tradução para linguagem atual
    allowNull: false,               // Obrigatório
    validate: {
      len: [20, 2000],              // Entre 20 e 2000 caracteres
      notEmpty: true
    }
  },
  
  practical_meaning: {
    type: DataTypes.TEXT,           // O que o texto realmente está dizendo
    allowNull: false,               // Obrigatório
    validate: {
      len: [20, 2000],              // Entre 20 e 2000 caracteres
      notEmpty: true
    }
  },
  
  modern_application: {
    type: DataTypes.TEXT,           // Como aplicar hoje
    allowNull: false,               // Obrigatório
    validate: {
      len: [20, 2000],              // Entre 20 e 2000 caracteres
      notEmpty: true
    }
  },
  
  curiosities: {
    type: DataTypes.TEXT,           // Informações extras relevantes
    allowNull: true,                // Opcional
    validate: {
      len: [0, 1000]                // Máximo 1000 caracteres
    }
  },
  
  // === CATEGORIZAÇÃO ===
  category: {
    type: DataTypes.ENUM(
      'sabedoria',      // Versículos sobre sabedoria e discernimento
      'amor',           // Amor a Deus, próximo, relacionamentos
      'fe',             // Fé, confiança, esperança
      'oracao',         // Oração, comunicação com Deus
      'relacionamentos', // Família, amigos, comunidade
      'trabalho',       // Trabalho, profissão, propósito
      'familia',        // Casamento, filhos, pais
      'paz',            // Paz interior, ansiedade, preocupação
      'perdao',         // Perdão, reconciliação
      'gratidao',       // Gratidão, louvor, adoração
      'crescimento',    // Crescimento espiritual, santificação
      'proposito'       // Propósito de vida, chamado, missão
    ),
    allowNull: false,               // Obrigatório
    defaultValue: 'crescimento'
  },
  
  tags: {
    type: DataTypes.JSON,           // Array de tags para busca
    allowNull: true,                // Opcional
    defaultValue: [],
    validate: {
      isValidTags(value) {
        if (value && !Array.isArray(value)) {
          throw new Error('Tags deve ser um array');
        }
        if (value && value.length > 10) {
          throw new Error('Máximo 10 tags permitidas');
        }
        if (value) {
          value.forEach(tag => {
            if (typeof tag !== 'string' || tag.length > 30) {
              throw new Error('Cada tag deve ser texto com máximo 30 caracteres');
            }
          });
        }
      }
    }
  },
  
  // === AUTOR E PERMISSÕES ===
  author_admin_id: {
    type: DataTypes.UUID,           // ID do admin/pastor que criou
    allowNull: false,               // Obrigatório
    references: {
      model: 'users',               // Referencia tabela users
      key: 'id'
    }
  },
  
  // === ESTATÍSTICAS DE ENGAJAMENTO ===
  views_count: {
    type: DataTypes.INTEGER,        // Número de visualizações
    defaultValue: 0,
    validate: { min: 0 }
  },
  
  likes_count: {
    type: DataTypes.INTEGER,        // Número de curtidas
    defaultValue: 0,
    validate: { min: 0 }
  },
  
  amen_count: {
    type: DataTypes.INTEGER,        // Número de "Já faço isso"
    defaultValue: 0,
    validate: { min: 0 }
  },
  
  ops_count: {
    type: DataTypes.INTEGER,        // Número de "Ainda não faço isso"
    defaultValue: 0,
    validate: { min: 0 }
  },
  
  disagree_count: {
    type: DataTypes.INTEGER,        // Número de discordâncias
    defaultValue: 0,
    validate: { min: 0 }
  },
  
  comments_count: {
    type: DataTypes.INTEGER,        // Número de comentários
    defaultValue: 0,
    validate: { min: 0 }
  },
  
  shares_count: {
    type: DataTypes.INTEGER,        // Número de compartilhamentos
    defaultValue: 0,
    validate: { min: 0 }
  },
  
  // === CONFIGURAÇÕES ===
  is_active: {
    type: DataTypes.BOOLEAN,        // Post ativo/publicado?
    defaultValue: true
  },
  
  is_featured: {
    type: DataTypes.BOOLEAN,        // Post destacado?
    defaultValue: false
  },
  
  publish_date: {
    type: DataTypes.DATE,           // Data de publicação
    allowNull: true,                // Null = rascunho
    validate: {
      isDate: true
    }
  }
  
}, {
  // === CONFIGURAÇÕES DA TABELA ===
  tableName: 'bible_posts',         // Nome da tabela no banco
  timestamps: true,                 // Adiciona createdAt e updatedAt
  paranoid: true,                   // Soft delete (não exclui, marca como deletado)
  
  // === ÍNDICES PARA PERFORMANCE ===
  indexes: [
    {
      fields: ['category']          // Índice na categoria para busca rápida
    },
    {
      fields: ['author_admin_id']   // Índice no autor para busca por admin
    },
    {
      fields: ['is_active']         // Índice para buscar apenas ativos
    },
    {
      fields: ['publish_date']      // Índice para ordenar por data
    },
    {
      fields: ['verse_reference']   // Índice para busca por referência
    }
  ]
});

// === MÉTODOS DO MODELO ===

// Incrementa contador de visualizações
BiblePost.prototype.incrementViews = function() {
  return this.increment('views_count', { by: 1 });
};

// Incrementa contador de interação específica
BiblePost.prototype.incrementInteraction = function(type) {
  const field = `${type}_count`;
  return this.increment(field, { by: 1 });
};

// Decrementa contador de interação específica
BiblePost.prototype.decrementInteraction = function(type) {
  const field = `${type}_count`;
  return this.decrement(field, { by: 1 });
};

// Retorna dados públicos do post (para API)
BiblePost.prototype.toPublicJSON = function() {
  return {
    id: this.id,
    title: this.title,
    verse_reference: this.verse_reference,
    original_text: this.original_text,
    historical_context: this.historical_context,
    modern_translation: this.modern_translation,
    practical_meaning: this.practical_meaning,
    modern_application: this.modern_application,
    curiosities: this.curiosities,
    category: this.category,
    tags: this.tags,
    stats: {
      views: this.views_count,
      likes: this.likes_count,
      amen: this.amen_count,
      ops: this.ops_count,
      comments: this.comments_count,
      shares: this.shares_count
    },
    is_featured: this.is_featured,
    publish_date: this.publish_date,
    created_at: this.createdAt,
    updated_at: this.updatedAt
  };
};

// Calcula score de engajamento para algoritmo
BiblePost.prototype.calculateEngagementScore = function() {
  const weights = {
    views: 1,
    likes: 2, 
    amen: 5,      // "Já faço isso" vale mais
    ops: 4,       // "Ainda não faço" vale bastante
    comments: 3,
    shares: 4
  };
  
  return (
    (this.views_count * weights.views) +
    (this.likes_count * weights.likes) +
    (this.amen_count * weights.amen) +
    (this.ops_count * weights.ops) +
    (this.comments_count * weights.comments) +
    (this.shares_count * weights.shares)
  );
};

module.exports = BiblePost;