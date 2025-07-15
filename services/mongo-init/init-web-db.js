// This script creates a web user and a web database for MongoDB if they don't exist
// It runs automatically when the MongoDB container starts

// Connect to MongoDB as the root user
db = db.getSiblingDB('admin');

// Check if the web database exists
let webDbExists = db.getMongo().getDBNames().includes('web');

// Check if the web user exists
let webUserExists = db.getUser('web') !== null;

// If the web database doesn't exist, create it
if (!webDbExists) {
    print('Creating web database...');
    db = db.getSiblingDB('web');
    // You can add initial collections here if needed
    // db.createCollection('your_collection_name');
}

// If the web user doesn't exist, create it
if (!webUserExists) {
    print('Creating web user...');
    db = db.getSiblingDB('admin');
    db.createUser({
        user: 'web',
        pwd: process.env.MONGO_WEB_PASSWORD || 'webpassword',
        roles: [
            { role: 'readWrite', db: 'web' }
        ]
    });
    print('Web user created successfully');
}

print('MongoDB initialization completed');