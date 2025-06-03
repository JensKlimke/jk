/**
 * Main App component
 */
import { ExampleModel } from '@jk/models';
import { useState, useEffect } from 'react';

import { getExamples, getWhoisInfo, WhoisResponse } from './services/api';
import './App.css';

/**
 * App component that fetches and displays examples from the API
 */
function App() {
  const [examples, setExamples] = useState<ExampleModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [whoisInfo, setWhoisInfo] = useState<WhoisResponse | null>(null);

  useEffect(() => {
    const fetchExamples = async () => {
      try {
        const data = await getExamples();
        setExamples(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch examples. Please try again later.');
        setLoading(false);
        console.error('Error fetching examples:', err);
      }
    };

    fetchExamples();
  }, []);

  useEffect(() => {
    const fetchWhoisInfo = async () => {
      try {
        const data = await getWhoisInfo();
        setWhoisInfo(data);
      } catch (err) {
        console.error('Error fetching whois info:', err);
      }
    };

    fetchWhoisInfo();
  }, []);

  return (
    <div className="app">
      <h1>JK Project</h1>

      {loading && <p>Loading examples...</p>}

      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <div className="examples">
          <h2>Examples from API</h2>
          {examples.length === 0 ? (
            <p>No examples found.</p>
          ) : (
            <ul>
              {examples.map(example => (
                <li key={example.id} className="example-item">
                  <h3>{example.name}</h3>
                  <p>{example.description}</p>
                  <p className="date">Created: {new Date(example.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <footer className="footer">{whoisInfo && <p>ID: {whoisInfo.id}</p>}</footer>
    </div>
  );
}

export default App;
