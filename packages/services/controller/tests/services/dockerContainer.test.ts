import { Container } from '../../src/services/container';

describe('DockerContainer', () => {
  describe('getFirstExposedPort', () => {
    it('should return the first exposed port from a ports string', () => {
      const container = new Container(
        'abc123',
        'test-container',
        'test-image',
        'running',
        '2023-06-15 10:30:45',
        '0.0.0.0:8080->80/tcp, 0.0.0.0:8443->443/tcp',
        {}
      );

      expect(container.getFirstExposedPort()).toBe(8080);
    });

    it('should return null when ports string is empty', () => {
      const container = new Container(
        'abc123',
        'test-container',
        'test-image',
        'running',
        '2023-06-15 10:30:45',
        '',
        {}
      );

      expect(container.getFirstExposedPort()).toBeNull();
    });

    it('should extract port from direct port format like "80/tcp"', () => {
      const container = new Container(
        'abc123',
        'test-container',
        'test-image',
        'running',
        '2023-06-15 10:30:45',
        '80/tcp',
        {}
      );

      expect(container.getFirstExposedPort()).toBe(80);
    });

    it('should handle different port mapping formats', () => {
      const container1 = new Container(
        'abc123',
        'test-container',
        'test-image',
        'running',
        '2023-06-15 10:30:45',
        '0.0.0.0:8080->80/tcp',
        {}
      );

      const container2 = new Container(
        'def456',
        'test-container-2',
        'test-image',
        'running',
        '2023-06-15 10:30:45',
        '8080:80/tcp',
        {}
      );

      const container3 = new Container(
        'ghi789',
        'test-container-3',
        'test-image',
        'running',
        '2023-06-15 10:30:45',
        '8080-80/tcp',
        {}
      );

      expect(container1.getFirstExposedPort()).toBe(8080);
      expect(container2.getFirstExposedPort()).toBe(8080);
      expect(container3.getFirstExposedPort()).toBe(8080);
    });

    it('should handle the specific format "3000/tcp"', () => {
      const container = new Container(
        'jkl012',
        'test-container-4',
        'test-image',
        'running',
        '2023-06-15 10:30:45',
        '3000/tcp',
        {}
      );

      expect(container.getFirstExposedPort()).toBe(3000);
    });
  });
});
