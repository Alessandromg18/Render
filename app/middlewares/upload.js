const multer = require('multer');
const path = require('path');

// Configuración de Multer: en este caso estamos subiendo imágenes al servidor local.
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/posts/');  // Directorio donde se almacenarán las imágenes
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));  // Renombrar el archivo con un timestamp
    }
});

const upload = multer({ storage: storage });

module.exports = upload;
