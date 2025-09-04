// SCRIPT DE DADOS DE EXEMPLO (SEEDS)
// Popula o banco com dados de teste para desenvolvimento

const { User, Category, Video, Comment, Like, Follow } = require('../models');

// Importa seeds da Bíblia Explicada
const { seedBiblePosts } = require('./seedBiblePosts');

// === DADOS DE EXEMPLO ===

const sampleUsers = [
  {
    username: 'pastorjoao',
    email: 'joao@igrejanova.com.br',
    password: '123456789',
    displayName: 'Pastor João Silva',
    bio: 'Pastor há 15 anos, servo de Deus e pregador da palavra.',
    location: 'São Paulo, SP',
    website: 'https://igrejanova.com.br',
    isVerified: true,
    role: 'pastor'
  },
  {
    username: 'mariacantora',
    email: 'maria@gospel.com',
    password: '123456789', 
    displayName: 'Maria Santos',
    bio: 'Cantora gospel, ministrando através da música há 10 anos.',
    location: 'Rio de Janeiro, RJ',
    isVerified: true,
    role: 'user'
  },
  {
    username: 'jovemcristao',
    email: 'pedro@email.com',
    password: '123456789',
    displayName: 'Pedro Jovem',
    bio: 'Líder de jovens, apaixonado por Jesus e pela juventude.',
    location: 'Belo Horizonte, MG',
    isVerified: false,
    role: 'user'
  },
  {
    username: 'anaestudos',
    email: 'ana@estudos.com',
    password: '123456789',
    displayName: 'Ana Estudiosa',
    bio: 'Professora da EBD, amo ensinar a palavra de Deus.',
    location: 'Salvador, BA',
    isVerified: true,
    role: 'user'
  },
  {
    username: 'carlosadm',
    email: 'carlos@santoo.app',
    password: '123456789',
    displayName: 'Carlos Admin',
    bio: 'Administrador da plataforma Santoo.',
    location: 'Brasília, DF',
    isVerified: true,
    role: 'admin'
  }
];

const sampleVideos = [
  {
    title: 'A Importância da Oração na Vida do Cristão',
    description: 'Uma mensagem poderosa sobre como a oração transforma nossas vidas e nos aproxima de Deus. Baseada em 1 Tessalonicenses 5:17 - "Orai sem cessar".',
    tags: 'oração, vida cristã, crescimento espiritual, pregação',
    categoryId: 1, // Pregação
    userIndex: 0, // pastorjoao
    duration: 2400, // 40 minutos
    viewsCount: 1543,
    likesCount: 234,
    commentsCount: 45
  },
  {
    title: 'Louvores que Transformam o Coração',
    description: 'Uma seleção dos melhores louvores para momentos de adoração e intimidade com Deus. Música que toca a alma.',
    tags: 'louvor, adoração, música gospel, ministração',
    categoryId: 2, // Música
    userIndex: 1, // mariacantora
    duration: 1800, // 30 minutos
    viewsCount: 3421,
    likesCount: 567,
    commentsCount: 89
  },
  {
    title: 'Como Deus Mudou Minha Vida Completamente',
    description: 'Compartilho aqui como Jesus transformou minha história de drogas e depressão em vitória e propósito. Gloria a Deus!',
    tags: 'testemunho, transformação, liberdade, Jesus',
    categoryId: 3, // Testemunho
    userIndex: 2, // jovemcristao
    duration: 900, // 15 minutos
    viewsCount: 2156,
    likesCount: 412,
    commentsCount: 78
  },
  {
    title: 'Estudo sobre o Fruto do Espírito - Parte 1',
    description: 'Primeira parte do nosso estudo sobre Gálatas 5:22-23. Hoje falamos sobre amor, alegria e paz.',
    tags: 'estudo bíblico, fruto do espírito, gálatas, crescimento',
    categoryId: 4, // Estudo Bíblico
    userIndex: 3, // anaestudos
    duration: 3600, // 1 hora
    viewsCount: 987,
    likesCount: 156,
    commentsCount: 34
  },
  {
    title: 'Acampamento de Jovens 2025 - Highlights',
    description: 'Os melhores momentos do nosso acampamento de jovens! Foram dias incríveis de comunhão e crescimento espiritual.',
    tags: 'jovens, acampamento, comunhão, diversão cristã',
    categoryId: 5, // Jovens
    userIndex: 2, // jovemcristao
    duration: 1200, // 20 minutos
    viewsCount: 1876,
    likesCount: 298,
    commentsCount: 67
  },
  {
    title: 'Histórias Bíblicas para Crianças - Noé',
    description: 'A história de Noé e a arca contada de forma divertida e educativa para os pequenos.',
    tags: 'infantil, histórias bíblicas, noé, educação cristã',
    categoryId: 6, // Infantil
    userIndex: 3, // anaestudos
    duration: 600, // 10 minutos
    viewsCount: 2543,
    likesCount: 445,
    commentsCount: 23
  },
  {
    title: 'Culto ao Vivo - Igreja Nova Dimensão',
    description: 'Transmissão ao vivo do culto dominical da Igreja Nova Dimensão. Uma noite de avivamento!',
    tags: 'live, culto ao vivo, igreja, avivamento',
    categoryId: 7, // Live
    userIndex: 0, // pastorjoao
    duration: 5400, // 1h30min
    viewsCount: 4321,
    likesCount: 623,
    commentsCount: 156
  },
  {
    title: 'Reflexão Matinal - Salmo 23',
    description: 'Uma reflexão suave sobre o Salmo 23 para começar o dia com Deus. "O Senhor é meu pastor..."',
    tags: 'devocional, salmo 23, manhã, reflexão',
    categoryId: 8, // Devocional
    userIndex: 3, // anaestudos
    duration: 300, // 5 minutos
    viewsCount: 1234,
    likesCount: 189,
    commentsCount: 12
  }
];

