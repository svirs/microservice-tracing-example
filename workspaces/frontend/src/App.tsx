import React from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  const ws = new WebSocket('ws://localhost:8000');
  ws.onopen = function () {
    console.log('websocket is connected ...')};
  ws.onmessage = console.log;
  fetch('/create?setup=[{"id":1,"children":[2,3],"workTime":3000,"isRoot":true},{"id":2,"children":[4],"workTime":3000},{"id":4,"children":[],"workTime":3000},{"id":3,"children":[],"workTime":3000}]').then(d => d.text().then(console.log), console.log)
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
