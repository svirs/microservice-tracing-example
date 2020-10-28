import express, { Request, Response } from 'express';
import { get } from 'http';
import { nodeState, messageLogger } from 'common/src';

const [nodeId, port, workTime, ...targets] = process.argv.slice(2);
const workMS = parseInt(workTime, 10);

messageLogger(
  'App starting',
  {
    nodeId,
    state: nodeState.BOOTING,
  },
  true,
);

const app = express();

app.get('/', async (req: Request, res: Response) => {
  messageLogger(
    'Starting work',
    {
      nodeId,
      state: nodeState.WORKING,
    },
    true,
  );

  await sleep(Number.isNaN(workMS) ? 2000 : workMS);
  messageLogger(
    'Finished work',
    {
      nodeId,
      state: nodeState.WAITING,
    },
    true,
  );

  let data = await Promise.all(
    targets.map(
      (url: string) =>
        new Promise((resolve) =>
          get(url, (response) => {
            var body = '';
            response.on('data', function (chunk) {
              body += chunk;
            });
            response.on('end', function () {
              resolve(JSON.parse(body));
            });
          }).on('error', function (e) {
            console.log('Got error: ' + e.message);
          }),
        ),
    ),
  );
  res.status(200).send(JSON.stringify({ node: name, fetched: data }));

  messageLogger(
    'Finished work',
    {
      nodeId,
      state: nodeState.DONE,
    },
    true,
  );
});

app.listen(port, () => {
  messageLogger(
    `Server Started at Port ${port}`,
    {
      nodeId,
      state: nodeState.READY,
    },
    true,
  );
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
