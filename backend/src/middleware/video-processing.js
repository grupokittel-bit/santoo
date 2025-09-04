// MIDDLEWARE DE PROCESSAMENTO DE VÍDEO COM FFMPEG
// Sistema completo para otimização, redimensionamento e geração de thumbnails

const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

// Configura caminhos do FFmpeg e FFprobe
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// === CONFIGURAÇÕES ===

const VIDEO_CONFIG = {
  // Formato TikTok - 9:16 
  resolution: {
    width: 720,
    height: 1280,
  },
  
  // Qualidade e compressão
  quality: {
    videoBitrate: '1000k',    // 1Mbps - boa qualidade/tamanho
    audioBitrate: '128k',     // Áudio MP3 padrão
    crf: 23,                  // Constant Rate Factor (18-28 é bom)
    preset: 'fast',           // Velocidade encoding: ultrafast,fast,medium,slow
  },
  
  // Limites
  maxDuration: 60,            // Máximo 60 segundos
  maxFileSize: 50 * 1024 * 1024, // 50MB após processamento
  
  // Formatos
  outputFormat: 'mp4',
  codecVideo: 'libx264',
  codecAudio: 'aac',
};

const THUMBNAIL_CONFIG = {
  width: 720,
  height: 1280,
  format: 'jpg',
  quality: 85,
  timemarks: ['10%', '50%', '90%'] // 3 thumbnails em diferentes momentos
};

// === FUNÇÕES UTILITÁRIAS ===

const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);

// Gera nome único para arquivos processados
function generateProcessedFilename(originalPath, suffix = '') {
  const ext = path.extname(originalPath);
  const name = path.basename(originalPath, ext);
  const dir = path.dirname(originalPath);
  return path.join(dir, `${name}-processed${suffix}${ext}`);
}

// Remove arquivo se existir
async function removeFileIfExists(filePath) {
  try {
    await stat(filePath);
    await unlink(filePath);
    console.log(`✅ Arquivo removido: ${filePath}`);
  } catch (error) {
    // Arquivo não existe, ok
  }
}

// Obter metadados do vídeo
function getVideoMetadata(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.error('❌ Erro ao obter metadados:', err);
        return reject(err);
      }
      
      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
      
      resolve({
        duration: metadata.format.duration,
        size: metadata.format.size,
        bitRate: metadata.format.bit_rate,
        video: {
          width: videoStream?.width,
          height: videoStream?.height,
          fps: videoStream?.r_frame_rate,
          codec: videoStream?.codec_name
        },
        audio: {
          codec: audioStream?.codec_name,
          bitRate: audioStream?.bit_rate,
          sampleRate: audioStream?.sample_rate
        }
      });
    });
  });
}

// === PROCESSAMENTO PRINCIPAL ===

// Processa vídeo: redimensiona, otimiza e limita duração
function processVideo(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`🎬 Iniciando processamento: ${path.basename(inputPath)}`);
    
    let command = ffmpeg(inputPath);
    
    // === FILTROS DE VÍDEO ===
    const videoFilters = [];
    
    // 1. Redimensionar e cortar para 720x1280 (9:16)
    videoFilters.push(`scale='min(${VIDEO_CONFIG.resolution.width},iw*${VIDEO_CONFIG.resolution.height}/ih)':'min(${VIDEO_CONFIG.resolution.height},ih*${VIDEO_CONFIG.resolution.width}/iw)'`);
    videoFilters.push(`crop=${VIDEO_CONFIG.resolution.width}:${VIDEO_CONFIG.resolution.height}`);
    
    // 2. Aplicar filtros
    command = command.videoFilters(videoFilters);
    
    // === CONFIGURAÇÕES DE CODEC ===
    command
      // Vídeo
      .videoCodec(VIDEO_CONFIG.codecVideo)
      .videoBitrate(VIDEO_CONFIG.quality.videoBitrate)
      .addOption('-crf', VIDEO_CONFIG.quality.crf)
      .addOption('-preset', VIDEO_CONFIG.quality.preset)
      
      // Áudio
      .audioCodec(VIDEO_CONFIG.codecAudio)
      .audioBitrate(VIDEO_CONFIG.quality.audioBitrate)
      
      // Formato
      .format(VIDEO_CONFIG.outputFormat)
      
      // Limitar duração
      .duration(VIDEO_CONFIG.maxDuration)
      
      // Otimizações
      .addOption('-movflags', '+faststart') // Streaming otimizado
      .addOption('-pix_fmt', 'yuv420p')     // Compatibilidade máxima
      
      // Saída
      .output(outputPath);
    
    // === EVENTOS ===
    command
      .on('start', (commandLine) => {
        console.log(`⚡ Comando FFmpeg: ${commandLine}`);
      })
      
      .on('progress', (progress) => {
        console.log(`📊 Progresso: ${Math.round(progress.percent)}%`);
      })
      
      .on('error', (err, stdout, stderr) => {
        console.error('❌ Erro no processamento:', err.message);
        console.error('FFmpeg stderr:', stderr);
        reject(err);
      })
      
      .on('end', async () => {
        try {
          // Verifica se arquivo foi criado
          const stats = await stat(outputPath);
          
          console.log(`✅ Processamento concluído!`);
          console.log(`📁 Arquivo: ${path.basename(outputPath)}`);
          console.log(`📏 Tamanho: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
          
          // Verifica se não excedeu tamanho máximo
          if (stats.size > VIDEO_CONFIG.maxFileSize) {
            throw new Error(`Arquivo muito grande após processamento: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
          }
          
          resolve({
            path: outputPath,
            size: stats.size,
            originalSize: null // Será preenchido depois
          });
          
        } catch (error) {
          reject(error);
        }
      });
    
    // Inicia processamento
    command.run();
  });
}

