/**
 * SCRIPT DE CORREÇÃO: Atualiza URLs de thumbnails de .jpg para .svg
 * 
 * PROBLEMA: O banco tem URLs apontando para .jpg mas arquivos são .svg
 * SOLUÇÃO: Atualizar todas as URLs para .svg
 */

require('dotenv').config();
const { sequelize } = require('./src/config/database');
const Video = require('./src/models/Video');

async function fixThumbnails() {
  try {
    console.log('🔧 Iniciando correção de thumbnails...\n');
    
    // 1. Conectar ao banco
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');
    
    // 2. Buscar vídeos com thumbnails .jpg
    const videos = await Video.findAll({
      where: sequelize.where(
        sequelize.col('thumbnailUrl'),
        'LIKE',
        '%.jpg'
      )
    });
    
    console.log(`📊 Encontrados ${videos.length} vídeos com thumbnails .jpg\n`);
    
    // 3. Mostrar URLs atuais
    console.log('📋 URLs atuais:');
    videos.forEach((video, index) => {
      console.log(`   ${index + 1}. ${video.title}: ${video.thumbnailUrl}`);
    });
    
    if (videos.length === 0) {
      console.log('✅ Nenhuma correção necessária!');
      return;
    }
    
    console.log('\n🔄 Atualizando URLs para .svg...\n');
    
    // 4. Atualizar cada vídeo
    let updated = 0;
    for (const video of videos) {
      try {
        const newThumbnailUrl = video.thumbnailUrl.replace('.jpg', '.svg');
        await video.update({ thumbnailUrl: newThumbnailUrl });
        console.log(`   ✅ ${video.title}: ${newThumbnailUrl}`);
        updated++;
      } catch (error) {
        console.log(`   ❌ Erro ao atualizar ${video.title}: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Correção concluída! ${updated} vídeos atualizados.`);
    
    // 5. Verificar resultado
    const verification = await Video.findAll({
      attributes: ['id', 'title', 'thumbnailUrl'],
      where: sequelize.where(
        sequelize.col('thumbnailUrl'),
        'LIKE',
        '%/uploads/thumbnails/%'
      )
    });
    
    console.log('\n📋 URLs após correção:');
    verification.forEach((video, index) => {
      console.log(`   ${index + 1}. ${video.title}: ${video.thumbnailUrl}`);
    });
    
  } catch (error) {
    console.error('💥 ERRO:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
    console.log('\n🔐 Conexão com banco fechada.');
  }
}

// Executar correção
fixThumbnails();