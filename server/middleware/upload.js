const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 
    'application/pdf', 'text/plain', 'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'application/vnd.openxmlformats-officedocument.presentationml.presentation' // pptx
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no soportado: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 
  },
  fileFilter: fileFilter
});

const processBase64Files = (req, res, next) => {
  if (!req.body.files || !Array.isArray(req.body.files) || req.body.files.length === 0) {
    return next();
  }

  try {
    req.body.files.forEach((file, index) => {
      if (!file.data || !file.name || !file.type) {
        throw new Error(`Archivo ${index} inválido: faltan campos requeridos`);
      }
      
      const sizeInBytes = Buffer.byteLength(file.data, 'base64');
      if (sizeInBytes > 20 * 1024 * 1024) {
        throw new Error(`Archivo ${file.name} excede el tamaño máximo permitido (20MB)`);
      }
      
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 
        'application/pdf', 'text/plain', 'text/csv',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];

      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Tipo de archivo no permitido: ${file.type}`);
      }
    });

    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  upload,
  processBase64Files
};