// ROTA DE COMENTÁRIOS
// Endpoints para comentar, responder, moderar comentários

const express = require('express');
const { Comment, User, Video } = require('../models');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// === ROTAS PÚBLICAS ===

// GET /comments/video/:videoId - Lista comentários de um vídeo
router.get('/video/:videoId', optionalAuth, async (req, res) => {
  try {
    const { videoId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Busca comentários principais (sem parent)
    const { rows: comments, count } = await Comment.findAndCountAll({
      where: { 
        videoId,
        parentId: null // Apenas comentários principais
      },
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'username', 'displayName', 'avatar', 'isVerified']
        },
        {
          model: Comment,
          as: 'Replies',
          limit: 3, // Primeiras 3 respostas
          order: [['createdAt', 'ASC']],
          include: [
            {
              model: User,
              as: 'User',
              attributes: ['id', 'username', 'displayName', 'avatar', 'isVerified']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    // Conta respostas para cada comentário
    for (let comment of comments) {
      const repliesCount = await Comment.count({
        where: { parentId: comment.id }
      });
      comment.setDataValue('repliesCount', repliesCount);
    }
    
    res.json({
      comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
    
  } catch (error) {
    console.error('Erro ao listar comentários:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /comments/:commentId/replies - Lista respostas de um comentário
router.get('/:commentId/replies', optionalAuth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Busca respostas
    const { rows: replies, count } = await Comment.findAndCountAll({
      where: { parentId: commentId },
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'username', 'displayName', 'avatar', 'isVerified']
        }
      ],
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      replies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
    
  } catch (error) {
    console.error('Erro ao listar respostas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// === ROTAS PROTEGIDAS ===

// POST /comments - Criar novo comentário
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { videoId, parentId, content } = req.body;
    
    // Validações
    if (!videoId || !content) {
      return res.status(400).json({
        error: 'VideoId e conteúdo são obrigatórios'
      });
    }
    
    if (content.trim().length < 1) {
      return res.status(400).json({
        error: 'Comentário não pode estar vazio'
      });
    }
    
    // Verifica se vídeo existe
    const video = await Video.findByPk(videoId);
    if (!video) {
      return res.status(404).json({
        error: 'Vídeo não encontrado'
      });
    }
    
    // Se é resposta, verifica se comentário pai existe
    if (parentId) {
      const parentComment = await Comment.findByPk(parentId);
      if (!parentComment || parentComment.videoId !== videoId) {
        return res.status(404).json({
          error: 'Comentário pai não encontrado'
        });
      }
    }
    
    // Cria comentário
    const comment = await Comment.create({
      videoId,
      parentId: parentId || null,
      userId: req.user.id,
      content: content.trim()
    });
    
    // Incrementa contador de comentários no vídeo
    await video.increment('comments');
    
    // Busca comentário criado com dados do usuário
    const newComment = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'username', 'displayName', 'avatar', 'isVerified']
        }
      ]
    });
    
    res.status(201).json({
      message: parentId ? 'Resposta adicionada!' : 'Comentário adicionado!',
      comment: newComment
    });
    
  } catch (error) {
    console.error('Erro ao criar comentário:', error);
    
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

// PUT /comments/:id - Editar comentário próprio
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    // Validações
    if (!content || content.trim().length < 1) {
      return res.status(400).json({
        error: 'Conteúdo do comentário é obrigatório'
      });
    }
    
    // Busca comentário
    const comment = await Comment.findByPk(id);
    
    if (!comment) {
      return res.status(404).json({
        error: 'Comentário não encontrado'
      });
    }
    
    // Verifica se é o dono do comentário
    if (comment.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Você só pode editar seus próprios comentários'
      });
    }
    
    // Atualiza comentário
    await comment.update({
      content: content.trim(),
      editedAt: new Date()
    });
    
    // Retorna comentário atualizado
    const updatedComment = await Comment.findByPk(id, {
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'username', 'displayName', 'avatar', 'isVerified']
        }
      ]
    });
    
    res.json({
      message: 'Comentário atualizado!',
      comment: updatedComment
    });
    
  } catch (error) {
    console.error('Erro ao editar comentário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// DELETE /comments/:id - Remover comentário próprio
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Busca comentário
    const comment = await Comment.findByPk(id);
    
    if (!comment) {
      return res.status(404).json({
        error: 'Comentário não encontrado'
      });
    }
    
    // Verifica se é o dono do comentário (ou admin no futuro)
    if (comment.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        error: 'Você só pode deletar seus próprios comentários'
      });
    }
    
    // Remove comentário (e suas respostas automaticamente pelo CASCADE)
    await comment.destroy();
    
    // Decrementa contador no vídeo
    const video = await Video.findByPk(comment.videoId);
    if (video) {
      await video.decrement('comments');
    }
    
    res.json({
      message: 'Comentário removido!'
    });
    
  } catch (error) {
    console.error('Erro ao remover comentário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /comments/user/:userId - Lista comentários de um usuário
router.get('/user/:userId', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Busca comentários do usuário
    const { rows: comments, count } = await Comment.findAndCountAll({
      where: { userId },
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'username', 'displayName', 'avatar', 'isVerified']
        },
        {
          model: Video,
          as: 'Video',
          attributes: ['id', 'title', 'thumbnail']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
    
  } catch (error) {
    console.error('Erro ao listar comentários do usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;