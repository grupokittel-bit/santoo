// ASSOCIAÇÕES ENTRE MODELOS
// Define como as tabelas se relacionam no banco

const User = require('./User');
const Video = require('./Video');
const Category = require('./Category');
const Comment = require('./Comment');
const Like = require('./Like');
const Follow = require('./Follow');

// === NOVOS MODELOS DA BÍBLIA EXPLICADA ===
const BiblePost = require('./BiblePost');
const UserBibleInteraction = require('./UserBibleInteraction');
const BibleDisagreement = require('./BibleDisagreement');
const UserHabitTracker = require('./UserHabitTracker');
const BiblePostView = require('./BiblePostView');

// === RELACIONAMENTOS USER ===

// Um usuário tem muitos vídeos
User.hasMany(Video, {
  foreignKey: 'userId',
  as: 'videos',
  onDelete: 'CASCADE'
});

// Um usuário tem muitos comentários
User.hasMany(Comment, {
  foreignKey: 'userId',
  as: 'comments',
  onDelete: 'CASCADE'
});

// Um usuário tem muitas curtidas
User.hasMany(Like, {
  foreignKey: 'userId',
  as: 'likes',
  onDelete: 'CASCADE'
});

// === RELACIONAMENTOS FOLLOW ===

// Usuário que está seguindo
User.hasMany(Follow, {
  foreignKey: 'followerId',
  as: 'following',
  onDelete: 'CASCADE'
});

// Usuário sendo seguido
User.hasMany(Follow, {
  foreignKey: 'followingId', 
  as: 'followers',
  onDelete: 'CASCADE'
});

// Relacionamentos do Follow
Follow.belongsTo(User, {
  foreignKey: 'followerId',
  as: 'Follower'
});

Follow.belongsTo(User, {
  foreignKey: 'followingId',
  as: 'Following'
});

// === RELACIONAMENTOS VIDEO ===

// Um vídeo pertence a um usuário
Video.belongsTo(User, {
  foreignKey: 'userId',
  as: 'User'
});

// Um vídeo pertence a uma categoria
Video.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'Category'
});

// Um vídeo tem muitos comentários
Video.hasMany(Comment, {
  foreignKey: 'videoId',
  as: 'comments',
  onDelete: 'CASCADE'
});

// Um vídeo tem muitas curtidas
Video.hasMany(Like, {
  foreignKey: 'videoId',
  as: 'likes',
  onDelete: 'CASCADE'
});

// === RELACIONAMENTOS CATEGORY ===

// Uma categoria tem muitos vídeos
Category.hasMany(Video, {
  foreignKey: 'categoryId',
  as: 'videos',
  onDelete: 'SET NULL' // Se categoria for deletada, vídeos ficam sem categoria
});

// === RELACIONAMENTOS COMMENT ===

// Um comentário pertence a um usuário
Comment.belongsTo(User, {
  foreignKey: 'userId',
  as: 'User'
});

// Um comentário pertence a um vídeo
Comment.belongsTo(Video, {
  foreignKey: 'videoId',
  as: 'Video'
});

// Comentários aninhados (respostas)
Comment.belongsTo(Comment, {
  foreignKey: 'parentId',
  as: 'Parent'
});

Comment.hasMany(Comment, {
  foreignKey: 'parentId',
  as: 'Replies',
  onDelete: 'CASCADE'
});

// === RELACIONAMENTOS LIKE ===

// Uma curtida pertence a um usuário
Like.belongsTo(User, {
  foreignKey: 'userId',
  as: 'User'
});

// Uma curtida pertence a um vídeo
Like.belongsTo(Video, {
  foreignKey: 'videoId',
  as: 'Video'
});

// === RELACIONAMENTOS MANY-TO-MANY ===

// Usuários que curtiram vídeos (através da tabela Like)
User.belongsToMany(Video, {
  through: Like,
  foreignKey: 'userId',
  otherKey: 'videoId',
  as: 'LikedVideos'
});

Video.belongsToMany(User, {
  through: Like,
  foreignKey: 'videoId',
  otherKey: 'userId',
  as: 'LikedByUsers'
});

// Usuários seguindo outros usuários (através da tabela Follow)
User.belongsToMany(User, {
  through: Follow,
  foreignKey: 'followerId',
  otherKey: 'followingId',
  as: 'FollowingUsers'
});

User.belongsToMany(User, {
  through: Follow,
  foreignKey: 'followingId',
  otherKey: 'followerId',
  as: 'FollowerUsers'
});

// === RELACIONAMENTOS BÍBLIA EXPLICADA ===

// == USER E BIBLE_POST ==

// Um usuário (admin/pastor) pode criar muitos posts da Bíblia
User.hasMany(BiblePost, {
  foreignKey: 'author_admin_id',
  as: 'createdBiblePosts',
  onDelete: 'CASCADE'
});

// Um post da Bíblia pertence a um usuário (admin/pastor)
BiblePost.belongsTo(User, {
  foreignKey: 'author_admin_id',
  as: 'author'
});

// == USER E USER_BIBLE_INTERACTION ==

// Um usuário tem muitas interações com posts da Bíblia
User.hasMany(UserBibleInteraction, {
  foreignKey: 'user_id',
  as: 'bibleInteractions',
  onDelete: 'CASCADE'
});

