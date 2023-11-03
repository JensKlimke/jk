import {Request, Response} from "express";
import * as fs from "fs";
import moment from "moment";
import {LOG_DIR} from "../config/env";

const saveLogLine = (system: string, messages: string[], type: string) => {
  // generate today's log file
  const fileName = `${LOG_DIR}/${system}_${moment().format('YYYY-MM-DD')}.txt`
  // generate datetime string
  const datetime = moment().toISOString();
  // save line
  fs.appendFileSync(fileName, `${datetime} [${type}] ${messages.join(' - ')}\n`);
}

const saveLogLineController = (req: Request, res: Response) => {
  // log
  saveLogLine(req.body.loggerName, req.body.messages, req.body.level);
  // send users
  res.send(true);
};

export const logsController = {
  saveLogLine,
  saveLogLineController
}

