const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

const defaultData = {
  categories: [],
  products: [],
  tables: [],
  orders: [],
  orderItems: [],
  payments: []
};

function loadDB() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('DB load error:', e.message);
  }
  return JSON.parse(JSON.stringify(defaultData));
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// Initialize DB file if it doesn't exist
if (!fs.existsSync(DB_PATH)) {
  saveDB(defaultData);
}

module.exports = { loadDB, saveDB };