// Gera thumbnails do vídeo
function generateThumbnails(videoPath, outputDir) {
  return new Promise(async (resolve, reject) => {
    try {
      // Cria diretório se não existir
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const baseName = path.basename(videoPath, path.extname(videoPath));
      const thumbnails = [];
      
      console.log(`🖼️  Gerando thumbnails para: ${baseName}`);
      
      ffmpeg(videoPath)
        .screenshots({
          timestamps: THUMBNAIL_CONFIG.timemarks,
          filename: `${baseName}-thumb-%i.${THUMBNAIL_CONFIG.format}`,
          folder: outputDir,
          size: `${THUMBNAIL_CONFIG.width}x${THUMBNAIL_CONFIG.height}`
        })
        .on('error', (err) => {
          console.error('❌ Erro ao gerar thumbnails:', err);
          reject(err);
        })
        .on('end', () => {
          // Lista thumbnails geradas
          THUMBNAIL_CONFIG.timemarks.forEach((_, index) => {
            const thumbPath = path.join(outputDir, `${baseName}-thumb-${index + 1}.${THUMBNAIL_CONFIG.format}`);
            const thumbUrl = `/uploads/thumbnails/${path.basename(thumbPath)}`;
            thumbnails.push({
              path: thumbPath,
              url: thumbUrl,
              index: index + 1
            });
          });
          
          console.log(`✅ ${thumbnails.length} thumbnails geradas`);
          resolve(thumbnails);
        });
        
    } catch (error) {
      reject(error);
    }
  });
}

// === MIDDLEWARE PRINCIPAL ===

