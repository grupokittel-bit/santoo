// MODELO DE SEGUIDOR
// Define relacionamento de "seguir" entre usuários

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Follow = sequelize.define('Follow', {
  id: {
    type: DataTypes.UUID,           // ID único universal
    defaultValue: DataTypes.UUIDV4, // Gera automaticamente
    primaryKey: true
  },
  
  // === RELACIONAMENTOS ===
  followerId: {
    type: DataTypes.UUID,           // ID do usuário que está seguindo
    allowNull: false,               // Obrigatório
    references: {
      model: 'users',
      key: 'id'
    }
  },
  
  followingId: {
    type: DataTypes.UUID,           // ID do usuário sendo seguido
    allowNull: false,               // Obrigatório
    references: {
      model: 'users',
      key: 'id'
    }
  }
  
}, {
  // === CONFIGURAÇÕES DA TABELA ===
  tableName: 'follows',             // Nome da tabela no banco
  timestamps: true,                 // Adiciona createdAt e updatedAt
  
  // === VALIDAÇÕES ===
  validate: {
    // Não pode seguir a si mesmo
    notSelfFollow() {
      if (this.followerId === this.followingId) {
        throw new Error('Usuário não pode seguir a si mesmo');
      }
    }
  },
  
  // === ÍNDICES E RESTRIÇÕES ===
  indexes: [
    {
      unique: true,                 // Um usuário pode seguir outro só uma vez
      fields: ['followerId', 'followingId']
    },
    {
      fields: ['followerId']        // Busca quem o usuário está seguindo
    },
    {
      fields: ['followingId']       // Busca seguidores do usuário
    }
  ]
});

// === MÉTODOS PARA GERENCIAR SEGUIDORES ===

// Toggle follow/unfollow
Follow.toggleFollow = async function(followerId, followingId) {
  const User = require('./User');
  
  // Validação básica
  if (followerId === followingId) {
    throw new Error('Não é possível seguir a si mesmo');
  }
  
  try {
    // Verifica se já está seguindo
    const existingFollow = await Follow.findOne({
      where: { followerId, followingId }
    });
    
    if (existingFollow) {
      // Se já segue, para de seguir
      await existingFollow.destroy();
      
      // Atualiza contadores
      await Promise.all([
        User.decrement('followingCount', { where: { id: followerId } }),
        User.decrement('followersCount', { where: { id: followingId } })
      ]);
      
      return { following: false, message: 'Parou de seguir' };
    } else {
      // Se não segue, começa a seguir
      await Follow.create({ followerId, followingId });
      
      // Atualiza contadores
      await Promise.all([
        User.increment('followingCount', { where: { id: followerId } }),
        User.increment('followersCount', { where: { id: followingId } })
      ]);
      
      return { following: true, message: 'Agora está seguindo' };
    }
  } catch (error) {
    throw error;
  }
};

// Verifica se usuário A segue usuário B
Follow.isFollowing = async function(followerId, followingId) {
  const follow = await Follow.findOne({
    where: { followerId, followingId }
  });
  
  return !!follow;
};

// Lista seguidores de um usuário
Follow.getFollowers = async function(userId, options = {}) {
  const User = require('./User');
  
  return await Follow.findAll({
    where: { followingId: userId },
    include: [{
      model: User,
      as: 'Follower',
      attributes: ['id', 'username', 'displayName', 'avatar', 'isVerified']
    }],
    order: [['createdAt', 'DESC']],
    ...options
  });
};

// Lista usuários que um usuário está seguindo
Follow.getFollowing = async function(userId, options = {}) {
  const User = require('./User');
  
  return await Follow.findAll({
    where: { followerId: userId },
    include: [{
      model: User,
      as: 'Following',
      attributes: ['id', 'username', 'displayName', 'avatar', 'isVerified']
    }],
    order: [['createdAt', 'DESC']],
    ...options
  });
};

module.exports = Follow;