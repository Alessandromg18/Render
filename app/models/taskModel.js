const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const User = require('./userModel');  // Relación con el usuario

const Task = sequelize.define('Task', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    dueDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending',  // 'pending', 'completed'
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,  // 'task', 'habit', 'routine'
        validate: {
            isIn: [['task', 'habit', 'routine']],
        }
    },
    frequency: {
        type: DataTypes.STRING,  // 'weekly', 'daily', 'one-time'
        allowNull: false,
        validate: {
            isIn: [['weekly', 'daily', 'one-time']],
        }
    },
    category: {
        type: DataTypes.STRING,  // e.g., 'facultad', 'personal', etc.
        allowNull: false
    },
    duration: {
        type: DataTypes.INTEGER,  // Duración en días o semanas
        allowNull: true
    },
    isHabit: {                      // <-- Nuevo campo para indicar si es hábito
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
    },
    repeatWeekly: {                 // <-- Nuevo campo para repetir semanalmente
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
    },
    completedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true,
    paranoid: true
});

module.exports = Task;
