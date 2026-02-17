'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('candidateexams', 'submissionType', {
            type: Sequelize.STRING(50),
            allowNull: true,
            comment: 'How the exam was submitted: manual, timeout, inactivity, fullscreen_exit, window_exit, app_switching'
        });
        
        await queryInterface.addColumn('candidateexams', 'submissionReason', {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Detailed reason for submission if auto-submitted'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('candidateexams', 'submissionType');
        await queryInterface.removeColumn('candidateexams', 'submissionReason');
    }
};