const sampleComments = [
  {
    videoIndex: 0,
    userIndex: 1,
    content: 'Que mensagem abençoada, Pastor João! Deus continue usando sua vida poderosamente!'
  },
  {
    videoIndex: 0,
    userIndex: 2,
    content: 'Amém! Essa palavra tocou meu coração. Vou aplicar na minha vida.'
  },
  {
    videoIndex: 1,
    userIndex: 0,
    content: 'Maria, sua voz é um instrumento de Deus! Que louvor ungido!'
  },
  {
    videoIndex: 1,
    userIndex: 3,
    content: 'Chorei de emoção ouvindo. Deus falou comigo através dessa música.'
  },
  {
    videoIndex: 2,
    userIndex: 0,
    content: 'Que testemunho poderoso, Pedro! Deus é fiel e transforma vidas!'
  },
  {
    videoIndex: 2,
    userIndex: 1,
    content: 'Gloria a Deus pela sua vida! Você é uma inspiração para todos nós.'
  },
  {
    videoIndex: 3,
    userIndex: 2,
    content: 'Professora Ana, seus estudos são sempre muito edificantes! Parabéns!'
  },
  {
    videoIndex: 4,
    userIndex: 0,
    content: 'Que bênção ver os jovens buscando a Deus! Continuem assim!'
  }
];

// === FUNÇÕES DE CRIAÇÃO ===

async function createUsers() {
  console.log('👥 Criando usuários de exemplo...');
  
  const users = [];
  
  for (let i = 0; i < sampleUsers.length; i++) {
    const userData = sampleUsers[i];
    
    try {
      // Verifica se usuário já existe
      const existingUser = await User.findOne({
        where: { username: userData.username }
      });
      
      if (existingUser) {
        console.log(`   ⚠️  Usuário ${userData.username} já existe`);
        users.push(existingUser);
        continue;
      }
      
      const user = await User.create(userData);
      users.push(user);
      console.log(`   ✅ Criado: ${userData.username} (${userData.displayName})`);
      
    } catch (error) {
      console.error(`   ❌ Erro ao criar ${userData.username}:`, error.message);
    }
  }
  
  console.log(`\n📊 Total de usuários: ${users.length}\n`);
  return users;
}

async function createVideos(users) {
  console.log('🎥 Criando vídeos de exemplo...');
  
  const videos = [];
  
  for (let i = 0; i < sampleVideos.length; i++) {
    const videoData = sampleVideos[i];
    const user = users[videoData.userIndex];
    
    if (!user) {
      console.log(`   ⚠️  Usuário não encontrado para vídeo: ${videoData.title}`);
      continue;
    }
    
    try {
      const video = await Video.create({
        ...videoData,
        userId: user.id,
        videoUrl: `/uploads/videos/sample-video-${i + 1}.mp4`,
        thumbnailUrl: `/uploads/thumbnails/sample-thumb-${i + 1}.jpg`,
        fileName: `sample-video-${i + 1}.mp4`,
        filePath: `src/uploads/videos/sample-video-${i + 1}.mp4`,
        fileSize: Math.floor(Math.random() * 50000000) + 10000000, // Entre 10-60MB
        slug: videoData.title.toLowerCase()
          .replace(/[^\w\s]/gi, '')
          .replace(/\s+/g, '-')
          .substring(0, 50)
      });
      
      videos.push(video);
      
      // Atualiza contador do usuário
      await user.increment('videosCount');
      
      console.log(`   ✅ Criado: ${videoData.title.substring(0, 40)}...`);
      
    } catch (error) {
      console.error(`   ❌ Erro ao criar vídeo ${videoData.title}:`, error.message);
    }
  }
  
  console.log(`\n📊 Total de vídeos: ${videos.length}\n`);
  return videos;
}

async function createComments(users, videos) {
  console.log('💬 Criando comentários de exemplo...');
  
  let commentsCreated = 0;
  
  for (let i = 0; i < sampleComments.length; i++) {
    const commentData = sampleComments[i];
    const user = users[commentData.userIndex];
    const video = videos[commentData.videoIndex];
    
    if (!user || !video) {
      console.log(`   ⚠️  Usuário ou vídeo não encontrado para comentário ${i + 1}`);
      continue;
    }
    
    try {
      await Comment.create({
        content: commentData.content,
        userId: user.id,
        videoId: video.id
      });
      
      // Atualiza contador no vídeo
      await video.increment('commentsCount');
      
      commentsCreated++;
      console.log(`   ✅ Comentário ${i + 1} criado`);
      
    } catch (error) {
      console.error(`   ❌ Erro ao criar comentário ${i + 1}:`, error.message);
    }
  }
  
  console.log(`\n📊 Total de comentários: ${commentsCreated}\n`);
}

