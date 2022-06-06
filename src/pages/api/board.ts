import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';

let filesArray = [];

export default function (req: NextApiRequest, res: NextApiResponse) {
  const id = req.query.id;

  if (filesArray.length === 0) {
    const files = fs.readdirSync("./src/export");
    filesArray = files.map((f) => {
      return JSON.parse(
        fs.readFileSync(`./src/export/${f}`, { encoding: "utf-8" })
      );
    });
  }
  res.json(filesArray.find((f) => f.id === id));
}
