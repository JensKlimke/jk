import {Request, Response} from "express";
import HttpStatusCode from "../utils/HttpStatusCode";
import {catchAsync} from "../utils/catchAsync";

export const itemController = {

  getEntry : catchAsync(async (req: Request, res: Response) => {
    // get document by item ID
    // res.status(HttpStatusCode.OK)
    //   .send(await req.db.documents.getLatestById(req.params.id));
  }),

  getEntries : catchAsync(async (req: Request, res: Response) => {
    // get all items of latest commit
    // res.status(HttpStatusCode.OK)
    //   .send(await req.db.documents.getAllLatest());
  }),

  getCommit : catchAsync(async (req: Request, res: Response) => {
    // get all items within commit
    // res.status(HttpStatusCode.OK)
    //   .send(await req.db.documents.getAllByCommit(req.params.commitId));
  }),

  addEntry : (async (req: Request, res: Response) => {
    // insert document
    res.status(HttpStatusCode.CREATED)
      .send(await req.db.documents._addItem(req.body));
  }),

  addEntries : catchAsync(async (req: Request, res: Response) => {
    // insert elements
    res.status(HttpStatusCode.CREATED)
      .send(await req.db.documents._addManyItems(req.body));
  }),

  deleteEntry : catchAsync(async (req: Request, res: Response) => {
    // delete by ID
    // res.status(HttpStatusCode.OK)
    //   .send(await req.db.documents.deleteById(req.params.id));
  }),

  deleteEntries : catchAsync(async (req: Request, res: Response) => {
    // delete all entries
    // res.status(HttpStatusCode.OK)
    //   .send(await req.db.documents.deleteAllLatest());
  }),

  updateEntry : catchAsync(async (req: Request, res: Response) => {
    // send result
    // res.status(HttpStatusCode.OK)
    //   .send(await req.db.documents.updateById(req.params.id, req.body));
  }),

  patchFields : catchAsync(async (req: Request, res: Response) => {
    // send result
    // res.status(HttpStatusCode.OK)
    //   .send(await req.db.documents.patchFieldsById(req.params.id, req.body));
  }),

  linkEntry : catchAsync(async (req: Request, res: Response) => {
    // // send result
    // res.status(HttpStatusCode.OK)
    //   .send(await req.db.documents._createLink(req.params.source, req.params.target, req.body.type, req.body.backType));
  }),

  unlinkEntry : catchAsync(async (req: Request, res: Response) => {
    // send result
    res.status(HttpStatusCode.OK)
      .send(await req.db.documents.deleteLink(req.params.id, req.body.to, req.body.type, req.body.backType));
  }),

  updateEntries : catchAsync(async (req: Request, res: Response) => {
    // update entry
    res.status(HttpStatusCode.OK) // TODO
      .send({});
  }),

  setHeadToCommit : catchAsync(async (req: Request, res: Response) => {
    // revert all entries
    res.status(HttpStatusCode.OK)
      .send(await req.db.documents.resetHead(req.params.commitId));
  })

}
