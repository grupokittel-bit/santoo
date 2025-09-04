// MODELO DE USUÁRIO
// Define como os dados dos usuários ficam salvos no banco

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,           // ID único universal
    defaultValue: DataTypes.UUIDV4, // Gera automaticamente
    primaryKey: true
  },
  
  // === DADOS BÁSICOS ===
  username: {
    type: DataTypes.STRING(50),     // Nome de usuário (máx 50 chars)
    allowNull: false,               // Obrigatório
    unique: true,                   // Único no sistema
    validate: {
      len: [3, 50],                 // Entre 3 e 50 caracteres
      is: {
        args: /^[a-zA-Z0-9_]+$/,    // Letras, números e underscore
        msg: 'Username deve conter apenas letras, números e underscore'
      }
    }
  },
  
  email: {
    type: DataTypes.STRING(100),    // Email (máx 100 chars)
    allowNull: false,               // Obrigatório
    unique: true,                   // Único no sistema
    validate: {
      isEmail: true                 // Formato de email válido
    }
  },
  
  password: {
    type: DataTypes.STRING(255),    // Senha criptografada
    allowNull: false,               // Obrigatório
    validate: {
      len: [6, 255]                 // Mínimo 6 caracteres
    }
  },
  
  // === DADOS DO PERFIL ===
  displayName: {
    type: DataTypes.STRING(100),    // Nome exibido no perfil
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  
  bio: {
    type: DataTypes.TEXT,           // Biografia/descrição
    allowNull: true,                // Opcional
    validate: {
      len: [0, 500]                 // Máximo 500 caracteres
    }
  },
  
  avatar: {
    type: DataTypes.STRING(255),    // URL da foto do perfil
    allowNull: true,                // Opcional
    defaultValue: null
  },
  
  coverImage: {
    type: DataTypes.STRING(255),    // URL da capa do perfil
    allowNull: true,                // Opcional
    defaultValue: null
  },
  
  // === CONFIGURAÇÕES ===
  isVerified: {
    type: DataTypes.BOOLEAN,        // Conta verificada?
    defaultValue: false
  },
  
  isActive: {
    type: DataTypes.BOOLEAN,        // Conta ativa?
    defaultValue: true
  },
  
  role: {
    type: DataTypes.ENUM('user', 'moderator', 'admin', 'pastor'), // Tipo de usuário
    defaultValue: 'user'
  },
  
  // === ESTATÍSTICAS ===
  followersCount: {
    type: DataTypes.INTEGER,        // Número de seguidores
    defaultValue: 0,
    validate: { min: 0 }
  },
  
  followingCount: {
    type: DataTypes.INTEGER,        // Número seguindo
    defaultValue: 0,
    validate: { min: 0 }
  },
  
  videosCount: {
    type: DataTypes.INTEGER,        // Número de vídeos
    defaultValue: 0,
    validate: { min: 0 }
  },
  
  // === BÍBLIA EXPLICADA - ESTATÍSTICAS ESPIRITUAIS ===
  bible_posts_amen_count: {
    type: DataTypes.INTEGER,        // Quantos posts marcou como "Já faço isso"
    defaultValue: 0,
    validate: { min: 0 }
  },
  
  bible_posts_ops_count: {
    type: DataTypes.INTEGER,        // Quantos posts marcou como "Ainda não faço"
    defaultValue: 0,
    validate: { min: 0 }
  },
  
  bible_posts_viewed_count: {
    type: DataTypes.INTEGER,        // Quantos posts da Bíblia visualizou
    defaultValue: 0,
    validate: { min: 0 }
  },
  
  bible_posts_liked_count: {
    type: DataTypes.INTEGER,        // Quantos posts da Bíblia curtiu
    defaultValue: 0,
    validate: { min: 0 }
  },
  
  // === NÍVEL ESPIRITUAL ===
  spiritual_level: {
    type: DataTypes.ENUM('iniciante', 'intermediario', 'avancado'),
    defaultValue: 'iniciante',      // Todos começam como iniciante
    validate: {
      isIn: {
        args: [['iniciante', 'intermediario', 'avancado']],
        msg: 'Nível espiritual deve ser iniciante, intermediario ou avancado'
      }
    }
  },
  
  bible_study_streak: {
    type: DataTypes.INTEGER,        // Dias consecutivos estudando a Bíblia
    defaultValue: 0,
    validate: { min: 0 }
  },
  
  max_bible_study_streak: {
    type: DataTypes.INTEGER,        // Maior streak já alcançado
    defaultValue: 0,
    validate: { min: 0 }
  },
  
  // === ÚLTIMAS INTERAÇÕES ===
  last_bible_interaction: {
    type: DataTypes.DATE,           // Última vez que interagiu com Bíblia Explicada
    allowNull: true
  },
  
  last_habit_update: {
    type: DataTypes.DATE,           // Última vez que atualizou hábitos
    allowNull: true
  },
  
  // === PREFERÊNCIAS DO ALGORITMO ===
  preferred_bible_categories: {
    type: DataTypes.JSON,           // Categorias preferidas do usuário
    allowNull: true,                // Calculado automaticamente
    defaultValue: {},
    // Exemplo: {"sabedoria": 0.8, "amor": 0.6, "fe": 0.9}
  },
  
  // === GAMIFICAÇÃO ===
  total_spiritual_points: {
    type: DataTypes.INTEGER,        // Total de pontos espirituais ganhos
    defaultValue: 0,
    validate: { min: 0 }
  },
  
  current_spiritual_level_points: {
    type: DataTypes.INTEGER,        // Pontos do nível atual
    defaultValue: 0,
    validate: { min: 0 }
  },
  
  spiritual_badges: {
    type: DataTypes.JSON,           // Badges/conquistas espirituais
    allowNull: true,
    defaultValue: [],
    // Exemplo: ["first_amen", "7_days_streak", "bible_scholar"]
  },
  
  // === CONFIGURAÇÕES PESSOAIS ===
  daily_bible_reminder: {
    type: DataTypes.BOOLEAN,        // Quer lembrete diário?
    defaultValue: true
  },
  
  reminder_time: {
    type: DataTypes.TIME,           // Horário do lembrete
    allowNull: true,
    defaultValue: '08:00:00'        // 8h da manhã por padrão
  },
  
  // === DATAS ===
  lastLogin: {
    type: DataTypes.DATE,           // Último login
    allowNull: true
  },
  
  emailVerifiedAt: {
    type: DataTypes.DATE,           // Email verificado em
    allowNull: true
  }
  
}, {
  // === CONFIGURAÇÕES DA TABELA ===
  tableName: 'users',               // Nome da tabela no banco
  timestamps: true,                 // Adiciona createdAt e updatedAt
  paranoid: true,                   // Soft delete (não exclui, marca como deletado)
  
  // === HOOKS (AÇÕES AUTOMÁTICAS) ===
  hooks: {
    // Antes de criar usuário, criptografa senha
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    
    // Antes de atualizar, se mudou senha, criptografa
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// === MÉTODOS DO USUÁRIO ===

// Verifica se senha está correta
User.prototype.checkPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Retorna dados públicos do usuário (sem senha)
User.prototype.toPublicJSON = function() {
  return {
    id: this.id,
    username: this.username,
    displayName: this.displayName,
    bio: this.bio,
    avatar: this.avatar,
    coverImage: this.coverImage,
    isVerified: this.isVerified,
    followersCount: this.followersCount,
    followingCount: this.followingCount,
    videosCount: this.videosCount,
    role: this.role, // CRITICAL FIX: Incluir role para sistema de permissões
    createdAt: this.createdAt
  };
};

// === MÉTODOS ESPECÍFICOS DA BÍBLIA EXPLICADA ===

// Retorna dados espirituais do usuário
User.prototype.toSpiritualJSON = function() {
  return {
    id: this.id,
    username: this.username,
    displayName: this.displayName,
    spiritual_level: this.spiritual_level,
    bible_study_streak: this.bible_study_streak,
    max_bible_study_streak: this.max_bible_study_streak,
    total_spiritual_points: this.total_spiritual_points,
    current_spiritual_level_points: this.current_spiritual_level_points,
    spiritual_badges: this.spiritual_badges,
    bible_stats: {
      amen_count: this.bible_posts_amen_count,
      ops_count: this.bible_posts_ops_count,
      viewed_count: this.bible_posts_viewed_count,
      liked_count: this.bible_posts_liked_count
    },
    preferred_bible_categories: this.preferred_bible_categories,
    daily_bible_reminder: this.daily_bible_reminder,
    reminder_time: this.reminder_time,
    last_bible_interaction: this.last_bible_interaction,
    last_habit_update: this.last_habit_update
  };
};

// Incrementa contadores de interação com Bíblia
User.prototype.incrementBibleInteraction = async function(type) {
  const fieldMap = {
    'amen': 'bible_posts_amen_count',
    'ops': 'bible_posts_ops_count',
    'view': 'bible_posts_viewed_count',
    'like': 'bible_posts_liked_count'
  };
  
  if (fieldMap[type]) {
    await this.increment(fieldMap[type], { by: 1 });
    this.last_bible_interaction = new Date();
    await this.save();
  }
};

// Decrementa contadores de interação com Bíblia
User.prototype.decrementBibleInteraction = async function(type) {
  const fieldMap = {
    'amen': 'bible_posts_amen_count',
    'ops': 'bible_posts_ops_count',
    'like': 'bible_posts_liked_count'
  };
  
  if (fieldMap[type] && this[fieldMap[type]] > 0) {
    await this.decrement(fieldMap[type], { by: 1 });
    await this.save();
  }
};

// Move de "Ops" para "Amém" (evolução espiritual)
User.prototype.moveOpsToAmen = async function() {
  if (this.bible_posts_ops_count > 0) {
    await this.decrement('bible_posts_ops_count', { by: 1 });
    await this.increment('bible_posts_amen_count', { by: 1 });
    
    // Bônus de pontos por evolução
    await this.addSpiritualPoints(25, 'ops_to_amen_evolution');
    
    this.last_habit_update = new Date();
    await this.save();
  }
};

// Adiciona pontos espirituais
User.prototype.addSpiritualPoints = async function(points, reason = 'general') {
  this.total_spiritual_points += points;
  this.current_spiritual_level_points += points;
  
  // Verifica se subiu de nível
  await this.checkSpiritualLevelUp();
  
  await this.save();
  
  return {
    points_added: points,
    total_points: this.total_spiritual_points,
    reason: reason,
    level_up: false // será atualizado pelo checkSpiritualLevelUp se necessário
  };
};

// Verifica se deve subir de nível espiritual
User.prototype.checkSpiritualLevelUp = async function() {
  const levelRequirements = {
    'iniciante': 0,
    'intermediario': 500,     // Precisa de 500 pontos para intermediário
    'avancado': 1500          // Precisa de 1500 pontos para avançado
  };
  
  let newLevel = this.spiritual_level;
  
  if (this.total_spiritual_points >= levelRequirements.avancado && this.spiritual_level !== 'avancado') {
    newLevel = 'avancado';
  } else if (this.total_spiritual_points >= levelRequirements.intermediario && this.spiritual_level === 'iniciante') {
    newLevel = 'intermediario';
  }
  
  if (newLevel !== this.spiritual_level) {
    const oldLevel = this.spiritual_level;
    this.spiritual_level = newLevel;
    this.current_spiritual_level_points = this.total_spiritual_points - levelRequirements[newLevel];
    
    // Adiciona badge de nível
    await this.addSpiritualBadge(`level_${newLevel}`);
    
    return {
      level_up: true,
      old_level: oldLevel,
      new_level: newLevel
    };
  }
  
  return { level_up: false };
};

// Adiciona badge espiritual
User.prototype.addSpiritualBadge = async function(badgeName) {
  if (!this.spiritual_badges) {
    this.spiritual_badges = [];
  }
  
  // Evita badges duplicados
  if (!this.spiritual_badges.includes(badgeName)) {
    this.spiritual_badges.push(badgeName);
    await this.save();
    
    return { badge_added: true, badge: badgeName };
  }
  
  return { badge_added: false };
};

// Atualiza streak de estudo bíblico
User.prototype.updateBibleStudyStreak = async function(success = true) {
  if (success) {
    this.bible_study_streak += 1;
    
    // Atualiza máximo se necessário
    if (this.bible_study_streak > this.max_bible_study_streak) {
      this.max_bible_study_streak = this.bible_study_streak;
      
      // Badges de streak
      const streakBadges = [
        { days: 7, badge: 'streak_7_days' },
        { days: 14, badge: 'streak_14_days' },
        { days: 30, badge: 'streak_30_days' },
        { days: 100, badge: 'streak_100_days' }
      ];
      
      for (const milestone of streakBadges) {
        if (this.bible_study_streak === milestone.days) {
          await this.addSpiritualBadge(milestone.badge);
          await this.addSpiritualPoints(50, `streak_${milestone.days}_days`);
        }
      }
    }
  } else {
    // Quebrou o streak
    this.bible_study_streak = 0;
  }
  
  this.last_habit_update = new Date();
  await this.save();
  
  return {
    current_streak: this.bible_study_streak,
    max_streak: this.max_bible_study_streak
  };
};

// Atualiza preferências de categoria baseado nas interações
User.prototype.updateCategoryPreferences = async function(category, interactionType, weight = 0.1) {
  if (!this.preferred_bible_categories) {
    this.preferred_bible_categories = {};
  }
  
  // Pesos diferentes para tipos de interação
  const typeWeights = {
    'view': 0.05,
    'like': 0.1,
    'amen': 0.3,      // "Já faço" vale mais
    'ops': 0.2,       // "Quero fazer" vale bem também
    'disagree': -0.1  // Discordar diminui preferência
  };
  
  const adjustedWeight = typeWeights[interactionType] || weight;
  
  if (!this.preferred_bible_categories[category]) {
    this.preferred_bible_categories[category] = 0;
  }
  
  // Atualiza preferência (max 1.0, min 0.0)
  this.preferred_bible_categories[category] += adjustedWeight;
  this.preferred_bible_categories[category] = Math.max(0, Math.min(1, this.preferred_bible_categories[category]));
  
  await this.save();
};

// Verifica se usuário pode criar posts (admin ou pastor)
User.prototype.canCreateBiblePosts = function() {
  return this.role === 'admin' || this.role === 'pastor';
};

// Verifica se usuário pode moderar discordâncias
User.prototype.canModerateBibleDisagreements = function() {
  return this.role === 'admin' || this.role === 'pastor';
};

// Calcula nível de engajamento espiritual (0-1)
User.prototype.getSpiritualEngagementLevel = function() {
  const totalInteractions = this.bible_posts_amen_count + 
                           this.bible_posts_ops_count + 
                           this.bible_posts_liked_count;
  
  const streakBonus = Math.min(this.bible_study_streak / 30, 0.3); // Máximo 30% de bônus
  const levelBonus = this.spiritual_level === 'avancado' ? 0.2 : 
                    this.spiritual_level === 'intermediario' ? 0.1 : 0;
  
  // Fórmula de engajamento
  let engagement = (totalInteractions / 100) + streakBonus + levelBonus;
  
  // Normalizar entre 0 e 1
  return Math.min(engagement, 1.0);
};

module.exports = User;