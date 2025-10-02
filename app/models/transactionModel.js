// models/transactionModel.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const User = require('./userModel');
const CoinOffer = require('./coinOfferModel');

const Transaction = sequelize.define('Transaction', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    monto: {
        type: DataTypes.FLOAT, // Monto gastado en dinero
        allowNull: false
    },
    tipo: {
        type: DataTypes.STRING, // 'compra', 'recarga', etc.
        allowNull: false
    },
    descripcion: {
        type: DataTypes.STRING, // Descripción del producto o servicio adquirido
        allowNull: true
    },
    monedaGastada: {
        type: DataTypes.INTEGER, // Cantidad de monedas gastadas
        allowNull: false
    },
    ofertaId: {  // Relación con las ofertas de monedas
        type: DataTypes.INTEGER,
        references: {
            model: CoinOffer,
            key: 'id'
        },
        allowNull: true
    },
    estado: {  // Estado de la transacción (pendiente, completada, cancelada)
        type: DataTypes.STRING,
        defaultValue: 'pendiente',
        allowNull: false
    }
}, {
    timestamps: true,
});

module.exports = Transaction;
