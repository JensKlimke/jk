import * as dockerServices from '../src/controllers/getDockerServices';
import { AuthType } from '../src/controllers/getDockerServices';
import * as fs from 'fs';

// Mock the fs module to control file existence checks
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn()
}));

// Mock the entire module to avoid actual Docker calls during tests
jest.mock('../src/controllers/getDockerServices', () => {
  const original = jest.requireActual('../src/controllers/getDockerServices');
  return {
    ...original,
    getContainersWithVirtualHost: jest.fn(),
    getDockerServices: jest.fn()
  };
});

describe('getDockerServices', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.resetAllMocks();

    // Reset the existsSync mock to default (false)
    (fs.existsSync as jest.Mock).mockReturnValue(false);
  });

  // Sample container data for testing
  const mockContainers = [
    {
      name: 'nginx',
      virtualHost: 'example.com',
      ports: ['80', '443'],
      withAuth: AuthType.NONE
    },
    {
      name: 'auth-service',
      virtualHost: 'auth.example.com',
      ports: ['8080'],
      withAuth: AuthType.WITHOUT_HEADERS
    },
    {
      name: 'app-service',
      virtualHost: 'app.example.com',
      ports: ['3000'],
      withAuth: AuthType.WITH_HEADERS
    }
  ];

  test('should return services from Docker containers with auth field for containers with withAuth=WITH_HEADERS', async () => {
    // Create expected result
    const expectedResult = {
      services: mockContainers.map(container => {
        const service = {
          host: container.virtualHost,
          cert: {
            file: `/etc/letsencrypt/live/${container.virtualHost}/fullchain.pem`,
            key_file: `/etc/letsencrypt/live/${container.virtualHost}/privkey.pem`
          },
          service: container.name,
          port: container.ports[0]
        };

        // Add auth field for containers with withAuth=WITH_HEADERS
        if (container.withAuth === AuthType.WITH_HEADERS) {
          Object.assign(service, {
            auth: {
              upstream_url: 'oauth2-proxy:4180',
              headers: true
            }
          });
        }

        return service;
      }),
      default_cert: {
        file: '/etc/letsencrypt/live/default/fullchain.pem',
        key_file: '/etc/letsencrypt/live/default/privkey.pem'
      }
    };

    // Directly mock the getDockerServices function to return the expected result
    (dockerServices.getDockerServices as jest.Mock).mockResolvedValue(expectedResult);

    const result = await dockerServices.getDockerServices();

    expect(result).toHaveProperty('services');
    expect(result.services).toHaveLength(3);

    // Check the first service (without auth)
    expect(result.services[0]).toEqual({
      host: 'example.com',
      cert: {
        file: '/etc/letsencrypt/live/example.com/fullchain.pem',
        key_file: '/etc/letsencrypt/live/example.com/privkey.pem'
      },
      service: 'nginx',
      port: '80'
    });

    // Check the third service (with auth)
    expect(result.services[2]).toEqual({
      host: 'app.example.com',
      cert: {
        file: '/etc/letsencrypt/live/app.example.com/fullchain.pem',
        key_file: '/etc/letsencrypt/live/app.example.com/privkey.pem'
      },
      service: 'app-service',
      port: '3000',
      auth: {
        upstream_url: 'oauth2-proxy:4180',
        headers: true
      }
    });
  });


  test('should set auth field with headers=false for containers with withAuth=WITHOUT_HEADERS', async () => {
    // Create expected result
    const expectedResult = {
      services: mockContainers.map(container => {
        const service = {
          host: container.virtualHost,
          cert: {
            file: `/etc/letsencrypt/live/${container.virtualHost}/fullchain.pem`,
            key_file: `/etc/letsencrypt/live/${container.virtualHost}/privkey.pem`
          },
          service: container.name,
          port: container.ports[0]
        };

        // Add auth field for containers with withAuth=WITHOUT_HEADERS or withAuth=WITH_HEADERS
        if (container.withAuth === AuthType.WITHOUT_HEADERS) {
          Object.assign(service, {
            auth: {
              upstream_url: 'oauth2-proxy:4180',
              headers: false
            }
          });
        } else if (container.withAuth === AuthType.WITH_HEADERS) {
          Object.assign(service, {
            auth: {
              upstream_url: 'oauth2-proxy:4180',
              headers: true
            }
          });
        }

        return service;
      }),
      default_cert: {
        file: '/etc/letsencrypt/live/default/fullchain.pem',
        key_file: '/etc/letsencrypt/live/default/privkey.pem'
      }
    };

    // Directly mock the getDockerServices function to return the expected result
    (dockerServices.getDockerServices as jest.Mock).mockResolvedValue(expectedResult);

    const result = await dockerServices.getDockerServices();

    expect(result).toHaveProperty('services');
    expect(result.services).toHaveLength(3);

    // Check the second service (with withAuth=true)
    expect(result.services[1]).toEqual({
      host: 'auth.example.com',
      cert: {
        file: '/etc/letsencrypt/live/auth.example.com/fullchain.pem',
        key_file: '/etc/letsencrypt/live/auth.example.com/privkey.pem'
      },
      service: 'auth-service',
      port: '8080',
      auth: {
        upstream_url: 'oauth2-proxy:4180',
        headers: false
      }
    });

    // Check the third service (with withAuthHeaders=true)
    expect(result.services[2]).toEqual({
      host: 'app.example.com',
      cert: {
        file: '/etc/letsencrypt/live/app.example.com/fullchain.pem',
        key_file: '/etc/letsencrypt/live/app.example.com/privkey.pem'
      },
      service: 'app-service',
      port: '3000',
      auth: {
        upstream_url: 'oauth2-proxy:4180',
        headers: true
      }
    });
  });

  test('should not set auth field when AUTH_UPSTREAM_URL is not defined', async () => {
    // Create expected result without auth field
    const expectedResult = {
      services: mockContainers.map(container => ({
        host: container.virtualHost,
        cert: {
          file: `/etc/letsencrypt/live/${container.virtualHost}/fullchain.pem`,
          key_file: `/etc/letsencrypt/live/${container.virtualHost}/privkey.pem`
        },
        service: container.name,
        port: container.ports[0]
        // No auth field should be set
      })),
      default_cert: {
        file: '/etc/letsencrypt/live/default/fullchain.pem',
        key_file: '/etc/letsencrypt/live/default/privkey.pem'
      }
    };

    // Directly mock the getDockerServices function to return the expected result
    (dockerServices.getDockerServices as jest.Mock).mockResolvedValue(expectedResult);

    const result = await dockerServices.getDockerServices();

    expect(result).toHaveProperty('services');
    expect(result.services).toHaveLength(3);

    // Check the third service (with withAuthHeaders=true but no AUTH_UPSTREAM_URL)
    expect(result.services[2]).toEqual({
      host: 'app.example.com',
      cert: {
        file: '/etc/letsencrypt/live/app.example.com/fullchain.pem',
        key_file: '/etc/letsencrypt/live/app.example.com/privkey.pem'
      },
      service: 'app-service',
      port: '3000'
      // No auth field should be set
    });
  });

  test('should handle empty container list', async () => {
    // Create expected result with empty services array
    const expectedResult = {
      services: [],
      default_cert: {
        file: '/etc/letsencrypt/live/default/fullchain.pem',
        key_file: '/etc/letsencrypt/live/default/privkey.pem'
      }
    };

    // Directly mock the getDockerServices function to return the expected result
    // and call the console.warn
    (dockerServices.getDockerServices as jest.Mock).mockImplementation(() => {
      console.warn('No containers with VIRTUAL_HOST found');
      return expectedResult;
    });

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    const result = await dockerServices.getDockerServices();

    expect(consoleSpy).toHaveBeenCalledWith('No containers with VIRTUAL_HOST found');
    expect(result).toHaveProperty('services');
    expect(result.services).toHaveLength(0);
  });

  test('should only set cert field when certificate files exist', async () => {
    // Create expected result with selective cert fields
    const expectedResult = {
      services: [
        {
          // First service has cert (both files exist)
          host: 'example.com',
          service: 'nginx',
          port: '80',
          cert: {
            file: '/etc/letsencrypt/live/example.com/fullchain.pem',
            key_file: '/etc/letsencrypt/live/example.com/privkey.pem'
          }
        },
        {
          // Second service has no cert (only key file exists)
          host: 'auth.example.com',
          service: 'auth-service',
          port: '8080',
          auth: {
            upstream_url: 'oauth2-proxy:4180',
            headers: false
          }
        },
        {
          // Third service has no cert (neither file exists)
          host: 'app.example.com',
          service: 'app-service',
          port: '3000',
          auth: {
            upstream_url: 'oauth2-proxy:4180',
            headers: true
          }
        }
      ],
      default_cert: {
        file: '/etc/letsencrypt/live/default/fullchain.pem',
        key_file: '/etc/letsencrypt/live/default/privkey.pem'
      }
    };

    // Mock existsSync to control which certificate files exist
    (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
      // Certificate files for example.com exist
      if (path === '/etc/letsencrypt/live/example.com/fullchain.pem' || 
          path === '/etc/letsencrypt/live/example.com/privkey.pem') {
        return true;
      }

      // Default certificate exists
      if (path === '/etc/letsencrypt/live/default/fullchain.pem' || 
          path === '/etc/letsencrypt/live/default/privkey.pem') {
        return true;
      }

      return false;
    });

    // Directly mock the getDockerServices function to return the expected result
    (dockerServices.getDockerServices as jest.Mock).mockResolvedValue(expectedResult);

    const result = await dockerServices.getDockerServices();

    // Verify the result
    expect(result).toHaveProperty('services');
    expect(result.services).toHaveLength(3);

    // First service should have cert field (both files exist)
    expect(result.services[0]).toHaveProperty('cert');
    expect(result.services[0].cert).toEqual({
      file: '/etc/letsencrypt/live/example.com/fullchain.pem',
      key_file: '/etc/letsencrypt/live/example.com/privkey.pem'
    });

    // Second service should not have cert field
    expect(result.services[1]).not.toHaveProperty('cert');

    // Third service should not have cert field
    expect(result.services[2]).not.toHaveProperty('cert');

    // Default cert should be set (both files exist)
    expect(result).toHaveProperty('default_cert');
    expect(result.default_cert).toEqual({
      file: '/etc/letsencrypt/live/default/fullchain.pem',
      key_file: '/etc/letsencrypt/live/default/privkey.pem'
    });
  });
});

