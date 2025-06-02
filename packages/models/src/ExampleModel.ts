/**
 * Example model representing a simple data structure
 * This will be used by both the API and frontend
 */
export interface ExampleModel {
  /** Unique identifier for the example */
  id: string;

  /** Name of the example */
  name: string;

  /** Description of the example */
  description: string;

  /** Creation timestamp */
  createdAt: Date;
}
