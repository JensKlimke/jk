import {NextFunction, Request, Response} from "express";

type FuncDef = (req: Request, res: Response, next: NextFunction) => any;
export const catchAsync = (fn: FuncDef) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch((err) => next(err));
};
