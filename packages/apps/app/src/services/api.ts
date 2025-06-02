/**
 * API service for making requests to the backend
 */
import { ExampleModel } from '@jk/models';
import axios from 'axios';

const API_URL = '/api';

/**
 * Fetches all examples from the API
 * @returns Promise with array of ExampleModel objects
 */
export const getExamples = async (): Promise<ExampleModel[]> => {
  const response = await axios.get<ExampleModel[]>(`${API_URL}/examples`);
  return response.data;
};

/**
 * Fetches a single example by ID
 * @param id - The ID of the example to fetch
 * @returns Promise with ExampleModel object
 */
export const getExampleById = async (id: string): Promise<ExampleModel> => {
  const response = await axios.get<ExampleModel>(`${API_URL}/examples/${id}`);
  return response.data;
};
