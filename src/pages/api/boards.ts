import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';

export default function (req: NextApiRequest, res: NextApiResponse) {
  const files = fs.readdirSync("./src/export");
  let data = files.map((f) => {
    const content = JSON.parse(
      fs.readFileSync(`./src/export/${f}`, { encoding: "utf-8" })
    );
    return { id: content.id, name: content.name };
  });
  data = data.filter((a, i) => data.findIndex((d) => d.id === a.id) === i);
  res.json(data);
}
