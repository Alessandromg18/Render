const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const User = require('./userModel');

const Post = sequelize.define('Post', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    contenido: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    tipoUsuario: {
        type: DataTypes.ENUM('usuario', 'psicologo'),
        allowNull: false,
        defaultValue: 'usuario'
    },
    likes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    imagen: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true,
    paranoid: true
});

// Relación: Un Post pertenece a un Usuario
Post.belongsTo(User, { foreignKey: 'userId' });

module.exports = Post;
