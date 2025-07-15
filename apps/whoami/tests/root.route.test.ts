import express, { Express } from 'express';
import request from 'supertest';
import { WhoamiService } from '../src/services/whoami.service';
import { TemplateService } from '../src/services/template.service';
import { createRootRouter } from '../src/routes/root.route';

// Mock the services
jest.mock('../src/services/whoami.service');
jest.mock('../src/services/template.service');

describe('Root Router', () => {
  let app: Express;
  let mockWhoamiService: jest.Mocked<WhoamiService>;
  let mockTemplateService: jest.Mocked<TemplateService>;
  const apiId = 'test-api-id';
  
  beforeEach(() => {
    // Create mocks
    mockWhoamiService = new WhoamiService() as jest.Mocked<WhoamiService>;
    mockTemplateService = new TemplateService() as jest.Mocked<TemplateService>;
    
    // Set up mock responses
    mockWhoamiService.getWhoamiInfo.mockReturnValue({
      hostname: 'test-host',
      ips: ['192.168.1.1', '127.0.0.1'],
      remoteAddr: '10.0.0.1:12345',
      headers: {
        'user-agent': 'test-agent',
        'host': 'example.com'
      },
      apiId
    });
    
    mockTemplateService.renderWhoamiInfo.mockResolvedValue('<html><body>Test HTML</body></html>');
    
    // Create Express app
    app = express();
    app.use('/', createRootRouter(mockWhoamiService, mockTemplateService, apiId));
  });
  
  it('should return JSON when Accept header is application/json', async () => {
    const response = await request(app)
      .get('/')
      .set('Accept', 'application/json');
    
    expect(response.status).toBe(200);
    expect(response.type).toBe('application/json');
    expect(response.body).toEqual({
      hostname: 'test-host',
      ips: ['192.168.1.1', '127.0.0.1'],
      remoteAddr: '10.0.0.1:12345',
      headers: {
        'user-agent': 'test-agent',
        'host': 'example.com'
      },
      apiId
    });
    expect(mockWhoamiService.getWhoamiInfo).toHaveBeenCalled();
    expect(mockTemplateService.renderWhoamiInfo).not.toHaveBeenCalled();
  });
  
  it('should return HTML when Accept header is text/html', async () => {
    const response = await request(app)
      .get('/')
      .set('Accept', 'text/html');
    
    expect(response.status).toBe(200);
    expect(response.type).toBe('text/html');
    expect(response.text).toBe('<html><body>Test HTML</body></html>');
    expect(mockWhoamiService.getWhoamiInfo).toHaveBeenCalled();
    expect(mockTemplateService.renderWhoamiInfo).toHaveBeenCalled();
  });
  
  it('should return HTML when User-Agent indicates a browser', async () => {
    const response = await request(app)
      .get('/')
      .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    expect(response.status).toBe(200);
    expect(response.type).toBe('text/html');
    expect(response.text).toBe('<html><body>Test HTML</body></html>');
    expect(mockWhoamiService.getWhoamiInfo).toHaveBeenCalled();
    expect(mockTemplateService.renderWhoamiInfo).toHaveBeenCalled();
  });
  
  it('should return plain text by default', async () => {
    const response = await request(app)
      .get('/');
    
    expect(response.status).toBe(200);
    expect(response.type).toBe('text/plain');
    expect(response.text).toContain('Hostname: test-host');
    expect(response.text).toContain('IPs: 192.168.1.1, 127.0.0.1');
    expect(response.text).toContain('Remote Address: 10.0.0.1:12345');
    expect(response.text).toContain('App ID: test-api-id');
    expect(mockWhoamiService.getWhoamiInfo).toHaveBeenCalled();
    expect(mockTemplateService.renderWhoamiInfo).not.toHaveBeenCalled();
  });
  
  it('should handle errors and return appropriate error response', async () => {
    // Mock getWhoamiInfo to throw an error
    mockWhoamiService.getWhoamiInfo.mockImplementation(() => {
      throw new Error('Test error');
    });
    
    // Test JSON error response
    const jsonResponse = await request(app)
      .get('/')
      .set('Accept', 'application/json');
    
    expect(jsonResponse.status).toBe(500);
    expect(jsonResponse.type).toBe('application/json');
    expect(jsonResponse.body).toEqual({ error: 'Internal server error' });
    
    // Test HTML error response
    const htmlResponse = await request(app)
      .get('/')
      .set('Accept', 'text/html');
    
    expect(htmlResponse.status).toBe(500);
    expect(htmlResponse.type).toBe('text/html');
    expect(htmlResponse.text).toContain('Internal Server Error');
    
    // Test plain text error response
    const textResponse = await request(app)
      .get('/')
      .set('Accept', 'text/plain');
    
    expect(textResponse.status).toBe(500);
    expect(textResponse.type).toBe('text/plain');
    expect(textResponse.text).toBe('Internal server error');
  });
});