async function createFollowsAndLikes(users, videos) {
  console.log('❤️ Criando curtidas e seguidores...');
  
  let likesCreated = 0;
  let followsCreated = 0;
  
  // Cria algumas curtidas aleatórias
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    
    // Cada usuário curte alguns vídeos aleatórios
    const videosToLike = videos.slice().sort(() => 0.5 - Math.random()).slice(0, 3);
    
    for (const video of videosToLike) {
      try {
        // Não curte próprio vídeo
        if (video.userId === user.id) continue;
        
        await Like.create({
          userId: user.id,
          videoId: video.id
        });
        
        await video.increment('likesCount');
        likesCreated++;
        
      } catch (error) {
        // Pode dar erro se já existir (constraint unique)
      }
    }
  }
  
  // Cria alguns follows
  for (let i = 0; i < users.length; i++) {
    const follower = users[i];
    
    // Cada usuário segue alguns outros aleatórios
    const usersToFollow = users
      .filter(u => u.id !== follower.id) // Não segue a si mesmo
      .slice().sort(() => 0.5 - Math.random()).slice(0, 2);
    
    for (const following of usersToFollow) {
      try {
        await Follow.create({
          followerId: follower.id,
          followingId: following.id
        });
        
        await follower.increment('followingCount');
        await following.increment('followersCount');
        followsCreated++;
        
      } catch (error) {
        // Pode dar erro se já existir
      }
    }
  }
  
  console.log(`   ✅ ${likesCreated} curtidas criadas`);
  console.log(`   ✅ ${followsCreated} seguidores criados\n`);
}

// === FUNÇÃO PRINCIPAL ===

async function seedDatabase() {
  console.log('\n🌱 INICIANDO SEED DO BANCO SANTOO...\n');
  
  try {
    // 1. Cria usuários
    const users = await createUsers();
    
    // 2. Cria vídeos
    const videos = await createVideos(users);
    
    // 3. Cria comentários
    await createComments(users, videos);
    
    // 4. Cria curtidas e seguidores
    await createFollowsAndLikes(users, videos);
    
    // 5. Cria posts da Bíblia Explicada
    console.log('📖 Executando seed da Bíblia Explicada...\n');
    await seedBiblePosts();
    
    console.log('🎊 SEED COMPLETO CONCLUÍDO COM SUCESSO!\n');
    console.log('📋 RESUMO COMPLETO:');
    console.log(`   👥 ${users.length} usuários`);
    console.log(`   🎥 ${videos.length} vídeos`);
    console.log(`   📖 15 posts da Bíblia Explicada`);
    console.log(`   📂 8 categorias (já existentes)`);
    console.log(`   💬 ${sampleComments.length} comentários`);
    console.log(`   ❤️ Curtidas e seguidores distribuídos`);
    
    console.log('\n🔑 USUÁRIOS DE TESTE:');
    console.log('   pastorjoao / 123456789 (Pastor)');
    console.log('   mariacantora / 123456789 (Cantora)');
    console.log('   jovemcristao / 123456789 (Jovem)');
    console.log('   anaestudos / 123456789 (Professora)');
    console.log('   carlosadm / 123456789 (Admin)');
    
    console.log('\n🚀 PRÓXIMOS PASSOS:');
    console.log('   1. Execute: npm run dev');
    console.log('   2. Teste: http://localhost:3001/api/videos');
    console.log('   3. Faça login com qualquer usuário acima');
    console.log('   4. Explore a API com dados reais!\n');
    
  } catch (error) {
    console.error('💥 ERRO CRÍTICO no seed:', error);
    process.exit(1);
  }
}

// === FUNÇÃO DE LIMPEZA (OPCIONAL) ===

async function clearDatabase() {
  console.log('🗑️ LIMPANDO BANCO DE DADOS...\n');
  
  try {
    await Comment.destroy({ where: {} });
    console.log('   ✅ Comentários removidos');
    
    await Like.destroy({ where: {} });
    console.log('   ✅ Curtidas removidas');
    
    await Follow.destroy({ where: {} });
    console.log('   ✅ Seguidores removidos');
    
    await Video.destroy({ where: {} });
    console.log('   ✅ Vídeos removidos');
    
    await User.destroy({ where: {} });
    console.log('   ✅ Usuários removidos');
    
    console.log('\n🧹 BANCO LIMPO COM SUCESSO!\n');
    
  } catch (error) {
    console.error('💥 ERRO ao limpar banco:', error);
  }
}

// === EXECUÇÃO ===

const args = process.argv.slice(2);

if (args.includes('--clear') || args.includes('-c')) {
  clearDatabase().then(() => process.exit(0));
} else {
  seedDatabase().then(() => process.exit(0));
}

module.exports = {
  seedDatabase,
  clearDatabase,
  sampleUsers,
  sampleVideos,
  sampleComments
};