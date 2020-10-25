import express, { Request, Response } from "express";

const [name, port, workTime] = process.argv.slice(2);
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
  res.status(200).send("Hello World!");
});

app.listen(8000, () => {
  console.log('Server Started at Port 8000', {
    name, port, time: Date.now()
  });
});

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}