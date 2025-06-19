/**
 * Class representing Docker container information
 */
export class Container {
  private _id: string;
  private _name: string;
  private _image: string;
  private _status: string;
  private _created: string;
  private _ports: string;
  private _env: Record<string, string>;

  /**
   * Create a new DockerContainer instance
   * @param id Container ID
   * @param name Container name
   * @param image Container image
   * @param status Container status
   * @param created Container creation time
   * @param ports Container ports
   * @param env Container environment variables
   */
  constructor(
    id: string,
    name: string,
    image: string,
    status: string,
    created: string,
    ports: string,
    env: Record<string, string>
  ) {
    this._id = id;
    this._name = name;
    this._image = image;
    this._status = status;
    this._created = created;
    this._ports = ports;
    this._env = env;
  }

  /**
   * Get the first exposed port from the ports string
   * @returns The first exposed port or null if no ports are exposed
   */
  getFirstExposedPort(): number | null {
    if (!this._ports) {
      return null;
    }

    // Docker ports format is typically like: "0.0.0.0:8080->80/tcp, 0.0.0.0:8443->443/tcp"
    // We need to extract the first host port (e.g., 8080)
    const portMappings = this._ports.split(',');
    if (portMappings.length === 0) {
      return null;
    }

    // Try to extract the host port from the first mapping
    const firstMapping = portMappings[0].trim();

    // Match patterns like "0.0.0.0:8080->80/tcp" or "8080:80/tcp" or "8080-80/tcp"
    const match = firstMapping.match(/(0\.0\.0\.0:)?(\d+)[-:>]+\d+/);

    if (match && match.length >= 3) {
      // Return the host port (second captured group)
      return parseInt(match[2], 10);
    }

    // Handle the case where the port is directly exposed without mapping (e.g., "3000/tcp")
    const directPortMatch = firstMapping.match(/^(\d+)\/\w+$/);
    if (directPortMatch && directPortMatch.length >= 2) {
      return parseInt(directPortMatch[1], 10);
    }

    return null;
  }

  /**
   * Get container ID
   */
  get id(): string {
    return this._id;
  }

  /**
   * Get container name
   */
  get name(): string {
    return this._name;
  }

  /**
   * Get container image
   */
  get image(): string {
    return this._image;
  }

  /**
   * Get container status
   */
  get status(): string {
    return this._status;
  }

  /**
   * Get container creation time
   */
  get created(): string {
    return this._created;
  }

  /**
   * Get container ports
   */
  get ports(): string {
    return this._ports;
  }

  /**
   * Get container environment variables
   */
  get env(): Record<string, string> {
    return this._env;
  }
}
