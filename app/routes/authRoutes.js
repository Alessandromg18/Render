const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const  isAuthenticated  = require('../middlewares/authMiddleware');


// Rutas de autenticación
router.post('/register', authController.register);  // Registro de usuario
router.post('/login', authController.login);        // Login de usuario
router.post('/logout', authController.logout);      // Logout de usuario
router.put('/profile', isAuthenticated, authController.updateUserProfile);


module.exports = router;