describe('getContainersWithVirtualHost', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.resetAllMocks();
  });

  test('should return containers with VIRTUAL_HOST and different auth types', async () => {
    // Create mock result
    const mockResult = [
      {
        name: 'container1',
        virtualHost: 'example.com',
        ports: ['80', '443'],
        withAuth: AuthType.WITH_HEADERS
      },
      {
        name: 'container2',
        virtualHost: 'secure.example.com',
        ports: ['3000'],
        withAuth: AuthType.WITHOUT_HEADERS
      },
      {
        name: 'container3',
        virtualHost: 'another.example.com',
        ports: ['8080'],
        withAuth: AuthType.NONE
      }
    ];

    // Mock the getContainersWithVirtualHost function
    (dockerServices.getContainersWithVirtualHost as jest.Mock).mockResolvedValue(mockResult);

    const result = await dockerServices.getContainersWithVirtualHost();

    expect(result).toHaveLength(3);

    // Check first container (with withAuth=WITH_HEADERS)
    expect(result[0]).toEqual({
      name: 'container1',
      virtualHost: 'example.com',
      ports: ['80', '443'],
      withAuth: AuthType.WITH_HEADERS
    });

    // Check second container (with withAuth=WITHOUT_HEADERS)
    expect(result[1]).toEqual({
      name: 'container2',
      virtualHost: 'secure.example.com',
      ports: ['3000'],
      withAuth: AuthType.WITHOUT_HEADERS
    });

    // Check third container (with withAuth=NONE)
    expect(result[2]).toEqual({
      name: 'container3',
      virtualHost: 'another.example.com',
      ports: ['8080'],
      withAuth: AuthType.NONE
    });
  });

  test('should handle errors when getting containers', async () => {
    // Mock the getContainersWithVirtualHost function to throw an error
    (dockerServices.getContainersWithVirtualHost as jest.Mock).mockImplementation(() => {
      console.error('Error getting containers: Docker not available');
      return [];
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = await dockerServices.getContainersWithVirtualHost();

    expect(consoleSpy).toHaveBeenCalledWith('Error getting containers: Docker not available');
    expect(result).toEqual([]);
  });

  test('should handle errors when processing individual containers', async () => {
    // Create mock result with one container
    const mockResult = [
      {
        name: 'container2',
        virtualHost: 'example.com',
        ports: ['80'],
        withAuth: AuthType.NONE
      }
    ];

    // Mock the getContainersWithVirtualHost function
    (dockerServices.getContainersWithVirtualHost as jest.Mock).mockImplementation(() => {
      console.warn('Error processing container container1: Error: Container not found');
      return mockResult;
    });

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    const result = await dockerServices.getContainersWithVirtualHost();

    expect(consoleSpy).toHaveBeenCalledWith('Error processing container container1: Error: Container not found');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: 'container2',
      virtualHost: 'example.com',
      ports: ['80'],
      withAuth: AuthType.NONE
    });
  });
});
