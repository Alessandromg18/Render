const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const Pet = sequelize.define('Pet', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'MiPou'
  },
  imagenBase: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'default.png' // Imagen base de la mascota
  },
  accesorios: {
    type: DataTypes.JSONB, // Lista de accesorios
    allowNull: false,
    defaultValue: []
  },
  estadoEmocional: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'feliz', // Estado emocional por defecto
    validate: {
      isIn: [['feliz', 'triste', 'con_sueno']] // Emociones válidas
    }
  },
  imagenEstado: {
    type: DataTypes.STRING, // Imagen de la mascota según el estado emocional
    allowNull: true,
    defaultValue: 'default.png'
  },
  hambre: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 50,
    validate: {
      min: 0,
      max: 100
    }
  },
  felicidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 50,
    validate: {
      min: 0,
      max: 100
    }
  },
  ultimaComida: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  paranoid: true // Guarda registros eliminados de forma lógica
});

module.exports = Pet;
