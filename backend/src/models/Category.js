// MODELO DE CATEGORIA
// Define as categorias dos vídeos gospel (pregação, música, testemunho, etc)

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,        // ID numérico simples
    primaryKey: true,
    autoIncrement: true
  },
  
  // === DADOS DA CATEGORIA ===
  name: {
    type: DataTypes.STRING(50),     // Nome da categoria
    allowNull: false,               // Obrigatório
    unique: true,                   // Nome único
    validate: {
      len: [2, 50]                  // Entre 2 e 50 caracteres
    }
  },
  
  slug: {
    type: DataTypes.STRING(50),     // Nome para URL (pregacao, musica, etc)
    allowNull: false,               // Obrigatório
    unique: true,                   // Único no sistema
    validate: {
      is: /^[a-z0-9-]+$/            // Só letras minúsculas, números e hífen
    }
  },
  
  description: {
    type: DataTypes.TEXT,           // Descrição da categoria
    allowNull: true,                // Opcional
    validate: {
      len: [0, 500]                 // Máximo 500 caracteres
    }
  },
  
  // === VISUAL ===
  icon: {
    type: DataTypes.STRING(50),     // Emoji ou ícone da categoria
    allowNull: true,                // Opcional
    defaultValue: '📺'              // Ícone padrão
  },
  
  color: {
    type: DataTypes.STRING(7),      // Cor hex da categoria (#FF5733)
    allowNull: true,                // Opcional
    defaultValue: '#4A90E2',        // Azul padrão do Santoo
    validate: {
      is: /^#[0-9A-Fa-f]{6}$/       // Formato hex válido
    }
  },
  
  // === CONFIGURAÇÕES ===
  isActive: {
    type: DataTypes.BOOLEAN,        // Categoria ativa?
    defaultValue: true
  },
  
  order: {
    type: DataTypes.INTEGER,        // Ordem de exibição
    defaultValue: 0,
    validate: { min: 0 }
  },
  
  // === ESTATÍSTICAS ===
  videosCount: {
    type: DataTypes.INTEGER,        // Número de vídeos nesta categoria
    defaultValue: 0,
    validate: { min: 0 }
  }
  
}, {
  // === CONFIGURAÇÕES DA TABELA ===
  tableName: 'categories',          // Nome da tabela no banco
  timestamps: true,                 // Adiciona createdAt e updatedAt
  
  // === ÍNDICES ===
  indexes: [
    {
      fields: ['slug']              // Índice para busca rápida por slug
    },
    {
      fields: ['isActive', 'order'] // Índice para listagem ordenada
    }
  ]
});

// === MÉTODO PARA CRIAR CATEGORIAS PADRÃO ===
Category.createDefaultCategories = async function() {
  const defaultCategories = [
    {
      name: 'Pregação',
      slug: 'pregacao',
      description: 'Mensagens, sermões e ensinamentos bíblicos',
      icon: '⛪',
      color: '#8B4513',
      order: 1
    },
    {
      name: 'Música',
      slug: 'musica', 
      description: 'Músicas gospel, louvores e adoração',
      icon: '🎵',
      color: '#FF6B6B',
      order: 2
    },
    {
      name: 'Testemunho',
      slug: 'testemunho',
      description: 'Testemunhos de vida e transformação',
      icon: '🙏',
      color: '#4ECDC4',
      order: 3
    },
    {
      name: 'Estudo Bíblico',
      slug: 'estudo-biblico',
      description: 'Estudos aprofundados da Palavra de Deus',
      icon: '📖',
      color: '#45B7D1',
      order: 4
    },
    {
      name: 'Jovens',
      slug: 'jovens',
      description: 'Conteúdo direcionado para jovens cristãos',
      icon: '🌟',
      color: '#96CEB4',
      order: 5
    },
    {
      name: 'Infantil',
      slug: 'infantil',
      description: 'Conteúdo educativo para crianças',
      icon: '👶',
      color: '#FECA57',
      order: 6
    },
    {
      name: 'Live',
      slug: 'live',
      description: 'Transmissões ao vivo e cultos online',
      icon: '🔴',
      color: '#FF5733',
      order: 7
    },
    {
      name: 'Devocional',
      slug: 'devocional',
      description: 'Reflexões diárias e momentos de oração',
      icon: '🕊️',
      color: '#A8E6CF',
      order: 8
    }
  ];
  
  // Cria categorias que não existem
  for (const categoryData of defaultCategories) {
    await Category.findOrCreate({
      where: { slug: categoryData.slug },
      defaults: categoryData
    });
  }
  
  console.log('✅ Categorias padrão criadas/verificadas!');
};

module.exports = Category;