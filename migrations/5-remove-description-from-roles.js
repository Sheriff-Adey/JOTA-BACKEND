'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('roles', 'description');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('roles', 'description', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  }
};
