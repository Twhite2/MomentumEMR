const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const API_URL = 'http://localhost:3000';
const HMO_ID = 1; // Change this to the appropriate HMO ID

const files = [
  {
    path: 'drive-download-20250926T082524Z-1-001/Reliance Tariff.xlsx',
    type: 'reliance',
    name: 'Reliance HMO'
  },
  {
    path: 'drive-download-20250926T082524Z-1-001/Leadway Provider Network.xlsx',
    type: 'leadway',
    name: 'Leadway Provider Network'
  },
  {
    path: 'drive-download-20250926T082524Z-1-001/Axa Mansard Tariff.xlsx',
    type: 'axa',
    name: 'AXA Mansard'
  }
];

async function importTariff(file) {
  const filePath = path.join(__dirname, '..', file.path);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return;
  }

  console.log(`\n📤 Importing ${file.name}...`);
  console.log(`   File: ${file.path}`);
  console.log(`   Type: ${file.type}`);

  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));
  formData.append('hmoType', file.type);

  try {
    const response = await axios.post(
      `${API_URL}/api/hmo/${HMO_ID}/tariffs/import`,
      formData,
      {
        headers: formData.getHeaders(),
      }
    );

    console.log(`✅ Success: ${response.data.message}`);
    console.log(`   Imported: ${response.data.success} tariffs`);
    console.log(`   Failed: ${response.data.failed} tariffs`);
    
    if (response.data.errors && response.data.errors.length > 0) {
      console.log(`   Errors: ${response.data.errors.length}`);
    }
  } catch (error) {
    console.error(`❌ Import failed: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

async function main() {
  console.log('========================================');
  console.log('HMO Tariff Import Script');
  console.log('========================================');
  console.log(`API URL: ${API_URL}`);
  console.log(`HMO ID: ${HMO_ID}`);

  for (const file of files) {
    await importTariff(file);
    // Wait a bit between imports
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n========================================');
  console.log('Import Complete!');
  console.log('========================================\n');
}

main().catch(console.error);
