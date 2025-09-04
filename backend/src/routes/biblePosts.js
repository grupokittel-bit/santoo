// ROTAS PARA SISTEMA BÍBLIA EXPLICADA
// Endpoints para posts bíblicos, interações, hábitos e administração

const express = require('express');
const { Op } = require('sequelize');
const { 
  BiblePost, 
  UserBibleInteraction, 
  BibleDisagreement, 
  UserHabitTracker,
  BiblePostView,
  User 
} = require('../models');
const { authMiddleware, biblePostCreatorOnly, bibleModeratorOnly } = require('../middleware/auth');

const router = express.Router();

// === UTILITÁRIOS E ALGORITMOS ===

/**
 * ALGORITMO DE RECOMENDAÇÃO PERSONALIZADO
 * Baseado em interações do usuário, categorias preferidas e hábitos
 */
async function getPersonalizedRecommendations(userId, limit = 10) {
  try {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('Usuário não encontrado');

    // 1. Buscar interações do usuário
    const userInteractions = await UserBibleInteraction.findAll({
      where: { user_id: userId },
      include: [{ model: BiblePost, attributes: ['category', 'tags'] }]
    });

    // 2. Extrair categorias preferidas das interações
    const preferredCategories = {};
    const preferredTags = {};
    
    userInteractions.forEach(interaction => {
      const category = interaction.BiblePost?.category;
      const tags = interaction.BiblePost?.tags || [];
      
      if (category) {
        preferredCategories[category] = (preferredCategories[category] || 0) + 1;
      }
      
      tags.forEach(tag => {
        preferredTags[tag] = (preferredTags[tag] || 0) + 1;
      });
    });

    // 3. Ordenar por preferência
    const topCategories = Object.keys(preferredCategories)
      .sort((a, b) => preferredCategories[b] - preferredCategories[a])
      .slice(0, 3);

    const topTags = Object.keys(preferredTags)
      .sort((a, b) => preferredTags[b] - preferredTags[a])
      .slice(0, 5);

    // 4. Buscar posts recomendados
    const whereConditions = {
      is_active: true
    };

    // Priorizar categorias do usuário ou usar preferências do perfil
    const userCategories = user.preferred_bible_categories || topCategories;
    if (userCategories.length > 0) {
      whereConditions.category = { [Op.in]: userCategories };
    }

    // Incluir tags preferidas
    if (topTags.length > 0) {
      whereConditions.tags = {
        [Op.overlap]: topTags
      };
    }

    // 5. Excluir posts que o usuário já viu recentemente
    const recentViews = await BiblePostView.findAll({
      where: { 
        user_id: userId,
        created_at: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Últimas 24h
      },
      attributes: ['bible_post_id']
    });

    const viewedPostIds = recentViews.map(view => view.bible_post_id);
    if (viewedPostIds.length > 0) {
      whereConditions.id = { [Op.notIn]: viewedPostIds };
    }

    return await BiblePost.findAll({
      where: whereConditions,
      limit: limit,
      order: [
        ['amen_count', 'DESC'],  // Posts com mais "amém"
        ['views_count', 'ASC'],   // Posts menos vistos (diversidade)
        ['created_at', 'DESC']    // Posts mais recentes
      ]
    });

  } catch (error) {
    console.error('Erro no algoritmo de recomendação:', error);
    // Fallback: posts populares recentes
    return await BiblePost.findAll({
      where: { is_active: true },
      limit: limit,
      order: [['amen_count', 'DESC'], ['created_at', 'DESC']]
    });
  }
}

/**
 * Registrar visualização de post
 */
async function registerView(userId, postId) {
  try {
    // Evitar duplicatas nas últimas 2 horas
    const recentView = await BiblePostView.findOne({
      where: {
        user_id: userId,
        bible_post_id: postId,
        created_at: { [Op.gte]: new Date(Date.now() - 2 * 60 * 60 * 1000) }
      }
    });

    if (!recentView) {
      await BiblePostView.create({
        user_id: userId,
        bible_post_id: postId
      });

      // Incrementar contador no post
      await BiblePost.increment('views_count', { where: { id: postId } });
    }
  } catch (error) {
    console.error('Erro ao registrar visualização:', error);
  }
}

// === ROTAS PÚBLICAS (FEED) ===

