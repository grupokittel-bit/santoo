// TESTE DO SISTEMA DE PROCESSAMENTO DE VÍDEO
// Script para validar FFmpeg e funcionalidades

const path = require('path');
const fs = require('fs');
const { 
  validateFFmpegInstallation, 
  getVideoMetadata,
  processExistingVideo,
  VIDEO_CONFIG,
  THUMBNAIL_CONFIG
} = require('./src/middleware/video-processing');

async function testVideoProcessing() {
  console.log('\n🎬 === TESTE COMPLETO DO SISTEMA FFmpeg ===\n');
  
  try {
    // 1. VALIDAR INSTALAÇÃO DO FFMPEG
    console.log('1️⃣ Validando instalação do FFmpeg...');
    await validateFFmpegInstallation();
    console.log('✅ FFmpeg instalado e funcionando!\n');
    
    // 2. MOSTRAR CONFIGURAÇÕES
    console.log('2️⃣ Configurações do sistema:');
    console.log(`📺 Resolução alvo: ${VIDEO_CONFIG.resolution.width}x${VIDEO_CONFIG.resolution.height}`);
    console.log(`⏱️  Duração máxima: ${VIDEO_CONFIG.maxDuration}s`);
    console.log(`🎞️  Bitrate: ${VIDEO_CONFIG.quality.videoBitrate}`);
    console.log(`🔊 Áudio: ${VIDEO_CONFIG.quality.audioBitrate}`);
    console.log(`📁 Tamanho máximo: ${(VIDEO_CONFIG.maxFileSize / 1024 / 1024).toFixed(0)}MB\n`);
    
    // 3. VERIFICAR SE HÁ VÍDEOS PARA TESTAR
    const videosDir = './src/uploads/videos/';
    if (!fs.existsSync(videosDir)) {
      console.log('❌ Pasta de vídeos não encontrada');
      return;
    }
    
    const videoFiles = fs.readdirSync(videosDir).filter(f => 
      f.endsWith('.mp4') || f.endsWith('.mov') || f.endsWith('.avi')
    );
    
    if (videoFiles.length === 0) {
      console.log('⚠️  Nenhum vídeo encontrado para teste');
      console.log('📤 Faça upload de um vídeo pelo frontend para testar\n');
      return;
    }
    
    // 4. TESTAR COM PRIMEIRO VÍDEO ENCONTRADO
    const testVideoPath = path.join(videosDir, videoFiles[0]);
    console.log(`3️⃣ Testando com: ${videoFiles[0]}`);
    
    // Obter metadados
    console.log('📊 Obtendo metadados...');
    const metadata = await getVideoMetadata(testVideoPath);
    
    console.log(`⏱️  Duração: ${metadata.duration}s`);
    console.log(`📺 Resolução: ${metadata.video.width}x${metadata.video.height}`);
    console.log(`📁 Tamanho: ${(metadata.size / 1024 / 1024).toFixed(2)}MB`);
    console.log(`🎞️  FPS: ${metadata.video.fps}`);
    console.log(`🔊 Codec vídeo: ${metadata.video.codec}`);
    console.log(`🎵 Codec áudio: ${metadata.audio?.codec || 'N/A'}\n`);
    
    // 5. VERIFICAR SE PRECISA PROCESSAMENTO
    const needsProcessing = 
      metadata.duration > VIDEO_CONFIG.maxDuration ||
      metadata.video.width !== VIDEO_CONFIG.resolution.width ||
      metadata.video.height !== VIDEO_CONFIG.resolution.height ||
      metadata.size > VIDEO_CONFIG.maxFileSize;
    
    console.log(`4️⃣ Análise de necessidade de processamento:`);
    console.log(`📏 Resolução correta: ${!needsProcessing ? '✅' : '❌'}`);
    console.log(`⏱️  Duração OK: ${metadata.duration <= VIDEO_CONFIG.maxDuration ? '✅' : '❌'}`);
    console.log(`📁 Tamanho OK: ${metadata.size <= VIDEO_CONFIG.maxFileSize ? '✅' : '❌'}`);
    console.log(`🎯 Precisa processar: ${needsProcessing ? '✅ SIM' : '❌ NÃO'}\n`);
    
    if (!needsProcessing) {
      console.log('✅ Vídeo já está otimizado para TikTok format!');
    }
    
    console.log('🎉 Teste concluído com sucesso!');
    console.log('📤 O sistema está pronto para processar uploads!\n');
    
  } catch (error) {
    console.error('\n❌ Erro no teste:', error.message);
    console.error('🔧 Detalhes:', error);
    
    if (error.message.includes('FFmpeg')) {
      console.log('\n💡 SOLUÇÕES POSSÍVEIS:');
      console.log('1. Instalar FFmpeg no sistema: sudo apt install ffmpeg');
      console.log('2. Ou reinstalar: npm install @ffmpeg-installer/ffmpeg');
      console.log('3. Verificar se o caminho está correto\n');
    }
  }
}

// Executar teste
if (require.main === module) {
  testVideoProcessing();
}

module.exports = { testVideoProcessing };