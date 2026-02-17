'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove unique index on email if exists
    try {
      await queryInterface.sequelize.query('DROP INDEX IF EXISTS email ON Candidates;');
    } catch (error) {
      console.log('No unique index on email to drop or error dropping index:', error.message);
    }
    // Change email column to allow null and remove unique constraint
    await queryInterface.changeColumn('Candidates', 'email', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert email column to not allow null and unique
    await queryInterface.changeColumn('Candidates', 'email', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });
    // Recreate unique index on email
    try {
      await queryInterface.sequelize.query('CREATE UNIQUE INDEX email ON Candidates(email);');
    } catch (error) {
      console.log('Error creating unique index on email:', error.message);
    }
  }
};
