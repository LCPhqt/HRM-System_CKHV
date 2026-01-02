const mongoose = require('mongoose');

// Setup test database connection
beforeAll(async () => {
  const uri = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/hrm_identity_test';
  await mongoose.connect(uri);
});

// Clean up after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Close database connection after all tests
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

