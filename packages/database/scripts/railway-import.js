const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting Railway Database Setup...\n');

try {
  // Step 1: Push schema
  console.log('📋 Step 1: Creating database schema...');
  execSync('npx prisma db push --accept-data-loss --skip-generate', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('✅ Schema created!\n');

  // Step 2: Import data
  console.log('📥 Step 2: Importing data...');
  execSync('npm run import-data', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('✅ Data imported!\n');

  console.log('🎉 Database setup complete!');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
