import React from 'react';
import logo from './logo.svg';
import './App.css';
import {Build} from "@sdk/version";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>{Build.branch}</p>
      </header>
    </div>
  );
}

export default App;
