const Profile = require('../models/profileModel');
const Pet = require('../models/petModel');

/**
 * Sincroniza los accesorios de la mascota con el perfil visual del usuario.
 * Útil cuando el usuario aplica un accesorio o cambia la apariencia.
 */
const syncPetToProfile = async (userId) => {
    try {
        const pet = await Pet.findOne({ where: { userId } });
        if (!pet) throw new Error('Mascota no encontrada');

        let profile = await Profile.findOne({ where: { userId } });

        const newProfileData = {
            accesorios: pet.accesorios || [], // accesorio JSON desde mascota
        };

        if (profile) {
            await profile.update(newProfileData);
        } else {
            // Si no existe, crea con datos mínimos
            await Profile.create({
                userId,
                nombreUsuario: 'Anónimo',
                imagenPerfil: 'default-avatar.png',
                accesorios: newProfileData.accesorios,
                monedas: 0,
                descripcion: ''
            });
        }

        return { message: 'Perfil sincronizado correctamente con mascota' };
    } catch (err) {
        throw new Error('Error al sincronizar el perfil: ' + err.message);
    }
};

module.exports = {
    syncPetToProfile
};
