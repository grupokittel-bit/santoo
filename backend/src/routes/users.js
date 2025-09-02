// ROTA DE USUÁRIOS
// Endpoints para perfis, seguir usuários, busca, etc.

const express = require('express');
const { Op } = require('sequelize');
const { User, Video, Follow } = require('../models');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const { uploadImageOnly, handleUploadError, validateImageMetadata } = require('../middleware/upload');

const router = express.Router();

// === ROTAS PÚBLICAS (não precisa login) ===

// GET /users - Lista usuários (busca, paginação)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      search = '',
      page = 1,
      limit = 20,
      verified = false
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Filtros de busca
    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { displayName: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (verified === 'true') {
      whereClause.isVerified = true;
    }
    
    // Busca usuários
    const { rows: users, count } = await User.findAndCountAll({
      where: whereClause,
      attributes: [
        'id', 'username', 'displayName', 'avatar', 
        'isVerified', 'followersCount', 'videosCount', 'createdAt'
      ],
      order: [['followersCount', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
    
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// === ROTAS PROTEGIDAS (precisa login) ===

// GET /users/me - Perfil do usuário logado
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.json({
      user: req.user.toPublicJSON()
    });
  } catch (error) {
    console.error('Erro ao buscar perfil próprio:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /users/:username - Perfil público de um usuário
router.get('/:username', optionalAuth, async (req, res) => {
  try {
    const { username } = req.params;
    
    // Busca usuário
    const user = await User.findOne({
      where: { username },
      include: [
        {
          model: Video,
          as: 'videos',
          limit: 6, // Últimos 6 vídeos
          order: [['createdAt', 'DESC']],
          attributes: ['id', 'title', 'thumbnail', 'views', 'likes', 'createdAt']
        }
      ]
    });
    
    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }
    
    const userProfile = user.toPublicJSON();
    
    // Se há usuário logado, verifica se está seguindo
    if (req.user && req.user.id !== user.id) {
      const isFollowing = await Follow.isFollowing(req.user.id, user.id);
      userProfile.isFollowing = isFollowing;
    }
    
    res.json({
      user: userProfile,
      videos: user.videos
    });
    
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /users/me - Atualiza perfil do usuário logado (com avatar opcional)
router.put('/me', authMiddleware, uploadImageOnly, validateImageMetadata, async (req, res) => {
  try {
    const {
      displayName,
      bio,
      location,
      website
    } = req.body;
    
    // Campos permitidos para atualização
    const updatedFields = {};
    
    if (displayName !== undefined) updatedFields.displayName = displayName;
    if (bio !== undefined) updatedFields.bio = bio;
    if (location !== undefined) updatedFields.location = location;
    if (website !== undefined) updatedFields.website = website;
    
    // Se foi enviado um arquivo de avatar
    if (req.file) {
      updatedFields.avatar = `/uploads/avatars/${req.file.filename}`;
    }
    
    // Atualiza usuário
    await req.user.update(updatedFields);
    
    res.json({
      message: 'Perfil atualizado com sucesso!',
      user: req.user.toPublicJSON()
    });
    
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: error.errors.map(e => e.message).join(', ')
      });
    }
    
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /users/:userId/follow - Seguir/deixar de seguir usuário
router.post('/:userId/follow', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Não pode seguir a si mesmo
    if (userId === req.user.id) {
      return res.status(400).json({
        error: 'Não é possível seguir a si mesmo'
      });
    }
    
    // Verifica se usuário existe
    const targetUser = await User.findByPk(userId);
    if (!targetUser) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }
    
    // Toggle follow/unfollow
    const result = await Follow.toggleFollow(req.user.id, userId);
    
    res.json({
      message: result.message,
      following: result.following,
      user: targetUser.toPublicJSON()
    });
    
  } catch (error) {
    console.error('Erro ao seguir/deixar de seguir:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /users/:userId/followers - Lista seguidores de um usuário
router.get('/:userId/followers', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Busca seguidores
    const followers = await Follow.getFollowers(userId, {
      limit: parseInt(limit),
      offset
    });
    
    // Conta total
    const totalFollowers = await Follow.count({
      where: { followingId: userId }
    });
    
    res.json({
      followers: followers.map(f => f.Follower),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalFollowers,
        pages: Math.ceil(totalFollowers / limit)
      }
    });
    
  } catch (error) {
    console.error('Erro ao listar seguidores:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /users/:userId/following - Lista usuários que um usuário está seguindo
router.get('/:userId/following', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Busca usuários sendo seguidos
    const following = await Follow.getFollowing(userId, {
      limit: parseInt(limit),
      offset
    });
    
    // Conta total
    const totalFollowing = await Follow.count({
      where: { followerId: userId }
    });
    
    res.json({
      following: following.map(f => f.Following),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalFollowing,
        pages: Math.ceil(totalFollowing / limit)
      }
    });
    
  } catch (error) {
    console.error('Erro ao listar seguindo:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /users/me/feed - Feed personalizado do usuário (vídeos de quem segue)
router.get('/me/feed', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    // Busca IDs dos usuários que está seguindo
    const following = await Follow.findAll({
      where: { followerId: req.user.id },
      attributes: ['followingId']
    });
    
    const followingIds = following.map(f => f.followingId);
    
    // Se não segue ninguém, retorna vídeos populares
    if (followingIds.length === 0) {
      const popularVideos = await Video.findAll({
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'username', 'displayName', 'avatar', 'isVerified']
          }
        ],
        order: [['views', 'DESC'], ['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset
      });
      
      return res.json({
        videos: popularVideos,
        feedType: 'popular',
        message: 'Siga outros usuários para ver um feed personalizado!'
      });
    }
    
    // Feed dos usuários seguidos
    const feedVideos = await Video.findAll({
      where: {
        userId: { [Op.in]: followingIds }
      },
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'username', 'displayName', 'avatar', 'isVerified']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      videos: feedVideos,
      feedType: 'following',
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar feed:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// === MIDDLEWARE DE ERRO DE UPLOAD ===
router.use(handleUploadError);

module.exports = router;