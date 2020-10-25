import express, { Request, Response } from "express";
import { spawn, ChildProcess } from 'child_process';

const app = express();

const children: ChildProcess[] = []

app.get("/create", async (req: Request, res: Response) => {
  children.forEach(childProcess => childProcess?.kill());
  const setup = req.query.setup ?? '{"root":[]}'
  // { root: ['node1', 'node2'], node1: [node: 3], node2: [], node3: []}
  const nodeMap: {[k: string]: any} = {};
  let port = 4000;
  // name, port, workTime, ...targets
  for (const [nodeID, targets] of Object.entries(JSON.parse(setup as string))) {
    if (nodeID === 'root') continue;
    nodeMap[nodeID as string] = {
      name: nodeID,
      port,
      workTime: 2500,
      targets: '[]'
    }
    const c = spawn('yarn', ['start', nodeID, `${port}`, "2500", '[]'], {
      cwd: '../microservice',
    });
    
    c.stdout.on('data', (data) => console.log(data?.toString()))
    children.push(c)
    port += 1;
  }
  res.status(200).send("huh");
});

app.listen(8000, () => {
  console.log('Server Started at Port, 8000');
});