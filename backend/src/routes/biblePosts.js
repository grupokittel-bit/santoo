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
const { authMiddleware, optionalAuth, biblePostCreatorOnly, bibleModeratorOnly } = require('../middleware/auth');

const router = express.Router();

// === UTILITÁRIOS E ALGORITMOS ===

/**
 * ALGORITMO DE RECOMENDAÇÃO PERSONALIZADO
 * Baseado em interações do usuário, categorias preferidas e hábitos
 */
async function getPersonalizedRecommendations(userId, limit = 10, excludeViewed = true) {
  try {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('Usuário não encontrado');

    // 1. Buscar interações do usuário
    const userInteractions = await UserBibleInteraction.findAll({
      where: { user_id: userId },
      include: [{ model: BiblePost, as: 'biblePost', attributes: ['category', 'tags'] }]
    });

    // 2. Extrair categorias preferidas das interações
    const preferredCategories = {};
    const preferredTags = {};
    
    userInteractions.forEach(interaction => {
      const category = interaction.biblePost?.category;
      const tags = interaction.biblePost?.tags || [];
      
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

    // 🧠 ALGORITMO INTELIGENTE: Só aplicar filtros se há dados suficientes
    const userCategories = user.preferred_bible_categories || topCategories;
    const hasEnoughData = userInteractions.length >= 200; // Pelo menos 200 interações
    
    if (hasEnoughData && userCategories && userCategories.length > 0) {
      console.log('🧠 [ALGORITMO] Aplicando filtro inteligente por categorias:', userCategories);
      whereConditions.category = { [Op.in]: userCategories };
    } else {
      console.log('🧠 [ALGORITMO] Fallback: Dados insuficientes, mostrando diversidade de posts');
      // FALLBACK INTELIGENTE: Não filtrar para mostrar diversidade
    }

    // Aplicar filtro de tags apenas se há muitas interações (dados robustos)
    if (hasEnoughData && topTags && topTags.length >= 2) {
      console.log('🧠 [ALGORITMO] Aplicando filtro por tags:', topTags);
      whereConditions.tags = {
        [Op.overlap]: topTags
      };
    } else {
      console.log('🧠 [ALGORITMO] Fallback: Sem filtro de tags para maior diversidade');
    }

    // 5. Gerenciamento inteligente de posts já visualizados
    if (excludeViewed && hasEnoughData) {
      // Só excluir posts recentes se usuário tem muitas interações
      const recentViews = await BiblePostView.findAll({
        where: { 
          user_id: userId,
          createdAt: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Últimas 7 dias
        },
        attributes: ['bible_post_id']
      });

      const viewedPostIds = recentViews.map(view => view.bible_post_id);
      console.log('🔍 [DEBUG] Posts visualizados recentemente:', viewedPostIds.length);
      
      // Só excluir se não for mais de 70% do conteúdo total
      if (viewedPostIds.length > 0 && viewedPostIds.length < 20) {
        whereConditions.id = { [Op.notIn]: viewedPostIds };
        console.log('🚫 [ALGORITMO] Excluindo posts recentemente visualizados');
      } else {
        console.log('🔄 [ALGORITMO] Não excluindo - usuário viu muitos posts recentemente');
      }
    } else {
      console.log('🆕 [ALGORITMO] Usuário novo - mostrando todos os posts disponíveis');
    }

    // 🧠 ORDENAÇÃO ADAPTATIVA baseada na quantidade de dados
    let orderStrategy;
    
    if (hasEnoughData) {
      // Usuário experiente: priorizar engajamento e diversidade
      orderStrategy = [
        ['amen_count', 'DESC'],  // Posts com mais "amém"
        ['views_count', 'ASC'],   // Posts menos vistos (diversidade)
        ['createdAt', 'DESC']    // Posts mais recentes
      ];
      console.log('🧠 [ALGORITMO] Usando ordenação para usuário experiente');
    } else {
      // Usuário novo: mostrar diversidade de categorias e posts populares
      orderStrategy = [
        ['createdAt', 'DESC'],   // Posts mais recentes primeiro
        ['amen_count', 'DESC'],  // Posts populares
        ['likes_count', 'DESC']  // Posts curtidos
      ];
      console.log('🧠 [ALGORITMO] Usando ordenação para usuário novo (diversidade)');
    }

    const posts = await BiblePost.findAll({
      where: whereConditions,
      limit: limit,
      order: orderStrategy
    });
    
    console.log('🔍 [ALGORITMO] Posts encontrados:', posts.length);
    
    // 🛟 FALLBACK INTERNO: Se não encontrou posts, remover restrições
    if (posts.length === 0) {
      console.log('🛟 [FALLBACK INTERNO] Nenhum post encontrado, removendo todas as restrições...');
      
      const fallbackPosts = await BiblePost.findAll({
        where: { is_active: true }, // Apenas posts ativos
        limit: limit,
        order: [['createdAt', 'DESC'], ['amen_count', 'DESC']]
      });
      
      console.log('🛟 [FALLBACK INTERNO] Posts encontrados sem restrições:', fallbackPosts.length);
      return fallbackPosts;
    }
    
    return posts;

  } catch (error) {
    console.error('🚨 Erro no algoritmo de recomendação:', error);
    console.log('🛟 Ativando fallback de emergência - posts diversos e populares');
    
    // 🛟 FALLBACK DE EMERGÊNCIA: Garantir que sempre mostre conteúdo
    return await BiblePost.findAll({
      where: { is_active: true },
      limit: limit,
      order: [
        ['createdAt', 'DESC'],   // Novos primeiro (diversidade)
        ['amen_count', 'DESC'],  // Populares depois
        ['likes_count', 'DESC']  // Curtidos por último
      ]
    });
  }
}

/**
 * Registrar visualização de post
 */
async function registerView(userId, postId) {
  try {
    // Usar upsert para evitar problemas de unique constraint
    const [view, created] = await BiblePostView.findOrCreate({
      where: {
        user_id: userId,
        bible_post_id: postId
      },
      defaults: {
        user_id: userId,
        bible_post_id: postId,
        viewed_at: new Date(),
        view_source: 'feed',
        completed_reading: false,
        device_type: 'unknown'
      }
    });

    // Se foi criado um novo registro (não existia), incrementar contador
    if (created) {
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
router.get('/', optionalAuth, async (req, res) => {
  try {
    console.log('🔍 [DEBUG] Requisição para bible-posts com parâmetros:', req.query);
    
    const {
      page = 1,
      limit = 10,
      category,
      search,
      admin = false
    } = req.query;

    const offset = (page - 1) * limit;
    const userId = req.user ? req.user.id : null;

    let posts;

    // Converter admin para boolean se for string
    const isAdmin = admin === 'true' || admin === true;
    
    console.log('🔍 [DEBUG] Parâmetros processados:', { 
      admin, isAdmin, category, search, 
      willUseFiltered: !!(category || search || isAdmin)
    });
    
    if (category || search || isAdmin) {
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

      console.log('🔍 [DEBUG] Executando busca filtrada com whereConditions:', whereConditions);
      
      posts = await BiblePost.findAll({
        where: whereConditions,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'displayName', 'username', 'avatar']
          }
        ]
      });
      
      console.log('🔍 [DEBUG] Posts encontrados na busca filtrada:', posts.length);
    } else {
      // Verificar se usuário está logado para algoritmo personalizado
      if (userId) {
        // Feed personalizado com algoritmo de recomendação (USUÁRIO LOGADO)
        console.log('🧠 [ALGORITMO] Iniciando recomendação personalizada para usuário:', userId);
        console.log('🔍 [DEBUG] Parâmetros: excludeViewed:', !isAdmin, 'limit:', limit);
        
        posts = await getPersonalizedRecommendations(userId, parseInt(limit), !isAdmin);
        
        console.log('🧠 [ALGORITMO] Posts retornados pelo algoritmo:', posts.length);
        if (posts.length === 0) {
          console.log('🚨 [ALERTA] Algoritmo retornou 0 posts - pode indicar problema!');
        }
        
        // Incluir dados do autor
        for (let post of posts) {
          post.author = await User.findByPk(post.author_admin_id, {
            attributes: ['id', 'displayName', 'username', 'avatar']
          });
        }
      } else {
        // Feed público para usuários não logados (SIMPLES E EFICIENTE)
        console.log('👤 [PÚBLICO] Feed para usuário não logado - posts populares');
        
        posts = await BiblePost.findAll({
          where: { is_active: true },
          limit: parseInt(limit),
          offset: parseInt(offset),
          order: [
            ['amen_count', 'DESC'],    // Posts com mais "amém" primeiro
            ['likes_count', 'DESC'],   // Posts mais curtidos
            ['createdAt', 'DESC']      // Posts mais recentes
          ],
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'displayName', 'username', 'avatar']
            }
          ]
        });
        
        console.log('👤 [PÚBLICO] Posts públicos encontrados:', posts.length);
      }
    }

    // Buscar interações do usuário com estes posts (APENAS SE LOGADO)
    const postIds = posts.map(post => post.id);
    let userInteractions = [];
    let interactionsByPost = {};
    
    if (userId) {
      userInteractions = await UserBibleInteraction.findAll({
        where: {
          user_id: userId,
          bible_post_id: { [Op.in]: postIds }
        }
      });

      // Mapear interações por post
      userInteractions.forEach(interaction => {
        if (!interactionsByPost[interaction.bible_post_id]) {
          interactionsByPost[interaction.bible_post_id] = [];
        }
        interactionsByPost[interaction.bible_post_id].push(interaction.interaction_type);
      });
      
      // Registrar views dos posts para o usuário logado
      postIds.forEach(postId => registerView(userId, postId));
    }

    // Adicionar interações do usuário a cada post
    const postsWithInteractions = posts.map(post => ({
      ...post.toJSON(),
      user_interactions: interactionsByPost[post.id] || [],
      user_has_liked: (interactionsByPost[post.id] || []).includes('like'),
      user_has_amen: (interactionsByPost[post.id] || []).includes('amen'),
      user_has_ops: (interactionsByPost[post.id] || []).includes('ops')
    }));

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
      const counterField = type === 'like' ? 'likes_count' : `${type}_count`;
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
      // 🔧 CORREÇÃO: Amém e Ops são mutuamente exclusivos
      if (type === 'amen' || type === 'ops') {
        // Remove a interação exclusiva anterior se existir
        const exclusiveTypes = ['amen', 'ops'];
        const exclusiveType = exclusiveTypes.find(t => t !== type);
        
        const exclusiveInteraction = await UserBibleInteraction.findOne({
          where: {
            user_id: userId,
            bible_post_id: postId,
            interaction_type: exclusiveType
          }
        });
        
        if (exclusiveInteraction) {
          // Remove a interação exclusiva anterior
          await exclusiveInteraction.destroy();
          
          // Decrementa o contador anterior
          const exclusiveCounterField = `${exclusiveType}_count`;
          await BiblePost.decrement(exclusiveCounterField, { where: { id: postId } });
          
          console.log(`🔄 Trocando ${exclusiveType} por ${type} para usuário ${userId} no post ${postId}`);
        }
      }
      
      // Cria nova interação
      await UserBibleInteraction.create({
        user_id: userId,
        bible_post_id: postId,
        interaction_type: type
      });

      // Incrementa contador no post
      const counterField = type === 'like' ? 'likes_count' : `${type}_count`;
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
          as: 'biblePost',
          where: { is_active: true },
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'displayName', 'username', 'avatar']
            }
          ]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
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
        bible_post_id: interaction.bible_post_id,  // ✅ CORREÇÃO: Frontend precisa deste campo
        interaction_type: interaction.interaction_type,  // ✅ CORREÇÃO: Frontend precisa deste campo
        interaction_date: interaction.createdAt,
        post: interaction.biblePost
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
        createdAt: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) }
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
        created_at: disagreement.createdAt
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
        created_at: post.createdAt
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
          attributes: ['id', 'displayName', 'username', 'spiritual_level']
        },
        {
          model: BiblePost,
          as: 'biblePost',
          attributes: ['id', 'title', 'verse_reference', 'category']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'displayName', 'username'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
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
        { model: BiblePost, as: 'biblePost' }
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

/**
 * Get user progress statistics
 * GET /api/bible-posts/my-progress-stats
 */
router.get('/my-progress-stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const [amenCount, opsCount] = await Promise.all([
      UserBibleInteraction.count({
        where: { 
          user_id: userId,
          interaction_type: 'amen',
          interaction_value: 1
        }
      }),
      UserBibleInteraction.count({
        where: { 
          user_id: userId,
          interaction_type: 'ops',
          interaction_value: 1
        }
      })
    ]);

    const habitStats = await UserHabitTracker.getUserHabitStats(userId);
    const maxStreak = await UserHabitTracker.getUserMaxStreak(userId);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlyInteractions = await UserBibleInteraction.count({
      where: {
        user_id: userId,
        created_at: {
          [require('sequelize').Op.gte]: thirtyDaysAgo
        },
        interaction_value: 1
      }
    });

    const monthlyRate = Math.round((monthlyInteractions / 30) * 100);

    res.json({
      success: true,
      data: {
        amenCount,
        opsCount,
        streakCount: maxStreak || 0,
        monthlyRate: monthlyRate || 0,
        totalInteractions: amenCount + opsCount,
        habitStats
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas de progresso:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar estatísticas de progresso',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get week progress for a specific bible post/habit
 * GET /api/bible-posts/:id/week-progress
 */
router.get('/:id/week-progress', authMiddleware, async (req, res) => {
  try {
    const { id: biblePostId } = req.params;
    const userId = req.user.id;

    const biblePost = await BiblePost.findByPk(biblePostId);
    if (!biblePost) {
      return res.status(404).json({
        success: false,
        message: 'Post bíblico não encontrado'
      });
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weekHabits = await UserHabitTracker.findAll({
      where: {
        user_id: userId,
        bible_post_id: biblePostId,
        created_at: {
          [require('sequelize').Op.gte]: oneWeekAgo
        }
      },
      order: [['created_at', 'DESC']]
    });

    const weekInteractions = await UserBibleInteraction.findAll({
      where: {
        user_id: userId,
        bible_post_id: biblePostId,
        createdAt: {
          [require('sequelize').Op.gte]: oneWeekAgo
        },
        interaction_value: 1
      },
      order: [['createdAt', 'DESC']]
    });

    const today = new Date();
    const weekProgress = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayHabits = weekHabits.filter(habit => 
        habit.createdAt >= dayStart && habit.createdAt <= dayEnd
      );

      const dayInteractions = weekInteractions.filter(interaction => 
        interaction.createdAt >= dayStart && interaction.createdAt <= dayEnd
      );

      weekProgress.push({
        date: dayStart.toISOString().split('T')[0],
        hasActivity: dayHabits.length > 0 || dayInteractions.length > 0,
        habitsCount: dayHabits.length,
        interactionsCount: dayInteractions.length,
        types: [...new Set(dayInteractions.map(i => i.type))]
      });
    }

    res.json({
      success: true,
      data: {
        biblePostId,
        weekProgress,
        totalActiveDays: weekProgress.filter(day => day.hasActivity).length,
        streak: calculateCurrentStreak(weekProgress)
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar progresso semanal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar progresso semanal',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

function calculateCurrentStreak(weekProgress) {
  let currentStreak = 0;
  
  for (let i = weekProgress.length - 1; i >= 0; i--) {
    if (weekProgress[i].hasActivity) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  return currentStreak;
}

/**
 * Get week chart data for progress visualization
 * GET /api/bible-posts/week-chart-data
 */
router.get('/week-chart-data', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weekData = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const [amenCount, opsCount] = await Promise.all([
        UserBibleInteraction.count({
          where: {
            user_id: userId,
            interaction_type: 'amen',
            createdAt: {
              [require('sequelize').Op.between]: [dayStart, dayEnd]
            },
            interaction_value: 1
          }
        }),
        UserBibleInteraction.count({
          where: {
            user_id: userId,
            interaction_type: 'ops', 
            createdAt: {
              [require('sequelize').Op.between]: [dayStart, dayEnd]
            },
            interaction_value: 1
          }
        })
      ]);

      weekData.push({
        date: dayStart.toISOString().split('T')[0],
        dayName: dayStart.toLocaleDateString('pt-BR', { weekday: 'short' }),
        amen: amenCount,
        ops: opsCount,
        total: amenCount + opsCount
      });
    }

    res.json({
      success: true,
      data: {
        weekData,
        summary: {
          totalAmen: weekData.reduce((sum, day) => sum + day.amen, 0),
          totalOps: weekData.reduce((sum, day) => sum + day.ops, 0),
          activeDays: weekData.filter(day => day.total > 0).length
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar dados do gráfico semanal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar dados do gráfico',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get category performance data
 * GET /api/bible-posts/category-performance
 */
router.get('/category-performance', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const categoryStats = await UserBibleInteraction.findAll({
      where: {
        user_id: userId,
        interaction_value: 1
      },
      include: [{
        model: BiblePost,
        as: 'biblePost',
        attributes: ['category', 'title']
      }],
      attributes: [
        [require('sequelize').fn('COUNT', require('sequelize').col('UserBibleInteraction.id')), 'totalInteractions'],
        [require('sequelize').col('biblePost.category'), 'category']
      ],
      group: ['biblePost.category'],
      order: [[require('sequelize').fn('COUNT', require('sequelize').col('UserBibleInteraction.id')), 'DESC']]
    });

    const performance = categoryStats.map(stat => ({
      category: stat.getDataValue('category') || 'Geral',
      interactions: parseInt(stat.getDataValue('totalInteractions')) || 0,
      percentage: 0 // Será calculado no frontend
    }));

    const totalInteractions = performance.reduce((sum, cat) => sum + cat.interactions, 0);
    
    performance.forEach(cat => {
      cat.percentage = totalInteractions > 0 ? 
        Math.round((cat.interactions / totalInteractions) * 100) : 0;
    });

    res.json({
      success: true,
      data: {
        categories: performance,
        totalInteractions,
        topCategory: performance[0]?.category || 'Nenhuma'
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar performance por categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar performance das categorias',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get recent activity data
 * GET /api/bible-posts/recent-activity
 */
router.get('/recent-activity', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const recentInteractions = await UserBibleInteraction.findAll({
      where: {
        user_id: userId,
        interaction_value: 1
      },
      include: [{
        model: BiblePost,
        as: 'biblePost',
        attributes: ['title', 'verse_reference', 'category']
      }],
      attributes: ['interaction_type', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: limit
    });

    const activities = recentInteractions.map(interaction => ({
      type: interaction.interaction_type,
      post: {
        title: interaction.BiblePost?.title || 'Post removido',
        verse: interaction.BiblePost?.verse_reference || '',
        category: interaction.BiblePost?.category || 'Geral'
      },
      timestamp: interaction.created_at,
      timeAgo: getTimeAgo(interaction.created_at)
    }));

    const summary = {
      total: activities.length,
      byType: {
        amen: activities.filter(a => a.type === 'amen').length,
        ops: activities.filter(a => a.type === 'ops').length,
        like: activities.filter(a => a.type === 'like').length
      },
      lastActivity: activities[0]?.timestamp || null
    };

    res.json({
      success: true,
      data: {
        activities,
        summary
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar atividades recentes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar atividades recentes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Agora';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  
  return new Date(date).toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'short' 
  });
}

module.exports = router;