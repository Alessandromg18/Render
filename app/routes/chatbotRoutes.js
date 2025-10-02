const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

// Ruta para enviar un mensaje al chatbot
router.post('/send', chatbotController.sendMessage);

// Ruta para crear una tarea a través del chatbot
router.post('/createTask', chatbotController.createTask);

// Ruta para obtener el historial de mensajes entre el usuario y el chatbot
router.get('/getChatHistory', chatbotController.getChatHistory);

// Ruta para actualizar el estado emocional de la mascota
router.post('/updatePetMood', chatbotController.updatePetMood);

module.exports = router;

