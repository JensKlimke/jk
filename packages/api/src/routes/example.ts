/**
 * Example routes for the API
 */
import { ExampleModel } from '@jk/models';
import { Router } from 'express';

// Create router
export const exampleRouter = Router();

/**
 * GET /api/examples
 * Returns a list of example items
 */
exampleRouter.get('/', (req, res) => {
  // Mock data using the ExampleModel interface
  const examples: ExampleModel[] = [
    {
      id: '1',
      name: 'Example 1',
      description: 'This is the first example',
      createdAt: new Date(),
    },
    {
      id: '2',
      name: 'Example 2',
      description: 'This is the second example',
      createdAt: new Date(),
    },
  ];

  res.json(examples);
});

/**
 * GET /api/examples/:id
 * Returns a single example item by ID
 */
exampleRouter.get('/:id', (req, res) => {
  const { id } = req.params;

  // Mock data for a single example
  const example: ExampleModel = {
    id,
    name: `Example ${id}`,
    description: `This is example ${id}`,
    createdAt: new Date(),
  };

  res.json(example);
});