/**
 * GET /api/bible-posts - Feed personalizado com algoritmo
 * Retorna posts recomendados baseados no perfil e histórico do usuário
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    const userId = req.user.id;

    let posts;

    if (category || search) {
      // Busca filtrada
      const whereConditions = { is_active: true };
      
      if (category) whereConditions.category = category;
      if (search) {
        whereConditions[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { verse_reference: { [Op.iLike]: `%${search}%` } },
          { original_text: { [Op.iLike]: `%${search}%` } }
        ];
      }

      posts = await BiblePost.findAll({
        where: whereConditions,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']],
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'display_name', 'username', 'avatar_url']
          }
        ]
      });
    } else {
      // Feed personalizado com algoritmo de recomendação
      posts = await getPersonalizedRecommendations(userId, parseInt(limit));
      
      // Incluir dados do autor
      for (let post of posts) {
        post.author = await User.findByPk(post.author_admin_id, {
          attributes: ['id', 'display_name', 'username', 'avatar_url']
        });
      }
    }

    // Buscar interações do usuário com estes posts
    const postIds = posts.map(post => post.id);
    const userInteractions = await UserBibleInteraction.findAll({
      where: {
        user_id: userId,
        bible_post_id: { [Op.in]: postIds }
      }
    });

    // Mapear interações por post
    const interactionsByPost = {};
    userInteractions.forEach(interaction => {
      if (!interactionsByPost[interaction.bible_post_id]) {
        interactionsByPost[interaction.bible_post_id] = [];
      }
      interactionsByPost[interaction.bible_post_id].push(interaction.interaction_type);
    });

    // Adicionar interações do usuário a cada post
    const postsWithInteractions = posts.map(post => ({
      ...post.toJSON(),
      user_interactions: interactionsByPost[post.id] || [],
      user_has_liked: (interactionsByPost[post.id] || []).includes('like'),
      user_has_amen: (interactionsByPost[post.id] || []).includes('amen'),
      user_has_ops: (interactionsByPost[post.id] || []).includes('ops')
    }));

    // Registrar views dos posts para o usuário
    postIds.forEach(postId => registerView(userId, postId));

    res.json({
      success: true,
      data: postsWithInteractions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        has_more: posts.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar feed de posts bíblicos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar feed de posts bíblicos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// === ROTAS DE INTERAÇÃO ===

/**
 * POST /api/bible-posts/:id/interact - Interagir com post (like, amém, ops)
 * Body: { type: 'like' | 'amen' | 'ops' }
 */
