const InventoryItem = require('../models/inventoryItem');
const Item = require('../models/itemModel');
const Pet = require('../models/petModel');
const Profile = require('../models/profileModel');

// Obtener inventario del usuario
exports.getInventory = async (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  try {
    const inventory = await InventoryItem.findAll({
      where: { userId },
      include: {
        model: Item,
        attributes: ['nombre', 'tipo', 'descripcion', 'imagen']
      }
    });

    res.json({
      message: 'Inventario obtenido correctamente',
      inventory
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el inventario', details: error.message });
  }
};

exports.addItem = async (req, res) => {
  const userId = req.session.userId;
  let { itemId, cantidad } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  itemId = parseInt(itemId, 10);
  cantidad = parseInt(cantidad, 10);

  if (isNaN(itemId) || isNaN(cantidad) || cantidad <= 0) {
    return res.status(400).json({ error: 'Datos inválidos para agregar ítem' });
  }

  try {
    const item = await Item.findByPk(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Ítem no encontrado' });
    }

    const validTypes = ['accesorio', 'perfil', 'alimento'];
    if (!validTypes.includes(item.tipo)) {
      return res.status(400).json({ error: 'Tipo de ítem inválido' });
    }

    const [inventoryItem, created] = await InventoryItem.findOrCreate({
      where: {
        userId,
        itemId,
        itemType: item.tipo
      },
      defaults: {
        cantidad
      }
    });

    if (!created) {
      inventoryItem.cantidad += cantidad;
      await inventoryItem.save();
    }

    await inventoryItem.reload();

    res.json({ message: 'Ítem agregado al inventario correctamente', inventoryItem });
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar ítem', details: error.message });
  }
};

exports.useItem = async (req, res) => {
  const userId = req.session.userId;
  const { itemId } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  if (!itemId) {
    return res.status(400).json({ error: 'ID del ítem es requerido' });
  }

  try {
    const inventoryItem = await InventoryItem.findOne({
      where: { userId, itemId },
      include: { model: Item }
    });

    if (!inventoryItem) {
      return res.status(404).json({ error: 'Ítem no disponible en el inventario' });
    }

    const item = inventoryItem.Item;

    if (!item) {
      return res.status(404).json({ error: 'Datos del ítem no encontrados' });
    }

    let message = '';

    switch (item.tipo) {
      case 'alimento': {
        const pet = await Pet.findOne({ where: { userId } });
        if (!pet) {
          return res.status(404).json({ error: 'Mascota no encontrada para usar alimento' });
        }

        // Reducir hambre sin bajar de 0
        pet.hambre = Math.max(0, pet.hambre - 10);
        await pet.save();

        // NO existe hambre en perfil, no asignar

        // Descontar ítem
        inventoryItem.cantidad -= 1;
        if (inventoryItem.cantidad <= 0) {
          await inventoryItem.destroy();
        } else {
          await inventoryItem.save();
        }

        message = `Mascota alimentada con ${item.nombre}`;
        break;
      }

      case 'accesorio': {
        const pet = await Pet.findOne({ where: { userId } });
        if (!pet) {
          return res.status(404).json({ error: 'Mascota no encontrada para aplicar accesorio' });
        }

        // Accesorios es JSONB (array)
        const accesorios = pet.accesorios || [];
        accesorios.push(item.nombre);
        pet.accesorios = accesorios;
        await pet.save();

        const profile = await Profile.findOne({ where: { userId } });
        if (profile) {
          profile.accesorios = pet.accesorios;
          await profile.save();
        }

        // No se consume accesorio
        message = `Accesorio ${item.nombre} aplicado a tu mascota`;
        break;
      }

      case 'perfil': {
        const profile = await Profile.findOne({ where: { userId } });
        if (!profile) {
          return res.status(404).json({ error: 'Perfil no encontrado para actualizar imagen' });
        }

        profile.imagenPerfil = item.imagen;
        await profile.save();

        // No se consume perfil
        message = `Imagen de perfil actualizada con ${item.nombre}`;
        break;
      }

      default:
        return res.status(400).json({ error: 'Tipo de ítem no soportado' });
    }

    res.json({ message });
  } catch (error) {
    res.status(500).json({ error: 'Error al usar ítem', details: error.message });
  }
};
