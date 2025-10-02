const Pet = require('../models/petModel');
const User = require('../models/userModel');
const Profile = require('../models/profileModel'); // Asegúrate de importarlo
const InventoryItem = require('../models/inventoryItem'); // Ajusta path si es necesario
const Item = require('../models/itemModel');


exports.getPetStatus = async (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  try {
    const pet = await Pet.findOne({
      where: { userId },
      //Podés seleccionar solo campos visibles si querés:
      //attributes: ['estadoEmocional', 'hambre', 'felicidad', 'imagenBase', 'accesorios']
    });
    if (!pet) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    const { hambre, felicidad } = pet;
    let nuevaEmocion = pet.estadoEmocional;

    // Calcular nueva emoción
    if (felicidad > 70 && hambre < 30) {
      nuevaEmocion = 'feliz';
    } else if (felicidad < 30 || hambre > 70) {
      nuevaEmocion = 'triste';
    } else {
      nuevaEmocion = 'con_sueno';
    }

    if (pet.estadoEmocional !== nuevaEmocion) {
      pet.estadoEmocional = nuevaEmocion;
      await pet.save();
    }

    res.json({
      message: 'Estado de la mascota obtenido exitosamente',
      pet: {
        estadoEmocional: pet.estadoEmocional,
        hambre: pet.hambre,
        felicidad: pet.felicidad,
        accesorios: pet.accesorios,
        imagenBase: pet.imagenBase
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener la mascota', details: err.message });
  }
};


exports.feedFromInventory = async (req, res) => {
  const userId = req.session.userId;
  const { itemId } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }
  if (!itemId) {
    return res.status(400).json({ error: 'ID de ítem requerido' });
  }

  try {
    const inventoryItem = await InventoryItem.findOne({
      where: { userId, itemId },
      include: { model: Item }
    });

    if (!inventoryItem || inventoryItem.cantidad <= 0) {
      return res.status(404).json({ error: 'Ítem de comida no disponible' });
    }

    // item puede no existir
    const item = inventoryItem.Item;
    if (!item) {
      return res.status(404).json({ error: 'Datos del ítem no encontrados' });
    }

    if (item.tipo !== 'alimento') {
      return res.status(400).json({ error: 'Este ítem no es comida' });
    }

    const pet = await Pet.findOne({ where: { userId } });
    if (!pet) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    // Aplicar efectos del alimento
    pet.hambre = Math.max(0, pet.hambre - 20);
    pet.felicidad = Math.min(100, pet.felicidad + 10);
    pet.ultimaComida = new Date();
    await pet.save();

    // Consumir ítem
    inventoryItem.cantidad -= 1;
    if (inventoryItem.cantidad === 0) {
      await inventoryItem.destroy();
    } else {
      await inventoryItem.save();
    }

    res.json({
      message: `Mascota alimentada con ${item.nombre}`,
      pet: {
        hambre: pet.hambre,
        felicidad: pet.felicidad,
        estadoEmocional: pet.estadoEmocional
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al alimentar mascota', details: err.message });
  }
};


exports.getUnlockedAccessories = async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ error: 'Usuario no autenticado' });

  try {
    const inventory = await InventoryItem.findAll({
      where: { userId },
      include: {
        model: Item,
        where: { tipo: 'accesorio' },
        attributes: ['nombre', 'imagen']
      }
    });

    const accesorios = inventory.map(i => i.Item.nombre); // solo nombres
    res.json({ message: 'Accesorios desbloqueados', accesorios });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener accesorios', details: err.message });
  }
};


exports.getFoodAmount = async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ error: 'Usuario no autenticado' });

  try {
    const foodItems = await InventoryItem.findAll({
      where: { userId },
      include: {
        model: Item,
        where: { tipo: 'alimento' },
        attributes: ['nombre', 'imagen']
      }
    });

    const formatted = foodItems.map(f => ({
      nombre: f.Item.nombre,
      cantidad: f.cantidad,
      imagen: f.Item.imagen
    }));

    res.json({ message: 'Alimentos disponibles', alimentos: formatted });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener alimentos', details: err.message });
  }
};



// Acariciar a la mascota (aumenta la felicidad)
exports.petCare = async (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    try {
        const pet = await Pet.findOne({ where: { userId } });
        if (!pet) {
            return res.status(404).json({ error: 'Mascota no encontrada' });
        }

        pet.felicidad = Math.min(100, pet.felicidad + 10);  // Aumentamos felicidad
        await pet.save();

        res.json({ message: 'Mascota acariciada, felicidad aumentada', pet });
    } catch (err) {
        res.status(500).json({ error: 'Error al acariciar la mascota', details: err.message });
    }
};



