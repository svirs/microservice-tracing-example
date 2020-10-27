import { Server as WebSocketServer } from 'ws';
import { spawn, ChildProcess } from 'child_process';
import http from 'http';
import express, { Request, Response } from "express";

import { deserialize } from 'common/src'; // https://github.com/microsoft/TypeScript/issues/33079

const app = express();

const httpServer = http.createServer(app)

const PORT = 8000;

const wss = new WebSocketServer({ server: httpServer });
httpServer.listen(PORT)

let children: ChildProcess[] = []

app.get("/create", async (req: Request, res: Response) => {
  children.forEach(childProcess => childProcess?.kill());
  children = [];

  const setup = req.query.setup;
  if (typeof setup === "string") {
    console.log(deserialize(setup));
    for (const args of deserialize(setup)) {
      const c = spawn('yarn', ['start', ...args], {
        cwd: '../microservice',
      });
      c.stdout.on('data', (data) => {
        console.log(args, data.toString());
        wss.clients.forEach(client => client.send(data?.toString(), err => console.log('ws send', err)))
      })
      children.push(c)
    }
    res.status(200).send(deserialize(setup));
  } else {
    res.status(400).send("bad setup");
  }
});

process.on('SIGTERM', () => children.forEach(childProcess => childProcess?.kill()));