router.post('/:id/interact', authMiddleware, async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { type } = req.body;
    const userId = req.user.id;

    // Validar tipo de interação
    const validTypes = ['like', 'amen', 'ops'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de interação inválido. Use: like, amen ou ops'
      });
    }

    // Verificar se post existe
    const post = await BiblePost.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post bíblico não encontrado'
      });
    }

    // Verificar se usuário já interagiu com este tipo
    const existingInteraction = await UserBibleInteraction.findOne({
      where: {
        user_id: userId,
        bible_post_id: postId,
        interaction_type: type
      }
    });

    if (existingInteraction) {
      // Remove interação (toggle)
      await existingInteraction.destroy();
      
      // Decrementa contador no post
      const counterField = `${type}_count`;
      await BiblePost.decrement(counterField, { where: { id: postId } });

      // Para interações "amen" removidas, registrar no habit tracker
      if (type === 'amen') {
        await UserHabitTracker.create({
          user_id: userId,
          bible_post_id: postId,
          habit_type: 'amen_failed',
          date: new Date(),
          notes: 'Usuário removeu "Amém" - possível falha no hábito'
        });
      }

      res.json({
        success: true,
        message: `${type} removido com sucesso`,
        action: 'removed',
        interaction_type: type
      });

    } else {
      // Cria nova interação
      await UserBibleInteraction.create({
        user_id: userId,
        bible_post_id: postId,
        interaction_type: type
      });

      // Incrementa contador no post
      const counterField = `${type}_count`;
      await BiblePost.increment(counterField, { where: { id: postId } });

      // Para interações "amen" e "ops", registrar no habit tracker
      if (type === 'amen') {
        await UserHabitTracker.create({
          user_id: userId,
          bible_post_id: postId,
          habit_type: 'amen_success',
          date: new Date(),
          notes: 'Usuário confirmou que já pratica este ensinamento'
        });

        // Atualizar streak do usuário
        await User.increment('bible_study_streak', { where: { id: userId } });

      } else if (type === 'ops') {
        await UserHabitTracker.create({
          user_id: userId,
          bible_post_id: postId,
          habit_type: 'ops_commitment',
          date: new Date(),
          notes: 'Usuário se comprometeu a começar a praticar'
        });
      }

      res.json({
        success: true,
        message: `${type} adicionado com sucesso`,
        action: 'added',
        interaction_type: type
      });
    }

  } catch (error) {
    console.error('Erro ao processar interação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar interação',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/bible-posts/my-interactions/:type - Buscar interações do usuário
 * Params: type = 'amen' | 'ops' | 'like'
 */
router.get('/my-interactions/:type', authMiddleware, async (req, res) => {
  try {
    const { type } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    // Validar tipo
    const validTypes = ['amen', 'ops', 'like'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo inválido. Use: amen, ops ou like'
      });
    }

    const offset = (page - 1) * limit;

    const interactions = await UserBibleInteraction.findAll({
      where: {
        user_id: userId,
        interaction_type: type
      },
      include: [
        {
          model: BiblePost,
          where: { is_active: true },
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'display_name', 'username', 'avatar_url']
            }
          ]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    // Para tipo "ops", buscar progresso do usuário
    let progressData = null;
    if (type === 'ops') {
      const postIds = interactions.map(i => i.bible_post_id);
      
      // Buscar quantos "ops" viraram "amen" (progresso)
      const progressCount = await UserBibleInteraction.count({
        where: {
          user_id: userId,
          bible_post_id: { [Op.in]: postIds },
          interaction_type: 'amen'
        }
      });

      progressData = {
        total_commitments: interactions.length,
        completed_habits: progressCount,
        progress_percentage: interactions.length > 0 
          ? Math.round((progressCount / interactions.length) * 100) 
          : 0
      };
    }

    res.json({
      success: true,
      data: interactions.map(interaction => ({
        id: interaction.id,
        interaction_date: interaction.created_at,
        post: interaction.BiblePost
      })),
      progress: progressData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        has_more: interactions.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar interações do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar suas interações',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// === ROTAS DE DISCORDÂNCIA ===

/**
 * POST /api/bible-posts/:id/disagree - Registrar discordância detalhada
 * Body: { disagreement_type, reason, description }
 */
router.post('/:id/disagree', authMiddleware, async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { disagreement_type, reason, description } = req.body;
    const userId = req.user.id;

    // Validações
    if (!disagreement_type || !reason || !description) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: disagreement_type, reason, description'
      });
    }

    const validTypes = [
      'contexto_historico',
      'traducao_incorreta', 
      'aplicacao_moderna',
      'interpretacao_teologica',
      'informacao_factual',
      'linguagem_inadequada',
      'falta_referencias',
      'viés_denominacional',
      'outros'
    ];

    if (!validTypes.includes(disagreement_type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de discordância inválido',
        valid_types: validTypes
      });
    }

    // Verificar se post existe
    const post = await BiblePost.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post bíblico não encontrado'
      });
    }

    // Verificar se usuário já discordou deste post recentemente (evitar spam)
    const recentDisagreement = await BibleDisagreement.findOne({
      where: {
        user_id: userId,
        bible_post_id: postId,
        created_at: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    });

    if (recentDisagreement) {
      return res.status(429).json({
        success: false,
        message: 'Você já registrou uma discordância para este post nas últimas 24h'
      });
    }

    // Criar discordância
    const disagreement = await BibleDisagreement.create({
      user_id: userId,
      bible_post_id: postId,
      disagreement_type,
      reason,
      description,
      status: 'pending'
    });

    // Incrementar contador no post
    await BiblePost.increment('disagree_count', { where: { id: postId } });

    // Registrar interação de discordância
    await UserBibleInteraction.create({
      user_id: userId,
      bible_post_id: postId,
      interaction_type: 'disagree'
    });

    res.status(201).json({
      success: true,
      message: 'Discordância registrada com sucesso. Será analisada pela equipe.',
      data: {
        id: disagreement.id,
        status: 'pending',
        created_at: disagreement.created_at
      }
    });

  } catch (error) {
    console.error('Erro ao registrar discordância:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar discordância',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// === ROTAS ADMINISTRATIVAS ===

/**
 * POST /api/bible-posts - Criar novo post bíblico (Admin/Pastor apenas)
 */
router.post('/', [authMiddleware, biblePostCreatorOnly], async (req, res) => {
  try {
    const {
      title,
      verse_reference,
      original_text,
      historical_context,
      modern_translation,
      practical_meaning,
      modern_application,
      curiosities,
      category,
      tags = []
    } = req.body;

    // Validações obrigatórias
    const requiredFields = [
      'title', 'verse_reference', 'original_text', 
      'historical_context', 'modern_translation', 
      'practical_meaning', 'modern_application', 'category'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios faltando',
        missing_fields: missingFields
      });
    }

    // Validar categoria
    const validCategories = [
      'sabedoria', 'amor', 'fe', 'oracao', 'relacionamentos', 
      'trabalho', 'familia', 'paz', 'perdao', 'gratidao', 
      'crescimento', 'proposito'
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Categoria inválida',
        valid_categories: validCategories
      });
    }

    // Criar post
    const post = await BiblePost.create({
      title,
      verse_reference,
      original_text,
      historical_context,
      modern_translation,
      practical_meaning,
      modern_application,
      curiosities,
      author_admin_id: req.user.id,
      category,
      tags: Array.isArray(tags) ? tags : [],
      is_active: true
    });

    res.status(201).json({
      success: true,
      message: 'Post bíblico criado com sucesso',
      data: {
        id: post.id,
        title: post.title,
        category: post.category,
        created_at: post.created_at
      }
    });

  } catch (error) {
    console.error('Erro ao criar post bíblico:', error);
    
    // Tratar erros de validação do Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro ao criar post bíblico',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/bible-posts/admin/disagreements - Painel de discordâncias (Admin apenas)
 */
router.get('/admin/disagreements', [authMiddleware, bibleModeratorOnly], async (req, res) => {
  try {
    const {
      status = 'pending',
      page = 1,
      limit = 20,
      disagreement_type
    } = req.query;

    const offset = (page - 1) * limit;
    const whereConditions = {};

    if (status !== 'all') whereConditions.status = status;
    if (disagreement_type) whereConditions.disagreement_type = disagreement_type;

    const disagreements = await BibleDisagreement.findAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'display_name', 'username', 'spiritual_level']
        },
        {
          model: BiblePost,
          attributes: ['id', 'title', 'verse_reference', 'category']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'display_name', 'username'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    // Estatísticas para o painel admin
    const stats = await BibleDisagreement.findAll({
      attributes: [
        'status',
        [BibleDisagreement.sequelize.fn('COUNT', BibleDisagreement.sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    const statsObj = stats.reduce((acc, stat) => {
      acc[stat.status] = parseInt(stat.dataValues.count);
      return acc;
    }, {});

    res.json({
      success: true,
      data: disagreements,
      statistics: {
        total: Object.values(statsObj).reduce((a, b) => a + b, 0),
        pending: statsObj.pending || 0,
        under_review: statsObj.under_review || 0,
        accepted: statsObj.accepted || 0,
        rejected: statsObj.rejected || 0
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        has_more: disagreements.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar discordâncias:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar painel de discordâncias',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/bible-posts/admin/disagreements/:id - Analisar discordância (Admin apenas)
 * Body: { status: 'accepted' | 'rejected', admin_response }
 */
router.put('/admin/disagreements/:id', [authMiddleware, bibleModeratorOnly], async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_response } = req.body;
    const adminId = req.user.id;

    // Validações
    if (!['under_review', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status inválido. Use: under_review, accepted, rejected'
      });
    }

    if ((status === 'accepted' || status === 'rejected') && !admin_response) {
      return res.status(400).json({
        success: false,
        message: 'Resposta do admin é obrigatória para aceitar ou rejeitar'
      });
    }

    // Buscar discordância
    const disagreement = await BibleDisagreement.findByPk(id, {
      include: [
        { model: User, as: 'user' },
        { model: BiblePost }
      ]
    });

    if (!disagreement) {
      return res.status(404).json({
        success: false,
        message: 'Discordância não encontrada'
      });
    }

    // Atualizar discordância
    await disagreement.update({
      status,
      admin_response: admin_response || disagreement.admin_response,
      reviewed_by: adminId,
      reviewed_at: new Date()
    });

    // Se foi aceita, pode implementar lógica para atualizar o post
    if (status === 'accepted') {
      // TODO: Implementar sistema de sugestões aceitas
      // Por exemplo, marcar o post para revisão ou criar versão corrigida
      console.log(`✅ Discordância aceita para post ${disagreement.bible_post_id} pelo admin ${adminId}`);
    }

    res.json({
      success: true,
      message: `Discordância ${status === 'accepted' ? 'aceita' : status === 'rejected' ? 'rejeitada' : 'em análise'}`,
      data: {
        id: disagreement.id,
        status: disagreement.status,
        reviewed_at: disagreement.reviewed_at,
        admin_response: disagreement.admin_response
      }
    });

  } catch (error) {
    console.error('Erro ao analisar discordância:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar análise da discordância',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;