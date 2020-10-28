import React, { useState, useEffect, useRef, useCallback } from 'react';
import cytoscape from 'cytoscape';

import { nodeState } from 'common/src';

import './App.css';

const initialDAG = JSON.stringify(
  {
    nodes: [
      {
        data: { id: 'a', workTime: 800 },
      },
      {
        data: { id: 'b', workTime: 900 },
      },
      {
        data: { id: 'c', workTime: 1300 },
      },
      {
        data: { id: 'd', workTime: 750 },
      },
      {
        data: { id: 'e', workTime: 950 },
      },
      {
        data: { id: 'f', workTime: 1100 },
      },
    ],
    edges: [
      {
        data: { id: 'ab', source: 'a', target: 'b' },
      },
      {
        data: { id: 'bc', source: 'b', target: 'c' },
      },
      {
        data: { id: 'cd', source: 'c', target: 'd' },
      },
      {
        data: { id: 'ce', source: 'c', target: 'e' },
      },
      {
        data: { id: 'ef', source: 'e', target: 'f' },
      },
    ],
  },
  null,
  2,
);

function App() {
  const [_, setInfo] = useState(null);
  const [nodeStatuses, setNodeStatuses] = useState<{
    [id: string]: { time: number; state: nodeState };
  }>({});
  const ws = useRef<WebSocket>();
  const cyto = useRef<cytoscape.Core>();
  const cytoRoot = useRef(null);
  const [graphDefinition, setGraphDefinition] = useState<any>(initialDAG);

  let graphDefinitionObject: {
    nodes: { data: { id: string; workTime: number } }[];
    edges: { data: { id: string; source: string; target: string } }[];
  };

  try {
    graphDefinitionObject = JSON.parse(graphDefinition);
  } catch {
    graphDefinitionObject = { nodes: [], edges: [] };
  }

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:8000');
    ws.current.onopen = () => console.log('Websocket Connected!');
    ws.current.onclose = (evt) => console.log('Websocket Closed!', evt);
    ws.current.onerror = (evt) => console.log('Websocket Error! ', evt);
    return () => {
      ws.current?.close();
    };
  }, []);

  useEffect(() => {
    if (ws.current) {
      ws.current.onmessage = (msg) => {
        const { name, state, time } = JSON.parse(
          msg.data?.match(/\|\| (.*)\n/)[1],
        );
        if (!nodeStatuses[name] || time > nodeStatuses[name].time) {
          // if (name === 'b') {
          //   console.log('SHUR', state)
          // }
          // cyto?.current?.getElementById(name).style('background-color',
          //   {
          //     'BOOTING': '#F00', // red
          //     'READY': '#FA0',  // orange
          //     'WORKING': '#FF0', // yellow
          //     'WAITING': '#58E', // bluish
          //     'DONE': '#0F0', // green
          //   }[state as nodeState])
          //   debugger;
          setNodeStatuses({ ...nodeStatuses, [name]: { time, state } });
        }
      };
    }
  }, [setNodeStatuses, nodeStatuses]);

  const sendGraph = useCallback(() => {
    const remapGraphObjectArray = graphDefinitionObject.nodes.map(
      ({ data }: any) => {
        const { id, workTime } = data;
        return { id, workTime, children: [] as string[] };
      },
    );
    graphDefinitionObject.edges.forEach(({ data }: any) => {
      const { source, target } = data;
      remapGraphObjectArray.forEach((ele, idx) => {
        if (ele.id === source) {
          remapGraphObjectArray[idx].children.push(target);
        }
      });
    });
    fetch(`/create?setup=${JSON.stringify(remapGraphObjectArray)}`)
      .then((data) => data.json())
      .then(setInfo)
      .catch(console.log);
  }, [graphDefinitionObject, setInfo]);

  useEffect(() => {
    const dataNodes = {
      ...graphDefinitionObject,
      nodes: graphDefinitionObject.nodes.map(({ data }) => ({
        data: { ...data, ...nodeStatuses[data.id] },
      })),
    };
    try {
      cyto.current = cytoscape({
        container: cytoRoot.current,
        elements: dataNodes,
        layout: {
          name: 'breadthfirst',
          rows: 1,
        },
        style: [
          {
            selector: 'node',
            style: {
              label: (ele: any) => ele.data('id'),
              'background-color': (ele: any) => {
                const state = ele.data('state');
                if (state == null) {
                  return '#AAA';
                } else {
                  if (ele.data('id') === 'b') {
                    console.log('END', state);
                  }
                  return {
                    BOOTING: '#F00', // red
                    READY: '#FA0', // orange
                    WORKING: '#FF0', // yellow
                    WAITING: '#58E', // bluish
                    DONE: '#0F0', // green
                  }[state as nodeState];
                }
              },
            },
          },
        ],
      });
    } catch {
      // no-op, allow graph library to stop rendering
    }
  }, [graphDefinitionObject, nodeStatuses]);

  return (
    <div className='container'>
      <div className='textWrapper'>
        <textarea
          className='textInput'
          value={graphDefinition}
          onChange={(e) => setGraphDefinition(e.target.value)}
        />
        <button className='send' onClick={sendGraph}>
          dispatch service graph to backend
        </button>
      </div>
      <div className='cytoRoot' ref={cytoRoot} />
    </div>
  );
}

export default App;
