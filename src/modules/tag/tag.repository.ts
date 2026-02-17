const { Role } = require('../models'); // Import your Sequelize models

class RoleRepository {
  async createRole(role) {
    return Role.create(role);
  }

  async getRoleByName(name) {
    return Role.findOne({ where: { name } });
  }

  // Add more methods as needed
}

module.exports = new RoleRepository();
