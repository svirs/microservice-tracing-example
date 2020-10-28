import React, { useState, useEffect, useRef, useCallback } from 'react';
import cytoscape from 'cytoscape';

import { nodeState } from 'common/src';

import './App.css';

const initialGraph = JSON.stringify(
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
  const [_, setInfo] = useState(null); // ts-ignore todo echo back url of endpoint to start off visualization
  const [nodeStatuses, setNodeStatuses] = useState<{
    [id: string]: { time: number; state: nodeState };
  }>({});
  const ws = useRef<WebSocket>();
  const cyto = useRef<cytoscape.Core>();
  const cytoRoot = useRef(null);
  const [graphDefinition, setGraphDefinition] = useState<any>(initialGraph);

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
        const { nodeId: name, state, time } = consumeLogMessage(msg.data);
        if (!nodeStatuses[name] || time > nodeStatuses[name].time) {
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

/*
  TEMP moving this to thei workspace since there's a bug with CRA:
  https://github.com/facebook/create-react-app/issues/9127
*/
const JSON_DELIMITER = '_____';
const regexMatcher = new RegExp(`${JSON_DELIMITER} (.*) ${JSON_DELIMITER}`);

function consumeLogMessage(
  data: string,
): { time: number; nodeId: string; state: nodeState } {
  const matches = data.match(regexMatcher);
  const jsonMatch = matches && matches.length > 0 ? matches[1] : '';
  try {
    return JSON.parse(jsonMatch);
  } catch {
    throw new Error('Unabled to parse structured message');
  }
}
