const Profile = require('../models/profileModel');
const Pet = require('../models/petModel');
const User = require('../models/userModel');  // Importamos el modelo de User
const InventoryItem = require('../models/inventoryItem');
const Item = require('../models/itemModel'); // Necesario para verificar tipo de ítem


exports.getUserProfile = async (req, res) => {
    const userId = req.session.userId;
    
    if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    try {
        const profile = await Profile.findOne({ 
            where: { userId }
        });

        if (!profile) {
            return res.status(404).json({ error: 'Perfil no encontrado' });
        }

        res.json({
            message: 'Perfil obtenido exitosamente',
            profile: {
                nombreUsuario: profile.nombreUsuario,
                imagenPerfil: profile.imagenPerfil,
                accesorios: profile.accesorios || [], // fallback
                monedas: profile.monedas,
                descripcion: profile.descripcion || ''
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener el perfil', details: err.message });
    }
};




exports.updateProfile = async (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { imagenPerfil, nombreUsuario, perfilId, accesorios, descripcion } = req.body;

    try {
        let validImage = 'default-avatar.png'; // valor por defecto

        if (imagenPerfil) {
            // Busca el item de perfil por imagen y tipo perfil
            const item = await Item.findOne({
                where: { imagen: imagenPerfil, tipo: 'perfil' }
            });

            if (!item) {
                return res.status(400).json({ error: 'La imagen seleccionada no corresponde a un ítem de perfil válido.' });
            }

            const inventoryItem = await InventoryItem.findOne({
                where: {
                    userId,
                    itemId: item.id,
                    itemType: 'perfil'
                }
            });

            if (!inventoryItem) {
                return res.status(403).json({ error: 'No posees este ítem de perfil en tu inventario.' });
            }

            validImage = imagenPerfil; // ✅ imagen validada
        }

        let profile = await Profile.findOne({ where: { userId } });

        const newProfileData = {
            nombreUsuario: nombreUsuario || (profile ? profile.nombreUsuario : 'Anónimo'),
            imagenPerfil: validImage,
            perfilId: perfilId || (profile ? profile.perfilId : null),
            accesorios: Array.isArray(accesorios) ? accesorios : (profile ? profile.accesorios : []),
            descripcion: descripcion !== undefined ? descripcion : (profile ? profile.descripcion : '')
        };

        if (profile) {
            await profile.update(newProfileData);
        } else {
            await Profile.create({ ...newProfileData, userId });
        }

        res.json({
            message: 'Perfil actualizado correctamente',
            profile: newProfileData
        });
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar el perfil', details: err.message });
    }
};



// GET /inventory/perfiles
exports.getPerfilImagesFromInventory = async (req, res) => {
    const userId = req.session.userId;

    if (!userId) return res.status(401).json({ error: 'Usuario no autenticado' });

    try {
        const inventory = await InventoryItem.findAll({
            where: { userId, itemType: 'perfil' },
            include: {
                model: Item,
                attributes: ['imagen', 'nombre']
            }
        });

        const imagenes = inventory.map(inv => inv.Item.imagen);

        res.json({ perfilesDisponibles: imagenes });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener los perfiles del inventario', details: err.message });
    }
};
