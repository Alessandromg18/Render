const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Rutas para comprar productos (accesibles para cualquier usuario)
router.post('/buy-item', storeController.buyItem);        // Comprar ítem (accesorio, alimento, perfil)
router.post('/buy-coins', storeController.buyCoins);      // Comprar monedas (registro pendiente)
router.get('/items', storeController.getAllItems);

// Rutas para gestión de tienda (solo admin)
router.post('/create-item', roleMiddleware(['admin']), storeController.createItem);   // Crear producto
router.put('/update-item', roleMiddleware(['admin']), storeController.updateItem);    // Actualizar producto
router.delete('/delete-item/:itemId', roleMiddleware(['admin']), storeController.deleteItem);

// Obtener todas las ofertas (público)
router.get('/coin-offers', storeController.getAllCoinOffers);

// Crear oferta (solo admin)
router.post('/coin-offers', roleMiddleware(['admin']), storeController.createCoinOffer);

// Eliminar oferta (solo admin)
router.delete('/coin-offers/:offerId', roleMiddleware(['admin']), storeController.deleteCoinOffer);


// Rutas para gestión de transacciones (solo admin)
router.post('/confirm-payment', roleMiddleware(['admin']), storeController.confirmPayment);       // Confirmar pago
router.post('/cancel-transaction', roleMiddleware(['admin']), storeController.cancelTransaction); // Cancelar transacción



module.exports = router;

