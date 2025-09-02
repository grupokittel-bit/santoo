// MODELO DE CURTIDA
// Define curtidas dos usuários nos vídeos

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Like = sequelize.define('Like', {
  id: {
    type: DataTypes.UUID,           // ID único universal
    defaultValue: DataTypes.UUIDV4, // Gera automaticamente
    primaryKey: true
  },
  
  // === RELACIONAMENTOS ===
  userId: {
    type: DataTypes.UUID,           // ID do usuário que curtiu
    allowNull: false,               // Obrigatório
    references: {
      model: 'users',
      key: 'id'
    }
  },
  
  videoId: {
    type: DataTypes.UUID,           // ID do vídeo curtido
    allowNull: false,               // Obrigatório
    references: {
      model: 'videos',
      key: 'id'
    }
  }
  
}, {
  // === CONFIGURAÇÕES DA TABELA ===
  tableName: 'likes',               // Nome da tabela no banco
  timestamps: true,                 // Adiciona createdAt e updatedAt
  
  // === ÍNDICES E RESTRIÇÕES ===
  indexes: [
    {
      unique: true,                 // Um usuário pode curtir um vídeo só uma vez
      fields: ['userId', 'videoId']
    },
    {
      fields: ['videoId']           // Busca por vídeo
    },
    {
      fields: ['userId']            // Busca por usuário
    }
  ]
});

// === MÉTODO PARA TOGGLE LIKE ===
Like.toggleLike = async function(userId, videoId) {
  const Video = require('./Video');
  
  try {
    // Verifica se já curtiu
    const existingLike = await Like.findOne({
      where: { userId, videoId }
    });
    
    if (existingLike) {
      // Se já curtiu, remove a curtida
      await existingLike.destroy();
      
      // Decrementa contador no vídeo
      await Video.decrement('likesCount', {
        where: { id: videoId }
      });
      
      return { liked: false, message: 'Like removido' };
    } else {
      // Se não curtiu, adiciona curtida
      await Like.create({ userId, videoId });
      
      // Incrementa contador no vídeo
      await Video.increment('likesCount', {
        where: { id: videoId }
      });
      
      return { liked: true, message: 'Like adicionado' };
    }
  } catch (error) {
    throw error;
  }
};

module.exports = Like;