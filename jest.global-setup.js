// This file will be used as Jest's globalSetup to run pretest logic before all tests
const { execSync } = require('child_process');

module.exports = async () => {
  // Build the project (same as your npm run build)
  execSync('npm run build', { stdio: 'inherit' });

  // Run the pretest setup script
  execSync('node dist/scripts/pretestSetup.js', { stdio: 'inherit' });
};