// Uma interação pertence a um usuário
UserBibleInteraction.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// == BIBLE_POST E USER_BIBLE_INTERACTION ==

// Um post da Bíblia tem muitas interações
BiblePost.hasMany(UserBibleInteraction, {
  foreignKey: 'bible_post_id',
  as: 'interactions',
  onDelete: 'CASCADE'
});

// Uma interação pertence a um post da Bíblia
UserBibleInteraction.belongsTo(BiblePost, {
  foreignKey: 'bible_post_id',
  as: 'biblePost'
});

// == USER E BIBLE_DISAGREEMENT ==

// Um usuário pode ter muitas discordâncias
User.hasMany(BibleDisagreement, {
  foreignKey: 'user_id',
  as: 'bibleDisagreements',
  onDelete: 'CASCADE'
});

// Um usuário (admin/pastor) pode revisar muitas discordâncias
User.hasMany(BibleDisagreement, {
  foreignKey: 'reviewed_by',
  as: 'reviewedDisagreements',
  onDelete: 'SET NULL' // Se admin for deletado, discordância fica sem revisor
});

// Uma discordância pertence a um usuário
BibleDisagreement.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Uma discordância pode ter sido revisada por um admin
BibleDisagreement.belongsTo(User, {
  foreignKey: 'reviewed_by',
  as: 'reviewer'
});

// == BIBLE_POST E BIBLE_DISAGREEMENT ==

// Um post da Bíblia pode ter muitas discordâncias
BiblePost.hasMany(BibleDisagreement, {
  foreignKey: 'bible_post_id',
  as: 'disagreements',
  onDelete: 'CASCADE'
});

// Uma discordância pertence a um post da Bíblia
BibleDisagreement.belongsTo(BiblePost, {
  foreignKey: 'bible_post_id',
  as: 'biblePost'
});

// == USER E USER_HABIT_TRACKER ==

// Um usuário tem muitos registros de hábitos
User.hasMany(UserHabitTracker, {
  foreignKey: 'user_id',
  as: 'habitRecords',
  onDelete: 'CASCADE'
});

// Um registro de hábito pertence a um usuário
UserHabitTracker.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// == BIBLE_POST E USER_HABIT_TRACKER ==

// Um post da Bíblia pode ter muitos registros de hábitos
BiblePost.hasMany(UserHabitTracker, {
  foreignKey: 'bible_post_id',
  as: 'habitRecords',
  onDelete: 'CASCADE'
});

// Um registro de hábito pertence a um post da Bíblia
UserHabitTracker.belongsTo(BiblePost, {
  foreignKey: 'bible_post_id',
  as: 'biblePost'
});

// == USER E BIBLE_POST_VIEW ==

// Um usuário tem muitas visualizações de posts da Bíblia
User.hasMany(BiblePostView, {
  foreignKey: 'user_id',
  as: 'biblePostViews',
  onDelete: 'CASCADE'
});

// Uma visualização pode pertencer a um usuário (null para anônimos)
BiblePostView.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// == BIBLE_POST E BIBLE_POST_VIEW ==

// Um post da Bíblia tem muitas visualizações
BiblePost.hasMany(BiblePostView, {
  foreignKey: 'bible_post_id',
  as: 'views',
  onDelete: 'CASCADE'
});

// Uma visualização pertence a um post da Bíblia
BiblePostView.belongsTo(BiblePost, {
  foreignKey: 'bible_post_id',
  as: 'biblePost'
});

// === RELACIONAMENTOS MANY-TO-MANY DA BÍBLIA EXPLICADA ===

// Usuários que interagiram com posts da Bíblia (através de UserBibleInteraction)
User.belongsToMany(BiblePost, {
  through: UserBibleInteraction,
  foreignKey: 'user_id',
  otherKey: 'bible_post_id',
  as: 'interactedBiblePosts'
});

BiblePost.belongsToMany(User, {
  through: UserBibleInteraction,
  foreignKey: 'bible_post_id',
  otherKey: 'user_id',
  as: 'interactedUsers'
});

// Usuários que visualizaram posts da Bíblia (através de BiblePostView)
User.belongsToMany(BiblePost, {
  through: BiblePostView,
  foreignKey: 'user_id',
  otherKey: 'bible_post_id',
  as: 'viewedBiblePosts'
});

BiblePost.belongsToMany(User, {
  through: BiblePostView,
  foreignKey: 'bible_post_id',
  otherKey: 'user_id',
  as: 'viewedByUsers'
});

// == COMENTÁRIOS NOS POSTS DA BÍBLIA ==

// Um post da Bíblia pode ter muitos comentários
BiblePost.hasMany(Comment, {
  foreignKey: 'bible_post_id',
  as: 'comments',
  onDelete: 'CASCADE'
});

// Um comentário pode pertencer a um post da Bíblia
Comment.belongsTo(BiblePost, {
  foreignKey: 'bible_post_id',
  as: 'biblePost'
});

console.log('✅ Associações entre modelos configuradas (incluindo Bíblia Explicada)!');

module.exports = {
  User,
  Video,
  Category,
  Comment,
  Like,
  Follow,
  // Novos modelos da Bíblia Explicada
  BiblePost,
  UserBibleInteraction,
  BibleDisagreement,
  UserHabitTracker,
  BiblePostView
};