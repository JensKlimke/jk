// File: /tests/whoami.controller.test.ts

import { Request, Response } from 'express';
import { WhoamiController } from '../src/controllers/whoami.controller';
import { WhoamiService, WhoamiInfo } from '../src/services/whoami.service';
import { TemplateService } from '../src/services/template.service';
import logger from '../src/utils/logger';

// Mock dependencies
jest.mock('../src/services/whoami.service');
jest.mock('../src/services/template.service');
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  default: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('WhoamiController', () => {
  let controller: WhoamiController;
  let mockWhoamiService: jest.Mocked<WhoamiService>;
  let mockTemplateService: jest.Mocked<TemplateService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  const apiId = 'test-api-id';

  const mockWhoamiInfo: WhoamiInfo = {
    hostname: 'test-host',
    ips: ['192.168.1.1', '127.0.0.1'],
    remoteAddr: '10.0.0.1:12345',
    headers: {
      'user-agent': 'test-agent',
      'host': 'example.com',
      'accept': 'application/json'
    },
    apiId
  };

  beforeEach(() => {
    // Create mocks
    mockWhoamiService = new WhoamiService() as jest.Mocked<WhoamiService>;
    mockTemplateService = new TemplateService() as jest.Mocked<TemplateService>;

    // Set up mock responses
    mockWhoamiService.getWhoamiInfo = jest.fn().mockReturnValue(mockWhoamiInfo);
    mockTemplateService.renderWhoamiInfo = jest.fn().mockResolvedValue('<html><body>Test HTML</body></html>');

    // Create controller with mocked services
    controller = new WhoamiController(mockWhoamiService, mockTemplateService, apiId);

    // Mock request and response objects
    mockRequest = {
      headers: {},
      // Use a partial mock for socket that satisfies the type checker
      socket: {
        remoteAddress: '127.0.0.1',
        remotePort: 12345
      } as any
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      type: jest.fn().mockReturnThis(),
      // Use a partial mock for req that satisfies the type checker
      req: {
        ip: '127.0.0.1',
        method: 'GET',
        path: '/'
      } as any
    };
  });

  describe('getWhoamiInfo', () => {
    it('should get info from service and send response', async () => {
      // Set up request headers
      mockRequest.headers = { 'accept': 'application/json' };

      // Call the method
      await controller.getWhoamiInfo(mockRequest as Request, mockResponse as Response);

      // Verify service was called
      expect(mockWhoamiService.getWhoamiInfo).toHaveBeenCalledWith(mockRequest, apiId);

      // Verify response was sent
      expect(mockResponse.json).toHaveBeenCalledWith(mockWhoamiInfo);
    });

    it('should handle errors properly', async () => {
      // Set up service to throw error
      const mockError = new Error('Test error');
      mockWhoamiService.getWhoamiInfo = jest.fn().mockImplementation(() => {
        throw mockError;
      });

      // Call the method
      await controller.getWhoamiInfo(mockRequest as Request, mockResponse as Response);

      // Verify error handling
      expect(logger.error).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('determineResponseType', () => {
    it('should return json for application/json accept header', () => {
      // Set up request headers
      mockRequest.headers = { 'accept': 'application/json' };

      // Access private method using type assertion
      const responseType = (controller as any).determineResponseType(mockRequest);

      // Verify result
      expect(responseType).toBe('json');
    });

    it('should return html for text/html accept header', () => {
      // Set up request headers
      mockRequest.headers = { 'accept': 'text/html' };

      // Access private method using type assertion
      const responseType = (controller as any).determineResponseType(mockRequest);

      // Verify result
      expect(responseType).toBe('html');
    });

    it('should return html for browser user agents', () => {
      // Set up request headers
      mockRequest.headers = { 'user-agent': 'Mozilla/5.0 Chrome' };

      // Access private method using type assertion
      const responseType = (controller as any).determineResponseType(mockRequest);

      // Verify result
      expect(responseType).toBe('html');
    });

    it('should return text by default', () => {
      // Set up request headers
      mockRequest.headers = { 'accept': 'text/plain' };

      // Access private method using type assertion
      const responseType = (controller as any).determineResponseType(mockRequest);

      // Verify result
      expect(responseType).toBe('text');
    });
  });

  describe('sendResponse', () => {
    it('should send JSON response', async () => {
      // Access private method using type assertion
      await (controller as any).sendResponse(mockResponse, mockWhoamiInfo, 'json');

      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith(mockWhoamiInfo);
      expect(logger.debug).toHaveBeenCalledWith('Sent JSON response');
    });

    it('should send HTML response', async () => {
      // Access private method using type assertion
      await (controller as any).sendResponse(mockResponse, mockWhoamiInfo, 'html');

      // Verify template service was called
      expect(mockTemplateService.renderWhoamiInfo).toHaveBeenCalledWith(mockWhoamiInfo);

      // Verify response
      expect(mockResponse.type).toHaveBeenCalledWith('text/html');
      expect(mockResponse.send).toHaveBeenCalledWith('<html><body>Test HTML</body></html>');
      expect(logger.debug).toHaveBeenCalledWith('Sent HTML response');
    });

    it('should send text response', async () => {
      // Spy on sendTextResponse
      const sendTextResponseSpy = jest.spyOn(controller as any, 'sendTextResponse');

      // Access private method using type assertion
      await (controller as any).sendResponse(mockResponse, mockWhoamiInfo, 'text');

      // Verify sendTextResponse was called
      expect(sendTextResponseSpy).toHaveBeenCalledWith(mockResponse, mockWhoamiInfo);
    });
  });

  describe('sendTextResponse', () => {
    it('should format and send text response', () => {
      // Access private method using type assertion
      (controller as any).sendTextResponse(mockResponse, mockWhoamiInfo);

      // Verify response
      expect(mockResponse.type).toHaveBeenCalledWith('text/plain');
      expect(mockResponse.send).toHaveBeenCalledWith(expect.stringContaining('Hostname: test-host'));
      expect(mockResponse.send).toHaveBeenCalledWith(expect.stringContaining('IPs: 192.168.1.1, 127.0.0.1'));
      expect(mockResponse.send).toHaveBeenCalledWith(expect.stringContaining('Remote Address: 10.0.0.1:12345'));
      expect(mockResponse.send).toHaveBeenCalledWith(expect.stringContaining('App ID: test-api-id'));
      expect(logger.debug).toHaveBeenCalledWith('Sent text response');
    });
  });

  describe('handleError', () => {
    it('should handle JSON error response', () => {
      // Set up request headers
      mockRequest.headers = { 'accept': 'application/json' };

      // Access private method using type assertion
      (controller as any).handleError(mockRequest, mockResponse, new Error('Test error'));

      // Verify error logging
      expect(logger.error).toHaveBeenCalled();

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });

    it('should handle HTML error response', () => {
      // Set up request headers
      mockRequest.headers = { 'accept': 'text/html' };

      // Access private method using type assertion
      (controller as any).handleError(mockRequest, mockResponse, new Error('Test error'));

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.type).toHaveBeenCalledWith('text/html');
      expect(mockResponse.send).toHaveBeenCalledWith('<h1>Internal Server Error</h1><p>Something went wrong.</p>');
    });

    it('should handle browser error response', () => {
      // Set up request headers
      mockRequest.headers = { 'user-agent': 'Mozilla/5.0' };

      // Access private method using type assertion
      (controller as any).handleError(mockRequest, mockResponse, new Error('Test error'));

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.type).toHaveBeenCalledWith('text/html');
      expect(mockResponse.send).toHaveBeenCalledWith('<h1>Internal Server Error</h1><p>Something went wrong.</p>');
    });

    it('should handle text error response', () => {
      // Set up request headers
      mockRequest.headers = { 'accept': 'text/plain' };

      // Access private method using type assertion
      (controller as any).handleError(mockRequest, mockResponse, new Error('Test error'));

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.type).toHaveBeenCalledWith('text/plain');
      expect(mockResponse.send).toHaveBeenCalledWith('Internal server error');
    });
  });
});
