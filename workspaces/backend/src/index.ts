import express, { Request, Response } from "express";
import { spawn, ChildProcess } from 'child_process';
import { deserialize } from 'common/src'; // https://github.com/microsoft/TypeScript/issues/33079

const app = express();

let children: ChildProcess[] = []

app.get("/create", async (req: Request, res: Response) => {
  children.forEach(childProcess => childProcess?.kill());
  children = [];

  const setup = req.query.setup;
  if (typeof setup === "string") {
    for (const args of deserialize(setup)) {
      const c = spawn('yarn', args, {
        cwd: '../microservice',
      });
      c.stdout.on('data', (data) => console.log(setup[1], data?.toString()))
      children.push(c)
    }
    res.status(200).send(deserialize(setup));
  } else {
    res.status(400).send("bad setup");
  }
});

app.listen(8000, () => {
  console.log('Server Started at Port, 8000');
});