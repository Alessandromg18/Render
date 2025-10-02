const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,        // nombre de la base de datos
  process.env.DB_USER,        // usuario
  process.env.DB_PASSWORD,    // contraseña
  {
    host: process.env.DB_HOST, // host render
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,         // Render exige SSL
        rejectUnauthorized: false
      }
    }
  }
);

module.exports = sequelize;