// Middleware que processa vídeo após upload
async function processUploadedVideo(req, res, next) {
  // Só processa se há vídeo no upload
  if (!req.files || !req.files.video || !req.files.video[0]) {
    return next();
  }
  
  const videoFile = req.files.video[0];
  const originalPath = videoFile.path;
  const originalSize = videoFile.size;
  
  console.log(`\n🎥 === INICIANDO PROCESSAMENTO DE VÍDEO ===`);
  console.log(`📁 Arquivo original: ${videoFile.filename}`);
  console.log(`📏 Tamanho original: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
  
  try {
    // 1. VERIFICAR METADADOS
    const metadata = await getVideoMetadata(originalPath);
    console.log(`⏱️  Duração: ${metadata.duration}s`);
    console.log(`📺 Resolução: ${metadata.video.width}x${metadata.video.height}`);
    
    // Verifica se precisa processar
    const needsProcessing = 
      metadata.duration > VIDEO_CONFIG.maxDuration ||
      metadata.video.width !== VIDEO_CONFIG.resolution.width ||
      metadata.video.height !== VIDEO_CONFIG.resolution.height ||
      originalSize > VIDEO_CONFIG.maxFileSize;
    
    if (!needsProcessing) {
      console.log(`✅ Vídeo já está otimizado, pulando processamento`);
      
      // Apenas gera thumbnails se não foram fornecidas
      if (!req.files.thumbnail) {
        const thumbDir = path.dirname(originalPath).replace('videos', 'thumbnails');
        const thumbnails = await generateThumbnails(originalPath, thumbDir);
        
        // Usa primeira thumbnail como padrão
        if (thumbnails.length > 0) {
          req.thumbnailGenerated = thumbnails[0];
        }
      }
      
      return next();
    }
    
    // 2. PROCESSAR VÍDEO
    const processedPath = generateProcessedFilename(originalPath);
    const processResult = await processVideo(originalPath, processedPath);
    
    // 3. GERAR THUMBNAILS
    const thumbDir = path.dirname(processedPath).replace('videos', 'thumbnails');
    const thumbnails = await generateThumbnails(processedPath, thumbDir);
    
    // 4. SUBSTITUIR ARQUIVO ORIGINAL
    await removeFileIfExists(originalPath);
    fs.renameSync(processedPath, originalPath);
    
    // 5. ATUALIZAR METADADOS DO REQUEST
    const newStats = await stat(originalPath);
    req.files.video[0].size = newStats.size;
    
    // Adiciona metadados de processamento
    req.videoProcessingResult = {
      wasProcessed: true,
      originalSize: originalSize,
      newSize: newStats.size,
      compression: ((originalSize - newStats.size) / originalSize * 100).toFixed(1),
      duration: Math.min(metadata.duration, VIDEO_CONFIG.maxDuration),
      resolution: `${VIDEO_CONFIG.resolution.width}x${VIDEO_CONFIG.resolution.height}`,
      thumbnailsGenerated: thumbnails.length
    };
    
    // Se não havia thumbnail no upload, usa a primeira gerada
    if (!req.files.thumbnail && thumbnails.length > 0) {
      req.thumbnailGenerated = thumbnails[0];
    }
    
    console.log(`\n✅ === PROCESSAMENTO CONCLUÍDO ===`);
    console.log(`📉 Compressão: ${req.videoProcessingResult.compression}%`);
    console.log(`📏 Novo tamanho: ${(newStats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🖼️  Thumbnails: ${thumbnails.length} geradas`);
    console.log(`⏱️  Duração final: ${req.videoProcessingResult.duration}s\n`);
    
    next();
    
  } catch (error) {
    console.error('\n❌ === ERRO NO PROCESSAMENTO ===');
    console.error('Erro:', error.message);
    
    // Remove arquivos temporários em caso de erro
    try {
      await removeFileIfExists(originalPath);
      const processedPath = generateProcessedFilename(originalPath);
      await removeFileIfExists(processedPath);
    } catch (cleanupError) {
      console.error('Erro na limpeza:', cleanupError);
    }
    
    // Retorna erro específico
    return res.status(500).json({
      error: 'Erro no processamento do vídeo',
      details: error.message,
      code: 'VIDEO_PROCESSING_ERROR'
    });
  }
}

// === FUNÇÕES UTILITÁRIAS EXPORTADAS ===

// Processa vídeo já salvo (para usar em scripts)
async function processExistingVideo(videoPath) {
  try {
    const processedPath = generateProcessedFilename(videoPath);
    const result = await processVideo(videoPath, processedPath);
    
    // Substitui original
    await removeFileIfExists(videoPath);
    fs.renameSync(processedPath, videoPath);
    
    return result;
  } catch (error) {
    // Remove processed se erro
    const processedPath = generateProcessedFilename(videoPath);
    await removeFileIfExists(processedPath);
    throw error;
  }
}

// Valida se FFmpeg está instalado
function validateFFmpegInstallation() {
  return new Promise((resolve, reject) => {
    ffmpeg.getAvailableFormats((err, formats) => {
      if (err) {
        reject(new Error('FFmpeg não está disponível: ' + err.message));
      } else {
        resolve(true);
      }
    });
  });
}

module.exports = {
  // Middleware principal
  processUploadedVideo,
  
  // Configurações
  VIDEO_CONFIG,
  THUMBNAIL_CONFIG,
  
  // Funções utilitárias
  processExistingVideo,
  generateThumbnails,
  getVideoMetadata,
  validateFFmpegInstallation,
  removeFileIfExists
};