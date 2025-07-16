import { Request } from 'express';
import { networkInterfaces } from 'os';
import { WhoamiService } from '../src/services/whoami.service';

// Mock os.networkInterfaces
jest.mock('os', () => ({
  networkInterfaces: jest.fn()
}));

describe('WhoamiService', () => {
  let whoamiService: WhoamiService;

  beforeEach(() => {
    whoamiService = new WhoamiService();
    process.env.HOSTNAME = 'test-hostname';

    // Mock networkInterfaces to return some test data
    (networkInterfaces as jest.Mock).mockReturnValue({
      lo: [
        {
          address: '127.0.0.1',
          netmask: '255.0.0.0',
          family: 'IPv4',
          mac: '00:00:00:00:00:00',
          internal: true,
          cidr: '127.0.0.1/8'
        }
      ],
      eth0: [
        {
          address: '192.168.1.100',
          netmask: '255.255.255.0',
          family: 'IPv4',
          mac: '00:11:22:33:44:55',
          internal: false,
          cidr: '192.168.1.100/24'
        }
      ]
    });
  });

  afterEach(() => {
    delete process.env.HOSTNAME;
    jest.clearAllMocks();
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

  it('should use "unknown" as hostname when HOSTNAME env var is not set', () => {
    // Remove HOSTNAME environment variable
    delete process.env.HOSTNAME;

    // Mock request object
    const mockRequest = {
      method: 'GET',
      url: '/',
      headers: {},
      socket: {
        remoteAddress: '127.0.0.1',
        remotePort: 12345
      }
    } as unknown as Request;

    // Get whoami info
    const whoamiInfo = whoamiService.getWhoamiInfo(mockRequest, 'test-id');

    // Verify the hostname is "unknown"
    expect(whoamiInfo).toHaveProperty('hostname', 'unknown');
  });

  it('should handle errors when getting IP addresses', () => {
    // Mock networkInterfaces to throw an error
    (networkInterfaces as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Network interfaces error');
    });

    // Mock request object
    const mockRequest = {
      method: 'GET',
      url: '/',
      headers: {},
      socket: {
        remoteAddress: '127.0.0.1',
        remotePort: 12345
      }
    } as unknown as Request;

    // Get whoami info
    const whoamiInfo = whoamiService.getWhoamiInfo(mockRequest, 'test-id');

    // Verify the IPs array contains only "unknown"
    expect(whoamiInfo.ips).toEqual(['unknown']);
  });

  it('should handle undefined remotePort', () => {
    // Mock request object with undefined remotePort
    const mockRequest = {
      method: 'GET',
      url: '/',
      headers: {
        'x-forwarded-for': '192.168.1.1'
      },
      socket: {
        remoteAddress: '127.0.0.1',
        remotePort: undefined
      }
    } as unknown as Request;

    // Get whoami info
    const whoamiInfo = whoamiService.getWhoamiInfo(mockRequest, 'test-id');

    // Verify the remoteAddr has "unknown" port
    expect(whoamiInfo).toHaveProperty('remoteAddr', '192.168.1.1:unknown');
  });

  it('should handle undefined remoteAddress', () => {
    // Mock request object with undefined remoteAddress
    const mockRequest = {
      method: 'GET',
      url: '/',
      headers: {},
      socket: {
        remoteAddress: undefined,
        remotePort: 12345
      }
    } as unknown as Request;

    // Get whoami info
    const whoamiInfo = whoamiService.getWhoamiInfo(mockRequest, 'test-id');

    // Verify the remoteAddr has "unknown" address
    expect(whoamiInfo).toHaveProperty('remoteAddr', 'unknown:12345');
  });

  it('should handle both undefined remoteAddress and remotePort', () => {
    // Mock request object with undefined remoteAddress and remotePort
    const mockRequest = {
      method: 'GET',
      url: '/',
      headers: {},
      socket: {
        remoteAddress: undefined,
        remotePort: undefined
      }
    } as unknown as Request;

    // Get whoami info
    const whoamiInfo = whoamiService.getWhoamiInfo(mockRequest, 'test-id');

    // Verify the remoteAddr has "unknown" for both address and port
    expect(whoamiInfo).toHaveProperty('remoteAddr', 'unknown:unknown');
  });
});
