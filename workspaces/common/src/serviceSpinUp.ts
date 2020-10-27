export interface node {
  id: string,
  children: string[],
  workTime: number,
  isRoot?: boolean
}


export type nodeSchemas = node[];

export function deserialize(jsonString: string, startingPort = 4500): string[][] {
  let input: nodeSchemas;
  try {
    input = JSON.parse(jsonString);
  } catch {
    throw Error('Invalid set-up json');
  }
  if (!Array.isArray(input)) {
    throw Error('Set-up json is not an array');
  } else if (input.filter((n: node) => n.isRoot).length < 1) {
    throw Error('Set-up json missing a root node, no valid target');
  }

  const nodeToPort = input.reduce((acc: { [k: string]: number }, { id }: node) => {
    acc[id] = startingPort;
    startingPort += 1;
    return acc;
  }, {});

  return input.map(({ id, workTime, children }: node): string[] => [
    id,
    nodeToPort[id].toString(),
    workTime.toString(),
    ...children.map((id: string): string => `http://localhost:${nodeToPort[id]}`)]
  );
}

export function serialize(nodes: node[]) {
  if (nodes.filter((n: node) => n.isRoot).length < 1) {
    throw Error('Missing initally queryable nodes!')
  }
  return JSON.stringify(nodes)
}

// [{ id: 1, children: [2, 3], workTime: 3000, isRoot: true }, { id: 2, children: [4], workTime: 3000 }, { id: 4, children: [], workTime: 3000 }, { id: 3, children: [], workTime: 3000 }]
