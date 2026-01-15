require('dotenv').config();
const mongoose = require('mongoose');

// Define schema inline for the test
const hotNodeSchema = new mongoose.Schema({
  owner: { type: String, required: true, index: true },
  name: { type: String, required: true },
  ip: { type: String, required: true },
  url: { type: String, required: true },
  comments: { type: String, default: '' },
  lastUsed: { type: Date, default: Date.now },
  enabled: { type: Boolean, default: true }
}, { timestamps: true });

const HotNode = mongoose.model('HotNode', hotNodeSchema, '3speak-hot-nodes');

const addHotNode = async (nodeData) => {
  console.log('=================================================');
  console.log('📝 Adding Hot Node to Database');
  console.log('=================================================\n');

  const mongoURI = process.env.MONGODB_URI;
  const dbName = process.env.DATABASE_NAME;
  const collection = process.env.DATABASE_COLLECTION;

  try {
    console.log('⏳ Connecting to MongoDB...\n');
    const fullURI = `${mongoURI}${dbName}`;
    await mongoose.connect(fullURI);

    console.log('✅ Connected to database:', dbName);
    console.log('   Collection:', collection);
    console.log('');

    console.log('📋 Node data to insert:');
    console.log(`   Owner: ${nodeData.owner}`);
    console.log(`   Name: ${nodeData.name}`);
    console.log(`   IP: ${nodeData.ip}`);
    console.log(`   URL: ${nodeData.url}`);
    console.log(`   Comments: ${nodeData.comments}`);
    console.log(`   Enabled: ${nodeData.enabled}`);
    console.log(`   Last Used: ${nodeData.lastUsed}`);
    console.log('');

    // Check if node already exists
    const existing = await HotNode.findOne({ owner: nodeData.owner });
    if (existing) {
      console.log(`⚠️  Node with owner "${nodeData.owner}" already exists!`);
      console.log('   Updating existing node...\n');
      
      Object.assign(existing, nodeData);
      await existing.save();
      
      console.log('✅ Node updated successfully!');
      console.log(`   ID: ${existing._id}`);
    } else {
      console.log('⏳ Inserting new node...\n');
      
      const newNode = await HotNode.create(nodeData);
      
      console.log('✅ Node added successfully!');
      console.log(`   ID: ${newNode._id}`);
      console.log(`   Created at: ${newNode.createdAt}`);
    }

    console.log('\n=================================================');
    console.log('✅ Operation completed successfully!');
    console.log('=================================================\n');

  } catch (error) {
    console.error('\n❌ FAILED: Error adding node!');
    console.error('=================================================');
    console.error('Error details:');
    console.error(`   Message: ${error.message}`);
    if (error.errors) {
      Object.keys(error.errors).forEach(key => {
        console.error(`   ${key}: ${error.errors[key].message}`);
      });
    }
    console.error('=================================================\n');
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔒 Connection closed.\n');
    }
  }
};

// Default node data - can be modified or passed as arguments
const defaultNodeData = {
  owner: 'eddiespino',
  name: 'eddie-3speak',
  ip: '15.204.229.29',
  url: 'eddie.3speak.tv',
  comments: "Eddie's 3Speak Infra server",
  lastUsed: new Date(),
  enabled: true
};

// Run with default data or custom data passed as JSON string
// Usage: node tests/addHotNode.js '{"owner":"test","name":"test-node","ip":"1.2.3.4","url":"test.com","comments":"test","enabled":true}'
const nodeData = process.argv[2] ? JSON.parse(process.argv[2]) : defaultNodeData;
nodeData.lastUsed = nodeData.lastUsed || new Date();

addHotNode(nodeData);
