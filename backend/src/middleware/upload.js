// MIDDLEWARE DE UPLOAD PARA MÚLTIPLOS TIPOS DE ARQUIVOS
// Configuração avançada do Multer para vídeos, thumbnails e avatares

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// === CONFIGURAÇÃO DE STORAGE ===

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'src/uploads/';
    
    // Define pasta baseada no tipo de arquivo
    switch (file.fieldname) {
      case 'video':
        uploadPath += 'videos/';
        break;
      case 'thumbnail':
        uploadPath += 'thumbnails/';
        break;
      case 'avatar':
        uploadPath += 'avatars/';
        break;
      case 'coverImage':
        uploadPath += 'covers/';
        break;
      default:
        uploadPath += 'misc/';
    }
    
    // Cria pasta se não existir
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  
  filename: (req, file, cb) => {
    // Nome único com timestamp + random + extensão original
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-') // Remove caracteres especiais
      .substring(0, 30); // Limita tamanho
    
    cb(null, `${baseName}-${uniqueSuffix}${extension}`);
  }
});

// === FILTROS DE VALIDAÇÃO ===

const fileFilters = {
  video: (req, file, cb) => {
    const allowedMimes = [
      'video/mp4',
      'video/mpeg', 
      'video/quicktime',
      'video/webm',
      'video/ogg'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de vídeo são permitidos! (MP4, MPEG, MOV, WebM, OGG)'), false);
    }
  },

  image: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/gif'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas! (JPEG, PNG, WebP, GIF)'), false);
    }
  }
};

// Filtro combinado baseado no campo
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'video') {
    fileFilters.video(req, file, cb);
  } else if (['thumbnail', 'avatar', 'coverImage'].includes(file.fieldname)) {
    fileFilters.image(req, file, cb);
  } else {
    cb(new Error('Campo de arquivo não reconhecido'), false);
  }
};

// === CONFIGURAÇÕES DE LIMITE ===

const limits = {
  fileSize: 100 * 1024 * 1024, // 100MB para vídeos
  files: 5, // Máximo 5 arquivos por upload
  fields: 10 // Máximo 10 campos de formulário
};

// === MIDDLEWARES ESPECÍFICOS ===

// Upload completo (vídeo + thumbnail)
const uploadVideoComplete = multer({
  storage,
  fileFilter,
  limits
}).fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]);

// Upload apenas vídeo
const uploadVideoOnly = multer({
  storage,
  fileFilter: fileFilters.video,
  limits: { ...limits, fileSize: 100 * 1024 * 1024 } // 100MB
}).single('video');

// Upload apenas imagens (avatar, thumbnail, etc.)
const uploadImageOnly = multer({
  storage,
  fileFilter: fileFilters.image,
  limits: { ...limits, fileSize: 5 * 1024 * 1024 } // 5MB para imagens
}).single('image');

// Upload múltiplas imagens
const uploadMultipleImages = multer({
  storage,
  fileFilter: fileFilters.image,
  limits: { ...limits, fileSize: 5 * 1024 * 1024 }
}).fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'avatar', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]);

// === MIDDLEWARE DE ERRO PERSONALIZADO ===

function handleUploadError(error, req, res, next) {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          error: 'Arquivo muito grande. Vídeos: máx 100MB, Imagens: máx 5MB',
          code: 'FILE_TOO_LARGE'
        });
        
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          error: 'Muitos arquivos enviados',
          code: 'TOO_MANY_FILES'
        });
        
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          error: 'Campo de arquivo inesperado',
          code: 'UNEXPECTED_FIELD'
        });
        
      default:
        return res.status(400).json({
          error: 'Erro no upload: ' + error.message,
          code: 'UPLOAD_ERROR'
        });
    }
  }
  
  if (error.message.includes('Apenas')) {
    return res.status(400).json({
      error: error.message,
      code: 'INVALID_FILE_TYPE'
    });
  }
  
  next(error);
}

// === FUNÇÕES UTILITÁRIAS ===

// Remove arquivo se existir
function removeFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Arquivo removido: ${filePath}`);
    }
  } catch (error) {
    console.error('Erro ao remover arquivo:', error);
  }
}

// Limpa arquivos orfãos (mais de 24h sem uso)
function cleanupOrphanedFiles() {
  const uploadDirs = [
    'src/uploads/videos/',
    'src/uploads/thumbnails/',
    'src/uploads/avatars/',
    'src/uploads/covers/'
  ];
  
  uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    const now = Date.now();
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      const ageHours = (now - stats.mtime.getTime()) / (1000 * 60 * 60);
      
      if (ageHours > 24) {
        removeFile(filePath);
      }
    });
  });
}

// === VALIDAÇÃO DE METADATA ===

function validateVideoMetadata(req, res, next) {
  if (req.file && req.file.fieldname === 'video') {
    const file = req.file;
    
    // Validações básicas
    if (file.size > 100 * 1024 * 1024) { // 100MB
      removeFile(file.path);
      return res.status(400).json({
        error: 'Vídeo muito grande (máx 100MB)',
        code: 'VIDEO_TOO_LARGE'
      });
    }
    
    // Adiciona metadados ao request
    req.videoMetadata = {
      originalName: file.originalname,
      fileName: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      path: file.path
    };
  }
  
  next();
}

function validateImageMetadata(req, res, next) {
  const imageFields = ['thumbnail', 'avatar', 'coverImage'];
  
  if (req.files) {
    imageFields.forEach(field => {
      if (req.files[field] && req.files[field][0]) {
        const file = req.files[field][0];
        
        // Validação de tamanho
        if (file.size > 5 * 1024 * 1024) { // 5MB
          removeFile(file.path);
          return res.status(400).json({
            error: `${field} muito grande (máx 5MB)`,
            code: 'IMAGE_TOO_LARGE'
          });
        }
        
        // Adiciona metadados
        req[`${field}Metadata`] = {
          originalName: file.originalname,
          fileName: file.filename,
          size: file.size,
          mimetype: file.mimetype,
          path: file.path
        };
      }
    });
  }
  
  next();
}

module.exports = {
  // Middlewares principais
  uploadVideoComplete,
  uploadVideoOnly,
  uploadImageOnly,
  uploadMultipleImages,
  
  // Middleware de erro
  handleUploadError,
  
  // Middlewares de validação
  validateVideoMetadata,
  validateImageMetadata,
  
  // Funções utilitárias
  removeFile,
  cleanupOrphanedFiles,
  
  // Configurações (para testes)
  storage,
  fileFilters,
  limits
};