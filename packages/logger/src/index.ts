import log from "loglevel";
import {Build} from "@sdk/version";

export const LOG_SYSTEM_KEY = process.env.LOG_SYSTEM_KEY || Build.system;

export const logger = log.getLogger(LOG_SYSTEM_KEY);
