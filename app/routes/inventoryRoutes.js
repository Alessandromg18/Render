const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// Rutas de Inventario: Cambiar /inventory por /
router.get('/', inventoryController.getInventory); // Ver inventario (antes /inventory)
router.post('/add', inventoryController.addItem); // Agregar ítem al inventario (antes /inventory/add)
router.post('/use', inventoryController.useItem); // Usar ítem del inventario (antes /inventory/use)

module.exports = router;