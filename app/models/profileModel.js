const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const User = require('./userModel');
const Pet = require('./petModel');


const Profile = sequelize.define('Profile', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    nombreUsuario: {
        type: DataTypes.STRING,
        allowNull: false
    },
    imagenPerfil: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'default-avatar.png' // Imagen por defecto
    },
    perfilId: {
        type: DataTypes.INTEGER,  // Referencia al perfil comprado
        allowNull: true,
    },
    accesorios: {
        type: DataTypes.JSON, // Lista de accesorios comprados
        allowNull: true,
        defaultValue: [] // Lista vacía por defecto
    },
    monedas: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0 // Cantidad de monedas del usuario
    },
    descripcion: {
        type: DataTypes.STRING,
        allowNull: true, // Permitimos que sea null (opcional)
        defaultValue: '' // Descripción por defecto vacía
    }
}, {
    timestamps: true,
    paranoid: true // Para eliminación segura
});

// Relación: Un perfil pertenece a un usuario
Profile.belongsTo(User, { foreignKey: 'userId' });

module.exports = Profile;
