import {catchAsync} from "../utils/catchAsync";
import {NextFunction, Request, Response} from "express";
import HttpStatusCode from "../utils/HttpStatusCode";
import {getUserId} from "../utils/auth";
import {RedisController} from "../utils/controller";

export type RequestController = (
  req: Request,
  res: Response,
  next: NextFunction
) => void;

export interface DefaultController {
  addEntry: RequestController,
  addEntries: RequestController
  getEntries: RequestController,
  getEntry: RequestController
  updateEntry: RequestController
  deleteEntry: RequestController
  deleteEntries: RequestController
}

const getQuery = (req: Request) => {
  // convert elements
  const elements = Object.entries(req.query)
    .map(([key, q]) => [key, q?.toString() || '']);
  // create object
  return Object.fromEntries(elements);
}

export function expressController<Type>(controller: RedisController<Type>): DefaultController {
  // return middleware controllers
  return {
    getEntries: catchAsync(async (req: Request, res: Response) => {
      res.status(HttpStatusCode.OK)
        .send(await controller.getEntries(getUserId(req), getQuery(req)));
    }),

    addEntries: catchAsync(async (req: Request, res: Response) => {
      res.status(HttpStatusCode.CREATED)
        .send(await controller.addEntries(getUserId(req), req.body, getQuery(req)));
    }),

    deleteEntries: catchAsync(async (req: Request, res: Response) => {
      res.status(HttpStatusCode.OK)
        .send(await controller.deleteEntries(getUserId(req), getQuery(req)));
    }),

    getEntry: catchAsync(async (req: Request, res: Response) => {
      res.status(HttpStatusCode.OK)
        .send(await controller.getEntry(getUserId(req), req.params.id));
    }),

    addEntry: catchAsync(async (req: Request, res: Response) => {
      res.status(HttpStatusCode.CREATED)
        .send(await controller.addEntry(getUserId(req), req.body, getQuery(req)));
    }),

    updateEntry: catchAsync(async (req: Request, res: Response) => {
      res.status(HttpStatusCode.OK)
        .send(await controller.updateEntry(getUserId(req), req.params.id, req.body));
    }),

    deleteEntry: catchAsync(async (req: Request, res: Response) => {
      res.status(HttpStatusCode.OK)
        .send(await controller.deleteEntry(getUserId(req), req.params.id));
    }),
  }
}

