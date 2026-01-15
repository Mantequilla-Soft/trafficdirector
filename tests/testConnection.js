require('dotenv').config();
const mongoose = require('mongoose');

const testConnection = async () => {
  console.log('=================================================');
  console.log('🔍 Testing MongoDB Connection');
  console.log('=================================================\n');

  // Display connection details (masking password)
  const mongoURI = process.env.MONGODB_URI;
  const dbName = process.env.DATABASE_NAME;
  const collection = process.env.DATABASE_COLLECTION;
  
  const maskedURI = mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
  
  console.log('📋 Configuration:');
  console.log(`   Database Name: ${dbName}`);
  console.log(`   Collection: ${collection}`);
  console.log(`   Connection URI: ${maskedURI}`);
  console.log('');

  try {
    console.log('⏳ Attempting to connect to MongoDB...\n');
    
    const fullURI = `${mongoURI}${dbName}`;
    
    await mongoose.connect(fullURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ SUCCESS: MongoDB connection established!');
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Port: ${mongoose.connection.port}`);
    console.log('');

    // Test collection access
    console.log('🔍 Testing collection access...');
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    
    console.log(`   Found ${collections.length} collection(s):`);
    collectionNames.forEach(name => {
      const marker = name === collection ? '✓' : ' ';
      console.log(`   ${marker} ${name}`);
    });
    
    if (collectionNames.includes(collection)) {
      console.log(`\n✅ Target collection "${collection}" exists!`);
      
      // Count documents in the collection
      const count = await db.collection(collection).countDocuments();
      console.log(`   Document count: ${count}`);
    } else {
      console.log(`\n⚠️  Target collection "${collection}" not found (will be created on first insert)`);
    }

    console.log('\n=================================================');
    console.log('✅ Connection test completed successfully!');
    console.log('=================================================\n');

  } catch (error) {
    console.error('\n❌ FAILED: MongoDB connection error!');
    console.error('=================================================');
    console.error('Error details:');
    console.error(`   Message: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    console.error('=================================================\n');
    process.exit(1);
  } finally {
    // Close connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔒 Connection closed.\n');
    }
  }
};

// Run the test
testConnection();
