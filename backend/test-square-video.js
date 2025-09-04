// TESTE ESPECÍFICO PARA VÍDEOS QUADRADOS (1080x1080)
// Simula o processamento que estava dando erro

const { processExistingVideo } = require('./src/middleware/video-processing');
const path = require('path');
const fs = require('fs');

async function testSquareVideo() {
  console.log('\n🔳 === TESTE PARA VÍDEOS QUADRADOS ===\n');
  
  try {
    // Procura vídeos quadrados
    const videosDir = './src/uploads/videos/';
    const videoFiles = fs.readdirSync(videosDir).filter(f => 
      f.endsWith('.mp4') || f.endsWith('.mov')
    );
    
    if (videoFiles.length === 0) {
      console.log('❌ Nenhum vídeo encontrado para teste');
      return;
    }
    
    const testVideo = path.join(videosDir, videoFiles[0]);
    console.log(`🎬 Testando: ${videoFiles[0]}`);
    
    // Fazer cópia para testar processamento
    const testCopy = testVideo.replace('.mp4', '-test-copy.mp4');
    fs.copyFileSync(testVideo, testCopy);
    
    console.log('📋 Processando cópia de teste...');
    
    const result = await processExistingVideo(testCopy);
    
    console.log('✅ Processamento concluído!');
    console.log(`📁 Arquivo final: ${result.path}`);
    console.log(`📏 Tamanho: ${(result.size / 1024 / 1024).toFixed(2)}MB`);
    
    // Limpar arquivo de teste
    if (fs.existsSync(testCopy)) {
      fs.unlinkSync(testCopy);
      console.log('🧹 Arquivo de teste removido');
    }
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error('📋 Detalhes:', error);
  }
}

if (require.main === module) {
  testSquareVideo();
}