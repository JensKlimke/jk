/**
 * Tests for the ExampleModel interface
 * 
 * These tests verify that objects conforming to the ExampleModel interface
 * can be created and used correctly.
 */
import { ExampleModel } from '../ExampleModel';

describe('ExampleModel', () => {
  /**
   * Test case for creating an ExampleModel object
   * 
   * This test verifies that an object conforming to the ExampleModel interface
   * can be created with all required properties.
   */
  it('should create an object with all required properties', () => {
    // Create an example object
    const example: ExampleModel = {
      id: '123',
      name: 'Test Example',
      description: 'This is a test example',
      createdAt: new Date('2023-01-01'),
    };

    // Verify that the object has all required properties
    expect(example).toHaveProperty('id', '123');
    expect(example).toHaveProperty('name', 'Test Example');
    expect(example).toHaveProperty('description', 'This is a test example');
    expect(example.createdAt).toBeInstanceOf(Date);
    expect(example.createdAt.toISOString()).toBe('2023-01-01T00:00:00.000Z');
  });

  /**
   * Test case for using an ExampleModel in a function
   * 
   * This test verifies that an ExampleModel object can be used in a function
   * that expects an ExampleModel parameter.
   */
  it('should be usable in functions expecting ExampleModel', () => {
    // Create an example object
    const example: ExampleModel = {
      id: '456',
      name: 'Another Example',
      description: 'This is another test example',
      createdAt: new Date('2023-02-15'),
    };

    // Define a function that takes an ExampleModel parameter
    const formatExample = (model: ExampleModel): string => {
      return `${model.name}: ${model.description} (ID: ${model.id}, Created: ${model.createdAt.toLocaleDateString()})`;
    };

    // Call the function with the example object
    const result = formatExample(example);

    // Verify the result
    expect(result).toBe('Another Example: This is another test example (ID: 456, Created: 2/15/2023)');
  });

  /**
   * Test case for array of ExampleModel objects
   * 
   * This test verifies that an array of ExampleModel objects can be created
   * and manipulated correctly.
   */
  it('should work with arrays of ExampleModel objects', () => {
    // Create an array of example objects
    const examples: ExampleModel[] = [
      {
        id: '1',
        name: 'First Example',
        description: 'This is the first example',
        createdAt: new Date('2023-01-15'),
      },
      {
        id: '2',
        name: 'Second Example',
        description: 'This is the second example',
        createdAt: new Date('2023-02-20'),
      },
    ];

    // Verify the array length
    expect(examples.length).toBe(2);

    // Verify the properties of the first example
    expect(examples[0].id).toBe('1');
    expect(examples[0].name).toBe('First Example');

    // Verify the properties of the second example
    expect(examples[1].id).toBe('2');
    expect(examples[1].description).toBe('This is the second example');

    // Test array operations
    const filteredExamples = examples.filter(example => example.id === '2');
    expect(filteredExamples.length).toBe(1);
    expect(filteredExamples[0].name).toBe('Second Example');
  });
});