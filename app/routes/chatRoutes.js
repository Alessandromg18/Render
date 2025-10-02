const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Enviar un mensaje
router.post('/send', chatController.sendMessage);

// Obtener el historial de chat entre usuario y psicólogo
router.get('/history', chatController.getChatHistory);

// Marcar mensaje como leído
router.put('/read/:messageId', chatController.markAsRead);

module.exports = router;
