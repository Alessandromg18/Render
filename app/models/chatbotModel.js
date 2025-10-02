const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const User = require('./userModel');
const Pet = require('./petModel');

const Chatbot = sequelize.define('Chatbot', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    petId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Pet,
            key: 'id'
        }
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    estadoEmocional: {
        type: DataTypes.STRING,
        defaultValue: 'feliz', 
    },
    lastMessageTime: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true,
    paranoid: true
});

module.exports = Chatbot;
