// ASSOCIAÇÕES ENTRE MODELOS
// Define como as tabelas se relacionam no banco

const User = require('./User');
const Video = require('./Video');
const Category = require('./Category');
const Comment = require('./Comment');
const Like = require('./Like');
const Follow = require('./Follow');

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

console.log('✅ Associações entre modelos configuradas!');

module.exports = {
  User,
  Video,
  Category,
  Comment,
  Like,
  Follow
};