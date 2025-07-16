import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app, { startServer, stopServer } from '../src/index';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Create MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Override the MONGO_URI environment variable
  process.env.MONGO_URI = uri;
  process.env.DB_NAME = 'test-finance';

  // Connect to the in-memory database
  await mongoose.connect(uri);
}, 10000); // Increase timeout to 10 seconds

afterAll(async () => {
  // Disconnect and stop MongoDB Memory Server
  await stopServer();
  await mongoose.disconnect();
  await mongoServer.stop();
}, 10000); // Increase timeout to 10 seconds

describe('Express App', () => {
  it('should respond with welcome message on root route', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('Welcome to Finance API');
  });

  it('should respond with UP status on health check', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
    expect(response.body.status).toBe('UP');
  });

  it('should handle non-existent routes', async () => {
    const response = await request(app).get('/non-existent-route');
    expect(response.status).toBe(404);
  });
});
