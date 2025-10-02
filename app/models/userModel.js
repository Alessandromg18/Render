const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const Pet = require('./petModel'); // Relación con la mascota

const User = sequelize.define('User', {
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    monedas: {
        type: DataTypes.INTEGER,
        defaultValue: 50 // Balance de monedas del usuario
    },
    rol: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'user', // Roles posibles: user, admin, psicologo
        validate: {
            isIn: [['user', 'admin', 'psicologo']] // Validación de rol
        }
    }
}, {
    // Opciones del modelo
    timestamps: true,
    paranoid: true // Si se elimina un usuario, se guarda el registro por seguridad
});

// Relación: Un Usuario tiene una Mascota (Uno a Uno)
User.hasOne(Pet, { foreignKey: 'userId' });
Pet.belongsTo(User, { foreignKey: 'userId' });

module.exports = User;
