const Sequelize = require('sequelize');

const User = require('../src/modules/user/user.entity.ts');
const  Role = require('../src/modules/role/role.entity.ts');

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  models:[Role]
});


// 


await User.sync({ sequelize })
await Role.sync({ sequelize })
// Sync the models with the database
await sequelize.sync();



module.exports = sequelize;
