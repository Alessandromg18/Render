const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const Item = sequelize.define('Item', {
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    tipo: {
        type: DataTypes.STRING, // 'accesorio', 'alimento', etc.
        allowNull: false
    },
    descripcion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    precio: {
        type: DataTypes.INTEGER, // Precio en monedas
        allowNull: false
    },
    cantidad: {
        type: DataTypes.INTEGER, // Cantidad disponible en la tienda
        allowNull: false,
        defaultValue: 100 // Puede tener stock limitado
    },
    imagen: {
        type: DataTypes.STRING, // Ruta de imagen para mostrar en la tienda
        allowNull: true
    }
}, {
    timestamps: true,
});

module.exports = Item;
