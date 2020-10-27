import express, { Request, Response } from "express";
import { get } from 'http';

console.log(process.argv);
const [name, port, workTime, ...targets] = process.argv.slice(2);
const workMS = parseInt(workTime, 10);

const app = express();

app.get("/", async (req: Request, res: Response) => {
  const traceId = req.query.traceId;
  console.log('Starting work', {
    name, port, time: Date.now(), traceId,
  })
  await sleep(Number.isNaN(workMS) ? 2000 : workMS)
  console.log('Finished work', {
    name, port, time: Date.now(), traceId,
  })
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
});

app.listen(port, () => {
  console.log(`Server Started at Port ${port}`, {
    name, port, time: Date.now()
  });
});

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
