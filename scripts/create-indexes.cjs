const mongoose = require('mongoose');

const MONGODB_URI =
  'mongodb+srv://kuldeeppatidar9091_db_user:jUmT7kQZlsHJgcdB@meal-harvest.wqrohzx.mongodb.net/food_rescue?retryWrites=true&w=majority';

async function createIndex() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  const db = mongoose.connection.db;

  // Create 2dsphere index on needrequests collection
  const result = await db.collection('needrequests').createIndex({ location: '2dsphere' });
  console.log('Created 2dsphere index on needrequests:', result);

  // Also ensure donations index exists
  const result2 = await db.collection('donations').createIndex({ location: '2dsphere' });
  console.log('Created/confirmed 2dsphere index on donations:', result2);

  process.exit(0);
}

createIndex().catch((err) => {
  console.error('Index creation failed:', err.message);
  process.exit(1);
});
