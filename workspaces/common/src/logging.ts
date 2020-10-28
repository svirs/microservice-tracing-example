import { nodeState } from './msState';

const messagePass = 'OUTGOING';
const JSON_DELIMITER = '_____';
const regexMatcher = new RegExp(`${JSON_DELIMITER} (.*) ${JSON_DELIMITER}`);

export const messageLogger = (
  msg: string,
  data?: {
    nodeId: string;
    state: nodeState;
  },
  broadcast = false,
) =>
  broadcast
    ? console.log(
        messagePass,
        msg,
        JSON_DELIMITER,
        JSON.stringify({ ...data, time: Date.now() }),
        JSON_DELIMITER,
      )
    : console.log(msg);

export const consumeLogMessage = (
  data: string,
): { time: number; nodeId: string; state: nodeState } => {
  const matches = data.match(regexMatcher);
  const jsonMatch = matches && matches.length > 0 ? matches[1] : '';
  try {
    return JSON.parse(jsonMatch);
  } catch {
    throw new Error('Unabled to parse structured message');
  }
};

export const shouldAllowLogBroadcast = (msg: string) =>
  msg.startsWith(messagePass);
