const mongoose = require('mongoose');

// Setup test database connection
beforeAll(async () => {
  const uri = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/hrm_identity_test';
  
  // Close any existing connections first
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  
  // Connect with options to ensure connection
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    
    // Wait for connection to be ready
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('MongoDB connection timeout'));
        }, 10000);
        
        mongoose.connection.once('connected', () => {
          clearTimeout(timeout);
          resolve();
        });
        
        mongoose.connection.once('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    }
    
    // Verify connection by pinging the database and waiting a bit more
    await mongoose.connection.db.admin().ping();
    
    // Wait a bit more to ensure connection is fully established
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify connection state one more time
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB connection not ready after ping');
    }
    
    console.log('MongoDB connected successfully for tests');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    throw error;
  }
}, 30000); // Increase timeout for beforeAll

// Clean up after each test
afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      try {
        await collections[key].deleteMany({});
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
  }
});

// Close database connection after all tests
afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    try {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    } catch (error) {
      // Ignore errors during cleanup
    }
  }
}, 30000); // Increase timeout for afterAll

