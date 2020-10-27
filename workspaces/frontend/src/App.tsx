import React, { useState, useEffect, useRef, useReducer } from 'react';
import { nodeState } from 'common/src'

const predefinedGraph = [
  { id: 1, children: [2, 3, 4], "workTime": 150 },
  { id: 2, children: [], "workTime": 200 },
  { id: 3, children: [5], "workTime": 250 },
  { id: 4, children: [6, 7], "workTime": 300 },
  { id: 5, children: [], "workTime": 300 },
  { id: 6, children: [], "workTime": 350 },
  { id: 7, children: [8], "workTime": 400 },
  { id: 8, children: [], "workTime": 1000 },
];

function App() {
  const [info, setInfo] = useState(null);
  const [nodeStatuses, setNodeStatuses] = useState<{ [id: string]: { time: number, state: nodeState } }>({})
  const ws = useRef<WebSocket>();

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:8000');
    ws.current.onopen = () => console.log('Websocket Connected!')
    ws.current.onclose = (evt) => console.log('Websocket Closed!', evt);
    ws.current.onerror = (evt) => console.log('Websocket Error! ', evt);
    return () => {
      ws.current?.close()
    }
  }, []);

  useEffect(() => {
    if (ws.current) {
      ws.current.onmessage = (msg) => {
        debugger;
        const { name, state, time } = JSON.parse(msg.data?.match(/\|\| (.*)\n/)[1]);
        if (!nodeStatuses[name] || time > nodeStatuses[name].time) {
          setNodeStatuses({ ...nodeStatuses, [name]: { time, state } });
        }
      };
    }
  }, [setNodeStatuses, nodeStatuses]);

  useEffect(() => {
    fetch(`/create?setup=${JSON.stringify(predefinedGraph)}`)
      .then(data => data.json())
      .then(setInfo)
      .catch(err => { throw err });
  }, [setInfo])
  return <h1>{JSON.stringify(nodeStatuses)}</h1>;
}

export default App;
