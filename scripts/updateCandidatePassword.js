const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function updateCandidatePassword(candidateId, newPassword) {
  // Initialize Sequelize connection using environment variables
  const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql', // or your database dialect
    logging: false,
  });

  // Define Candidate model (adjust fields as per your schema)
  const Candidate = sequelize.define('Candidate', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    password: {
      type: DataTypes.STRING,
    },
  }, {
    tableName: 'candidates', // your actual table name
    timestamps: false,
  });

  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    const candidate = await Candidate.findByPk(candidateId);
    if (!candidate) {
      console.error('Candidate not found');
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    candidate.password = hashedPassword;
    await candidate.save();

    console.log('Password updated successfully for candidate:', candidateId);
    process.exit(0);
  } catch (error) {
    console.error('Error updating password:', error);
    process.exit(1);
  }
}

// Read command line arguments
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error('Usage: node updateCandidatePassword.js <candidateId> <newPassword>');
  process.exit(1);
}

const [candidateId, newPassword] = args;

updateCandidatePassword(candidateId, newPassword);
