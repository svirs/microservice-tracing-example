export interface node {
  id: string;
  children: string[];
  workTime: number;
}

export type nodeSchemas = node[];

export function deserialize(
  jsonString: string,
  startingPort = 4500,
): string[][] {
  let input: nodeSchemas;
  try {
    input = JSON.parse(jsonString);
  } catch {
    throw Error('Invalid set-up json');
  }
  if (!Array.isArray(input)) {
    throw Error('Set-up json is not an array');
  }

  const nodeToPort = input.reduce(
    (acc: { [k: string]: number }, { id }: node) => {
      acc[id] = startingPort;
      startingPort += 1;
      return acc;
    },
    {},
  );

  return input.map(({ id, workTime, children }: node): string[] => [
    id,
    nodeToPort[id].toString(),
    workTime.toString(),
    ...children.map(
      (id: string): string => `http://localhost:${nodeToPort[id]}`,
    ),
  ]);
}

export function serialize(nodes: node[]) {
  return JSON.stringify(nodes);
}
