const express = require('express');
const router = express.Router();
const petController = require('../controllers/petController');
// Asegúrate de que el path a roleMiddleware sea correcto, lo corregimos a 'middleware' singular.
const roleMiddleware = require('../middlewares/roleMiddleware'); 

// ---------------------------------------------------------------------
// ✅ RUTAS IMPLEMENTADAS EN petController.js

// Ruta para ver el estado de la mascota
router.get('/status', petController.getPetStatus);

// Ruta para alimentar a la mascota (usa feedFromInventory en el controlador)
router.post('/feed', petController.feedFromInventory);

// Ruta para acariciar a la mascota (aumenta felicidad)
router.post('/care', petController.petCare);

// Ruta NUEVA: Obtener accesorios desbloqueados (petController.getUnlockedAccessories existe)
router.get('/accessories', petController.getUnlockedAccessories); 

// Ruta NUEVA: Obtener cantidad de alimentos (petController.getFoodAmount existe)
router.get('/food-amount', petController.getFoodAmount);


// ---------------------------------------------------------------------
// ⚠️ RUTAS COMENTADAS TEMPORALMENTE
// Causa: Estas funciones AÚN NO están exportadas en petController.js (dan undefined)

// Ruta para cambiar la emoción de la mascota
// router.post('/emotion', petController.changeEmotion); 

// Ruta para vestir a la mascota (cambiar accesorios o ropa)
// router.post('/dress', petController.dressPet); 

// Ruta para cambiar el ambiente de la mascota
// router.post('/environment', petController.changeEnvironment); 

// Rutas adicionales protegidas, solo para admins
// router.post('/admin/modify', roleMiddleware(['admin']), petController.modifyPet);

module.exports = router;