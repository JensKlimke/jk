/**
 * API service for making requests to the backend
 */
import { ExampleModel } from '@jk/models';
import axios from 'axios';

import { API_URL, WHOIS_URL } from '../utils/env';

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

/**
 * Interface for the whois response
 */
export interface WhoisResponse {
  id: string;
  timestamp: string;
  message: string;
}

/**
 * Fetches whois information from the API
 * @returns Promise with WhoisResponse object
 */
export const getWhoisInfo = async (): Promise<WhoisResponse> => {
  const response = await axios.get<WhoisResponse>(`${WHOIS_URL}/whois`);
  return response.data;
};
