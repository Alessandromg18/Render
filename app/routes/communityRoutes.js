// app/routes/communityRoutes.js

const express = require('express');
const router = express.Router();

const communityController = require('../controllers/communityController');
const authMiddleware = require('../middlewares/authMiddleware'); // ✅ Ahora es directamente una función
const roleMiddleware = require('../middlewares/roleMiddleware'); // Verifica que este también sea una función que retorna middleware
const upload = require('../middlewares/upload'); // Middleware de Multer

// Crear post - cualquier usuario autenticado, con imagen
router.post('/', authMiddleware, upload.single('imagen'), communityController.createPost);

// Obtener posts (paginados)
router.get('/', communityController.getPosts);

// Dar like a post
router.post('/:id/like', authMiddleware, communityController.likePost);

// Eliminar post - solo admin
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), communityController.deletePost);

module.exports = router;
