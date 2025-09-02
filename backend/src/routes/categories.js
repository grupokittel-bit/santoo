// ROTA DE CATEGORIAS
// Endpoints para listar categorias gospel e estatísticas

const express = require('express');
const { Category, Video } = require('../models');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// === ROTAS PÚBLICAS ===

// GET /categories - Lista todas as categorias disponíveis
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { withStats = false } = req.query;
    
    if (withStats === 'true') {
      // Busca categorias com contagem de vídeos
      const categories = await Category.findAll({
        include: [
          {
            model: Video,
            as: 'videos',
            attributes: [], // Não retorna dados dos vídeos, só conta
            required: false
          }
        ],
        attributes: [
          'id',
          'name', 
          'description',
          'color',
          'icon',
          'isActive',
          'createdAt',
          [require('sequelize').fn('COUNT', require('sequelize').col('videos.id')), 'videosCount']
        ],
        group: ['Category.id'],
        order: [['name', 'ASC']]
      });
      
      return res.json({ categories });
    }
    
    // Busca simples sem estatísticas
    const categories = await Category.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'description', 'color', 'icon'],
      order: [['name', 'ASC']]
    });
    
    res.json({ categories });
    
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /categories/:id - Detalhes de uma categoria específica
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Busca categoria
    const category = await Category.findByPk(id);
    
    if (!category) {
      return res.status(404).json({
        error: 'Categoria não encontrada'
      });
    }
    
    // Busca vídeos da categoria com paginação
    const offset = (page - 1) * limit;
    
    const { rows: videos, count } = await Video.findAndCountAll({
      where: { categoryId: id },
      include: [
        {
          model: require('../models/User'),
          as: 'User',
          attributes: ['id', 'username', 'displayName', 'avatar', 'isVerified']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      category,
      videos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar categoria:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /categories/stats/overview - Estatísticas gerais das categorias
router.get('/stats/overview', optionalAuth, async (req, res) => {
  try {
    // Estatísticas por categoria
    const categoryStats = await Category.findAll({
      include: [
        {
          model: Video,
          as: 'videos',
          attributes: [],
          required: false
        }
      ],
      attributes: [
        'id',
        'name',
        'color',
        'icon',
        [require('sequelize').fn('COUNT', require('sequelize').col('videos.id')), 'videosCount'],
        [require('sequelize').fn('SUM', require('sequelize').col('videos.views')), 'totalViews'],
        [require('sequelize').fn('SUM', require('sequelize').col('videos.likes')), 'totalLikes']
      ],
      group: ['Category.id'],
      order: [[require('sequelize').fn('COUNT', require('sequelize').col('videos.id')), 'DESC']]
    });
    
    // Categoria mais popular (por views)
    const mostPopular = categoryStats.reduce((prev, current) => {
      return (parseInt(current.dataValues.totalViews) || 0) > (parseInt(prev?.dataValues?.totalViews) || 0) 
        ? current : prev;
    }, null);
    
    // Total geral
    const totals = categoryStats.reduce((acc, category) => {
      acc.videos += parseInt(category.dataValues.videosCount) || 0;
      acc.views += parseInt(category.dataValues.totalViews) || 0;
      acc.likes += parseInt(category.dataValues.totalLikes) || 0;
      return acc;
    }, { videos: 0, views: 0, likes: 0 });
    
    res.json({
      categoryStats,
      mostPopular,
      totals,
      totalCategories: categoryStats.length
    });
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /categories/trending - Categorias em alta (mais vídeos recentes)
router.get('/trending', optionalAuth, async (req, res) => {
  try {
    const { days = 7 } = req.query; // Últimos 7 dias por padrão
    
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - parseInt(days));
    
    const trendingCategories = await Category.findAll({
      include: [
        {
          model: Video,
          as: 'videos',
          where: {
            createdAt: {
              [require('sequelize').Op.gte]: dateLimit
            }
          },
          attributes: [],
          required: false
        }
      ],
      attributes: [
        'id',
        'name',
        'description',
        'color',
        'icon',
        [require('sequelize').fn('COUNT', require('sequelize').col('videos.id')), 'recentVideos']
      ],
      group: ['Category.id'],
      having: require('sequelize').literal('COUNT("videos"."id") > 0'),
      order: [[require('sequelize').fn('COUNT', require('sequelize').col('videos.id')), 'DESC']],
      limit: 5
    });
    
    res.json({
      trendingCategories,
      period: `Últimos ${days} dias`,
      message: trendingCategories.length === 0 
        ? 'Nenhuma categoria com vídeos recentes no período'
        : `${trendingCategories.length} categorias em alta`
    });
    
  } catch (error) {
    console.error('Erro ao buscar categorias trending:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;