const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    const dbName = process.env.DATABASE_NAME || 'threespeak';
    const fullURI = mongoURI.endsWith('/') ? `${mongoURI}${dbName}` : `${mongoURI}/${dbName}`;
    
    console.log(`Connecting to MongoDB...`);
    console.log(`  Database: ${dbName}`);
    console.log(`  Host: ${mongoURI.split('@')[1]?.split('/')[0] || 'localhost'}`);
    
    await mongoose.connect(fullURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log(`  Connected to database: ${mongoose.connection.name}`);
    console.log(`  Collections available: ${(await mongoose.connection.db.listCollections().toArray()).length}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
