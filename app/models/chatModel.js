const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const Chat = sequelize.define('Chat', {
    senderId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    receiverId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    message: {
        type: DataTypes.STRING,
        allowNull: false
    },
    messageType: {
        type: DataTypes.STRING,
        defaultValue: 'text', // Puede ser 'text', 'image', etc.
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'unread', // 'read' o 'unread'
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true,
    paranoid: true
});

module.exports = Chat;
