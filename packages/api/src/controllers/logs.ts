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
  fs.appendFileSync(fileName, `${datetime} [${type}] ${messages.join(' - ')}\n`, {flag: 'a'});
}

const getLogFileContent = (system: string, date : string) => {
  const fileName = `${LOG_DIR}/${system}_${date}.txt`;
  return fs.readFileSync(fileName);
}

const saveLogLineController = (req: Request, res: Response) => {
  // log
  saveLogLine(req.body.loggerName, req.body.messages, req.body.level);
  // send users
  res.send(true);
};

const getLogLinesController = (req: Request, res: Response) => {
  const result = getLogFileContent(req.query.loggerName as string, req.query.date as string);
  res.send(result.toString().split("\n"));
}

export const logsController = {
  saveLogLine,
  saveLogLineController,
  getLogLinesController
}

