import { Server as WebSocketServer } from 'ws';
import { spawn, ChildProcess } from 'child_process';
import http from 'http';
import express, { Request, Response } from 'express';

import { deserialize, shouldAllowLogBroadcast } from 'common/src'; // https://github.com/microsoft/TypeScript/issues/33079

const app = express();

const httpServer = http.createServer(app);

const PORT = 8000;

const wss = new WebSocketServer({ server: httpServer });
httpServer.listen(PORT);

let children: ChildProcess[] = []; // holder for all microservice instances

app.get('/create', async (req: Request, res: Response) => {
  console.log('Killing previous server child processes');
  children.forEach((childProcess) => childProcess.kill());
  children = [];

  const setup = req.query.setup;
  if (typeof setup === 'string') {
    const serviceGraph = deserialize(setup);
    const promisedGraphArray = serviceGraph.map((args) => () =>
      Promise.resolve(args),
    );
    for await (const args of promisedGraphArray) {
      const c = spawn('yarn', ['start', ...(await args())], {
        // todo: remove yarn, rely on builds in morkspace
        cwd: '../microservice',
      });
      c.stdout.on('data', (data) => {
        const msg: string = data?.toString();
        if (shouldAllowLogBroadcast(msg)) {
          wss.clients.forEach((client) => client.send(msg, () => {})); // todo: handle errored websocket sends
        }
      });
      children.push(c);
    }
    res.status(200).send(serviceGraph);
  } else {
    res.status(400).send('bad setup');
  }
});

process.on('SIGTERM', () =>
  children.forEach((childProcess) => childProcess?.kill()),
);
