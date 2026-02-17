'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove the existing email column
    await queryInterface.removeColumn('Candidates', 'email');
    // Add the email column with allowNull: true and remove unique constraint
    await queryInterface.addColumn('Candidates', 'email', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the email column
    await queryInterface.removeColumn('Candidates', 'email');
    // Add the email column with allowNull: false
    await queryInterface.addColumn('Candidates', 'email', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });
  }
};
