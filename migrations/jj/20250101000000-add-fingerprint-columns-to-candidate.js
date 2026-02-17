'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    

    await queryInterface.addColumn('candidates', 'fingerprintImage', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    
    await queryInterface.removeColumn('candidates', 'fingerprintImage');
  }
};
