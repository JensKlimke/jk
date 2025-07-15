import { Request } from 'express';
import { WhoamiService } from '../src/services/whoami.service';

describe('WhoamiService', () => {
  let whoamiService: WhoamiService;
  
  beforeEach(() => {
    whoamiService = new WhoamiService();
    process.env.HOSTNAME = 'test-hostname';
  });
  
  afterEach(() => {
    delete process.env.HOSTNAME;
  });
  
  it('should return correct whoami info', () => {
    // Mock request object
    const mockRequest = {
      method: 'GET',
      url: '/',
      httpVersion: '1.1',
      headers: {
        'host': 'whoami.example.com',
        'user-agent': 'test-agent',
        'accept': 'application/json',
        'x-forwarded-for': '192.168.1.1'
      },
      socket: {
        remoteAddress: '127.0.0.1',
        remotePort: 12345
      }
    } as unknown as Request;
    
    const apiId = 'test-app-id';
    
    // Get whoami info
    const whoamiInfo = whoamiService.getWhoamiInfo(mockRequest, apiId);
    
    // Verify the result
    expect(whoamiInfo).toHaveProperty('hostname', 'test-hostname');
    expect(whoamiInfo).toHaveProperty('ips');
    expect(Array.isArray(whoamiInfo.ips)).toBe(true);
    expect(whoamiInfo).toHaveProperty('remoteAddr', '192.168.1.1:12345');
    expect(whoamiInfo).toHaveProperty('headers');
    expect(whoamiInfo.headers).toHaveProperty('host', 'whoami.example.com');
    expect(whoamiInfo.headers).toHaveProperty('user-agent', 'test-agent');
    expect(whoamiInfo.headers).toHaveProperty('accept', 'application/json');
    expect(whoamiInfo.headers).toHaveProperty('method', 'GET');
    expect(whoamiInfo.headers).toHaveProperty('url', '/');
    expect(whoamiInfo.headers).toHaveProperty('httpVersion', '1.1');
    expect(whoamiInfo).toHaveProperty('apiId', 'test-app-id');
  });
  
  it('should handle request without x-forwarded-for header', () => {
    // Mock request object without x-forwarded-for
    const mockRequest = {
      method: 'GET',
      url: '/',
      httpVersion: '1.1',
      headers: {
        'host': 'whoami.example.com'
      },
      socket: {
        remoteAddress: '127.0.0.1',
        remotePort: 12345
      }
    } as unknown as Request;
    
    const apiId = 'test-app-id';
    
    // Get whoami info
    const whoamiInfo = whoamiService.getWhoamiInfo(mockRequest, apiId);
    
    // Verify the result
    expect(whoamiInfo).toHaveProperty('remoteAddr', '127.0.0.1:12345');
  });
});