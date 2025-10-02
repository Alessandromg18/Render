const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const User = require('./userModel');
const Item = require('./itemModel');

const InventoryItem = sequelize.define('InventoryItem', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  itemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Item,
      key: 'id'
    }
  },
  itemType: {
    type: DataTypes.ENUM('accesorio', 'perfil', 'alimento'),
    allowNull: false
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  }
}, {
  timestamps: true,
  paranoid: true,
  tableName: 'InventoryItems'
});

// Relaciones
InventoryItem.belongsTo(User, { foreignKey: 'userId' });
InventoryItem.belongsTo(Item, { foreignKey: 'itemId' });

Item.hasMany(InventoryItem, { foreignKey: 'itemId' });
User.hasMany(InventoryItem, { foreignKey: 'userId' });

module.exports = InventoryItem;
