// app/models/coinOfferModel.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db'); 

const CoinOffer = sequelize.define('CoinOffer', {
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    precioReal: {
        type: DataTypes.FLOAT, // El precio en dinero real (ej: 4.99)
        allowNull: false
    },
    monedasObtenidas: {
        type: DataTypes.INTEGER, // Las monedas virtuales que obtiene el usuario
        allowNull: false
    }
}, {
    timestamps: true,
    tableName: 'CoinOffers'
});

module.exports = CoinOffer;