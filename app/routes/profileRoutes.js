// app/routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

// Ruta para obtener el perfil del usuario
// CORREGIDO: Usa solo '/' para que la URL final sea /profile
router.get('/', profileController.getUserProfile);

// Ruta para actualizar el perfil (con validación de inventario)
// CORREGIDO: Usa solo '/' para que la URL final sea /profile
router.put('/', profileController.updateProfile);

// Nueva ruta: Obtener los ítems de tipo "perfil" disponibles en el inventario
// CORREGIDO: Usa el sufijo relativo para que la URL final sea /profile/perfiles-inventario
router.get('/perfiles-inventario', profileController.getPerfilImagesFromInventory);

module.exports = router;