const sequelize = require('../../config/db');
const Item = require('../models/itemModel');
const InventoryItem = require('../models/inventoryItem'); // Asegúrate de que la ruta sea correcta
const User = require('../models/userModel');
const Pet = require('../models/petModel');
const Profile = require('../models/profileModel');
const Transaction = require('../models/transactionModel');
const CoinOffer = require('../models/coinOfferModel');
const { Op } = require('sequelize');

// Controller - comprar item
exports.buyItem = async (req, res) => {
  const userId = req.session.userId;
  let { itemId, cantidad } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  // Validar datos
  if (!itemId || !cantidad || isNaN(cantidad) || cantidad <= 0) {
    return res.status(400).json({ error: 'Datos inválidos para la compra' });
  }

  cantidad = parseInt(cantidad, 10);

  try {
    const item = await Item.findByPk(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Ítem no encontrado' });
    }

    if (item.cantidad < cantidad) {
      return res.status(400).json({ error: 'Stock insuficiente' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const costoTotal = item.precio * cantidad;
    if (user.monedas < costoTotal) {
      return res.status(400).json({ error: 'Monedas insuficientes para realizar la compra' });
    }

    // Validar que item.tipo es válido para InventoryItem
    const tiposValidos = ['accesorio', 'perfil', 'alimento'];
    if (!tiposValidos.includes(item.tipo)) {
      return res.status(400).json({ error: 'Tipo de ítem no válido para inventario' });
    }

    // Usar transacción para evitar problemas si algo falla
    await sequelize.transaction(async (t) => {
      // Actualizar monedas del usuario
      user.monedas -= costoTotal;
      await user.save({ transaction: t });

      // Reducir stock del item
      item.cantidad -= cantidad;
      await item.save({ transaction: t });

      // Agregar o actualizar item en inventario
      const [inventoryItem, created] = await InventoryItem.findOrCreate({
        where: {
          userId,
          itemId: item.id,
          itemType: item.tipo
        },
        defaults: {
          cantidad
        },
        transaction: t
      });

      if (!created) {
        inventoryItem.cantidad += cantidad;
        await inventoryItem.save({ transaction: t });
      }

      // Registrar transacción
      await Transaction.create({
        userId,
        monto: costoTotal,
        tipo: 'compra',
        descripcion: `${item.nombre} x${cantidad}`,
        monedaGastada: costoTotal
      }, { transaction: t });
    });

    res.json({ message: 'Compra realizada correctamente. Ítem agregado al inventario.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al realizar la compra', details: err.message });
  }
};

// Obtener todos los ítems de la tienda (público)
exports.getAllItems = async (req, res) => {
  const { tipo, disponibles } = req.query;

  const whereClause = {};

  // Filtrar por tipo si se proporciona (alimento, accesorio, perfil)
  if (tipo) {
    const tiposValidos = ['alimento', 'accesorio', 'perfil'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ error: 'Tipo de ítem no válido' });
    }
    whereClause.tipo = tipo;
  }

  // Filtrar por disponibilidad (stock > 0)
  if (disponibles === 'true') {
    whereClause.cantidad = { [Op.gt]: 0 };
  }

  try {
    const items = await Item.findAll({
      where: whereClause,
      order: [['precio', 'ASC']] // Orden opcional
    });

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener los productos', details: err.message });
  }
};


exports.createCoinOffer = async (req, res) => {
    const { nombre, precioReal, monedasObtenidas } = req.body;

    if (!nombre || !precioReal || !monedasObtenidas) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    try {
        const newOffer = await CoinOffer.create({
            nombre,
            precioReal,
            monedasObtenidas
        });

        res.json({
            message: 'Oferta creada correctamente',
            offer: newOffer
        });
    } catch (err) {
        res.status(500).json({ error: 'Error al crear la oferta', details: err.message });
    }
};

// Obtener todas las ofertas disponibles (público)
exports.getAllCoinOffers = async (req, res) => {
    try {
        const offers = await CoinOffer.findAll({
            order: [['precioReal', 'ASC']]
        });
        res.json(offers);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener las ofertas', details: err.message });
    }
};

// Eliminar una oferta (solo admin)
exports.deleteCoinOffer = async (req, res) => {
    const { offerId } = req.params;

    if (!offerId) {
        return res.status(400).json({ error: 'ID de la oferta requerido' });
    }

    try {
        const offer = await CoinOffer.findByPk(offerId);
        if (!offer) {
            return res.status(404).json({ error: 'Oferta no encontrada' });
        }

        await offer.destroy();

        res.json({ message: 'Oferta eliminada correctamente' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar la oferta', details: err.message });
    }
};


exports.buyCoins = async (req, res) => {
    const userId = req.session.userId;
    const { offerId } = req.body;

    if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    try {
        // Buscar la oferta seleccionada
        const offer = await CoinOffer.findByPk(offerId);
        
        if (!offer) {
            return res.status(400).json({ error: 'Oferta no válida' });
        }

        // Verificar que la oferta tiene la propiedad 'monedasObtenidas'
        if (!offer.monedasObtenidas) {
            return res.status(400).json({ error: 'La oferta no contiene cantidad de monedas válida' });
        }

        // Verificar que la oferta tiene un precio válido
        if (!offer.precioReal || offer.precioReal <= 0) {
            return res.status(400).json({ error: 'La oferta no tiene un precio válido' });
        }

        // Registrar la transacción con estado 'pendiente'
        const transaction = await Transaction.create({
            userId: userId,
            monto: offer.precioReal,
            tipo: 'compra',
            descripcion: `Compra de ${offer.monedasObtenidas} monedas`,
            monedaGastada: offer.monedasObtenidas,  // Usar offer.monedasObtenidas
            ofertaId: offer.id,
            estado: 'pendiente'  // Estado inicial de la transacción
        });

        res.json({ message: 'Compra de monedas registrada como pendiente', transaction });
    } catch (err) {
        console.error('Error en buyCoins:', err);
        res.status(500).json({ error: 'Error al procesar la compra', details: err.message });
    }
};

exports.createItem = async (req, res) => {
    let { nombre, tipo, descripcion, precio, cantidad, imagen } = req.body;

    // Validaciones básicas
    if (!nombre || !tipo || precio === undefined || cantidad === undefined) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Validar tipos
    const tiposValidos = ['accesorio', 'perfil', 'alimento'];
    if (!tiposValidos.includes(tipo)) {
        return res.status(400).json({ error: 'Tipo inválido. Debe ser accesorio, perfil o alimento.' });
    }

    precio = Number(precio);
    cantidad = Number(cantidad);

    if (isNaN(precio) || precio <= 0) {
        return res.status(400).json({ error: 'Precio debe ser un número positivo' });
    }

    if (isNaN(cantidad) || cantidad < 0) {
        return res.status(400).json({ error: 'Cantidad debe ser un número mayor o igual a cero' });
    }

    descripcion = descripcion ? descripcion.toString() : null;
    imagen = imagen ? imagen.toString() : null;

    try {
        const newItem = await Item.create({
            nombre,
            tipo,
            descripcion,
            precio,
            cantidad,
            imagen
        });

        res.json({
            message: 'Producto creado correctamente',
            item: newItem
        });
    } catch (err) {
        res.status(500).json({ error: 'Error al crear el producto', details: err.message });
    }
};

exports.updateItem = async (req, res) => {
    const { itemId, nombre, tipo, descripcion, precio, cantidad, imagen } = req.body;

    if (!itemId) {
        return res.status(400).json({ error: 'ID del producto requerido' });
    }

    try {
        const item = await Item.findByPk(itemId);
        if (!item) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Validaciones opcionales
        const tiposValidos = ['accesorio', 'perfil', 'alimento'];
        if (tipo && !tiposValidos.includes(tipo)) {
            return res.status(400).json({ error: 'Tipo inválido. Debe ser accesorio, perfil o alimento.' });
        }

        let updateData = {};

        if (nombre !== undefined) updateData.nombre = nombre;
        if (tipo !== undefined) updateData.tipo = tipo;
        if (descripcion !== undefined) updateData.descripcion = descripcion;
        if (precio !== undefined) {
            const precioNum = Number(precio);
            if (isNaN(precioNum) || precioNum <= 0) {
                return res.status(400).json({ error: 'Precio debe ser un número positivo' });
            }
            updateData.precio = precioNum;
        }
        if (cantidad !== undefined) {
            const cantidadNum = Number(cantidad);
            if (isNaN(cantidadNum) || cantidadNum < 0) {
                return res.status(400).json({ error: 'Cantidad debe ser un número mayor o igual a cero' });
            }
            updateData.cantidad = cantidadNum;
        }
        if (imagen !== undefined) updateData.imagen = imagen;

        await item.update(updateData);

        res.json({
            message: 'Producto actualizado correctamente',
            item
        });
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar el producto', details: err.message });
    }
};

// Eliminar un producto de la tienda (Admin)
exports.deleteItem = async (req, res) => {
    // Aquí suponemos que el id viene por params, por ejemplo DELETE /items/:itemId
    const { itemId } = req.params;

    // Validación de autenticación y rol admin, si no tienes middleware
    const userRole = req.session?.rol;
    if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado. Solo admins pueden eliminar productos.' });
    }

    if (!itemId) {
        return res.status(400).json({ error: 'ID del producto requerido' });
    }

    try {
        const item = await Item.findByPk(itemId);
        if (!item) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        await item.destroy(); // borrado lógico si tienes paranoid true

        res.json({
            message: 'Producto eliminado correctamente'
        });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar el producto', details: err.message });
    }
};


// Confirmar el pago de una oferta (Admin)
exports.confirmPayment = async (req, res) => {
    const { transactionId } = req.body;

    // Verificar que el usuario tiene el rol de admin
    const userRole = req.session.rol; // Usar req.session.rol
    if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado. No tienes permisos suficientes.' });
    }

    try {
        // Buscar la transacción en la base de datos
        const transaction = await Transaction.findByPk(transactionId);
        if (!transaction) {
            return res.status(404).json({ error: 'Transacción no encontrada' });
        }

        // Verificar si la transacción está en estado pendiente
        if (transaction.estado !== 'pendiente') {
            return res.status(400).json({ error: 'La transacción no está pendiente' });
        }

        // Cambiar el estado de la transacción a "completada"
        transaction.estado = 'completada';
        await transaction.save();

        // Buscar al usuario relacionado con la transacción
        const user = await User.findByPk(transaction.userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Sumar las monedas al usuario
        user.monedas += transaction.monedaGastada;
        await user.save();

        // Responder con éxito
        res.json({ message: 'Pago confirmado y monedas acreditadas correctamente' });
    } catch (err) {
        // Manejo de errores
        console.error(err);  // Log de errores en el servidor para depuración
        res.status(500).json({ error: 'Error al confirmar el pago', details: err.message });
    }
};


// Cancelar una transacción (Admin)
exports.cancelTransaction = async (req, res) => {
    const { transactionId } = req.body;

    // Verificar que el usuario tiene el rol de admin
    const userRole = req.session.rol; // Usar req.session.rol en lugar de req.userRole
    if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado. No tienes permisos suficientes.' });
    }

    try {
        // Buscar la transacción en la base de datos
        const transaction = await Transaction.findByPk(transactionId);
        if (!transaction) {
            return res.status(404).json({ error: 'Transacción no encontrada' });
        }

        // Verificar si la transacción está en estado pendiente
        if (transaction.estado !== 'pendiente') {
            return res.status(400).json({ error: 'La transacción no está pendiente' });
        }

        // Cambiar el estado de la transacción a "cancelada"
        transaction.estado = 'cancelada';
        await transaction.save();

        // Responder con éxito
        res.json({ message: 'Transacción cancelada correctamente' });
    } catch (err) {
        // Manejo de errores
        console.error(err);  // Log de errores en el servidor para depuración
        res.status(500).json({ error: 'Error al cancelar la transacción', details: err.message });
    }
};
