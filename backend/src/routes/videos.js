// ROTA DE VÍDEOS
// Endpoints para upload, feed, curtir, comentar, buscar vídeos

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { Video, User, Category, Comment, Like } = require('../models');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// === CONFIGURAÇÃO MULTER PARA UPLOAD DE VÍDEOS ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'src/uploads/videos';
    
    // Cria pasta se não existir
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Nome único: timestamp + nome original
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

// Filtro para aceitar apenas vídeos
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos de vídeo são permitidos!'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB máximo
  }
});

// === ROTAS PÚBLICAS ===

// GET /videos - Feed público de vídeos (com filtros)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      sortBy = 'recent', // recent, popular, trending
      userId
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Filtros
    const whereClause = {};
    
    if (category) {
      whereClause.categoryId = category;
    }
    
    if (userId) {
      whereClause.userId = userId;
    }
    
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { tags: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Ordenação
    let orderClause = [];
    switch (sortBy) {
      case 'popular':
        orderClause = [['views', 'DESC'], ['createdAt', 'DESC']];
        break;
      case 'trending':
        orderClause = [['likes', 'DESC'], ['views', 'DESC']];
        break;
      default: // recent
        orderClause = [['createdAt', 'DESC']];
    }
    
    // Busca vídeos
    const { rows: videos, count } = await Video.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'username', 'displayName', 'avatar', 'isVerified']
        },
        {
          model: Category,
          as: 'Category',
          attributes: ['id', 'name', 'color', 'icon']
        }
      ],
      order: orderClause,
      limit: parseInt(limit),
      offset
    });
    
    // Se há usuário logado, verifica curtidas
    if (req.user) {
      for (let video of videos) {
        const userLiked = await Like.findOne({
          where: { userId: req.user.id, videoId: video.id }
        });
        video.setDataValue('userLiked', !!userLiked);
      }
    }
    
    res.json({
      videos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      },
      filters: {
        category,
        search,
        sortBy
      }
    });
    
  } catch (error) {
    console.error('Erro ao listar vídeos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /videos/:id - Detalhes de um vídeo específico
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Busca vídeo com dados relacionados
    const video = await Video.findByPk(id, {
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'username', 'displayName', 'avatar', 'isVerified', 'followersCount']
        },
        {
          model: Category,
          as: 'Category',
          attributes: ['id', 'name', 'color', 'icon']
        },
        {
          model: Comment,
          as: 'comments',
          limit: 5,
          order: [['createdAt', 'DESC']],
          include: [
            {
              model: User,
              as: 'User',
              attributes: ['id', 'username', 'displayName', 'avatar', 'isVerified']
            }
          ]
        }
      ]
    });
    
    if (!video) {
      return res.status(404).json({
        error: 'Vídeo não encontrado'
      });
    }
    
    // Incrementa views
    await video.increment('views');
    
    // Verifica se usuário curtiu (se logado)
    let userLiked = false;
    let userFollowing = false;
    
    if (req.user) {
      const like = await Like.findOne({
        where: { userId: req.user.id, videoId: video.id }
      });
      userLiked = !!like;
      
      // Verifica se segue o autor (se não for ele mesmo)
      if (req.user.id !== video.User.id) {
        const Follow = require('../models/Follow');
        userFollowing = await Follow.isFollowing(req.user.id, video.User.id);
      }
    }
    
    video.setDataValue('userLiked', userLiked);
    video.setDataValue('userFollowing', userFollowing);
    
    res.json({ video });
    
  } catch (error) {
    console.error('Erro ao buscar vídeo:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// === ROTAS PROTEGIDAS ===

// POST /videos - Upload de novo vídeo
router.post('/', authMiddleware, upload.single('video'), async (req, res) => {
  try {
    const {
      title,
      description,
      categoryId,
      tags,
      thumbnail
    } = req.body;
    
    // Validações
    if (!title || !req.file) {
      return res.status(400).json({
        error: 'Título e arquivo de vídeo são obrigatórios'
      });
    }
    
    // Verifica se categoria existe
    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(400).json({
          error: 'Categoria inválida'
        });
      }
    }
    
    // Cria vídeo
    const video = await Video.create({
      title,
      description,
      categoryId: categoryId || null,
      tags: tags || '',
      thumbnail: thumbnail || null,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      userId: req.user.id
    });
    
    // Incrementa contador de vídeos do usuário
    await req.user.increment('videosCount');
    
    // Retorna vídeo criado com dados relacionados
    const newVideo = await Video.findByPk(video.id, {
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'username', 'displayName', 'avatar', 'isVerified']
        },
        {
          model: Category,
          as: 'Category',
          attributes: ['id', 'name', 'color', 'icon']
        }
      ]
    });
    
    res.status(201).json({
      message: 'Vídeo enviado com sucesso!',
      video: newVideo
    });
    
  } catch (error) {
    console.error('Erro no upload:', error);
    
    // Remove arquivo se erro aconteceu
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
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

// PUT /videos/:id - Atualiza vídeo (apenas do próprio usuário)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, categoryId, tags, thumbnail } = req.body;
    
    // Busca vídeo
    const video = await Video.findByPk(id);
    
    if (!video) {
      return res.status(404).json({
        error: 'Vídeo não encontrado'
      });
    }
    
    // Verifica se é o dono do vídeo
    if (video.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Você só pode editar seus próprios vídeos'
      });
    }
    
    // Atualiza campos
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (tags !== undefined) updateData.tags = tags;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
    
    await video.update(updateData);
    
    res.json({
      message: 'Vídeo atualizado com sucesso!',
      video
    });
    
  } catch (error) {
    console.error('Erro ao atualizar vídeo:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// DELETE /videos/:id - Remove vídeo (apenas do próprio usuário)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Busca vídeo
    const video = await Video.findByPk(id);
    
    if (!video) {
      return res.status(404).json({
        error: 'Vídeo não encontrado'
      });
    }
    
    // Verifica se é o dono do vídeo
    if (video.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Você só pode deletar seus próprios vídeos'
      });
    }
    
    // Remove arquivo físico
    if (video.filePath && fs.existsSync(video.filePath)) {
      fs.unlinkSync(video.filePath);
    }
    
    // Remove do banco
    await video.destroy();
    
    // Decrementa contador do usuário
    await req.user.decrement('videosCount');
    
    res.json({
      message: 'Vídeo removido com sucesso!'
    });
    
  } catch (error) {
    console.error('Erro ao remover vídeo:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /videos/:id/like - Curtir/descurtir vídeo
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verifica se vídeo existe
    const video = await Video.findByPk(id);
    if (!video) {
      return res.status(404).json({
        error: 'Vídeo não encontrado'
      });
    }
    
    // Toggle like
    const existingLike = await Like.findOne({
      where: { userId: req.user.id, videoId: id }
    });
    
    if (existingLike) {
      // Remove curtida
      await existingLike.destroy();
      await video.decrement('likes');
      
      res.json({
        message: 'Curtida removida',
        liked: false,
        likes: video.likes - 1
      });
    } else {
      // Adiciona curtida
      await Like.create({
        userId: req.user.id,
        videoId: id
      });
      await video.increment('likes');
      
      res.json({
        message: 'Vídeo curtido!',
        liked: true,
        likes: video.likes + 1
      });
    }
    
  } catch (error) {
    console.error('Erro ao curtir vídeo:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;