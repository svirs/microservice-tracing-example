import express, { Request, Response } from "express";
import { get } from 'http';
import { nodeState } from 'common/src';



const [name, port, workTime, ...targets] = process.argv.slice(2);
const workMS = parseInt(workTime, 10);

console.log("MSG", "App starting", "||", JSON.stringify({
  name, port, time: Date.now(), state: nodeState.BOOTING
}));

const app = express();

app.get("/", async (req: Request, res: Response) => {
  const traceId = req.query.traceId;
  console.log("MSG", 'Starting work', "||", JSON.stringify({
    name, port, time: Date.now(), traceId, state: nodeState.WORKING
  }));

  await sleep(Number.isNaN(workMS) ? 2000 : workMS)
  console.log("MSG", 'Finished work', "||", JSON.stringify({
    name, port, time: Date.now(), traceId, state: nodeState.WAITING
  }));

  let data = await Promise.all(targets.map((url: string) => new Promise( resolve => get(url, response => {
    var body = '';
    response.on('data', function(chunk) {
      body += chunk;
    });
    response.on('end', function() {
      resolve(JSON.parse(body));
    });
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
  }))));
  res.status(200).send(JSON.stringify({node: name, fetched: data}));

  console.log("MSG", 'Finished work', "||", JSON.stringify({
    name, port, time: Date.now(), traceId, state: nodeState.READY
  }))
});

app.listen(port, () => {
  console.log("MSG", `Server Started at Port ${port}`, "||", JSON.stringify({
    name, port, time: Date.now(), state: nodeState.READY
  }));
});

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
