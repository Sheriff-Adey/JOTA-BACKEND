'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Check if email column exists
    const tableDescription = await queryInterface.describeTable('candidates');
    if (!tableDescription.email) {
      // Add the email column if it doesn't exist
      await queryInterface.addColumn('candidates', 'email', {
        type: Sequelize.STRING,
        allowNull: true,
        unique: false
      });
    } else {
      // Change the email column to allow null and remove unique
      await queryInterface.changeColumn('candidates', 'email', {
        type: Sequelize.STRING,
        allowNull: true,
        unique: false
      });
    }
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
