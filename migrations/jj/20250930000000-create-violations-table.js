'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('violations', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      examId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'exams',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      candidateId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'candidates',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      violationType: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Type of violation: fullscreen, tab_switch, window_exit, app_switching, inactivity, etc.',
      },
      violationReason: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Detailed description of the violation',
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Additional metadata about the violation',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes for faster queries
    await queryInterface.addIndex('violations', ['examId']);
    await queryInterface.addIndex('violations', ['candidateId']);
    await queryInterface.addIndex('violations', ['createdAt']);
    await queryInterface.addIndex('violations', ['examId', 'candidateId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('violations');
  },
};

