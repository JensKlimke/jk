import express from "express";
import {auth} from "../middlewares/auth";
import {validate} from "../middlewares/validate";
import {DefaultValidator} from "./validation";

export const defaultRoutes = (router: express.Router, validator: DefaultValidator, controller: any) => {
  // base route
  router.route('/')
    .get(auth(['getUserItems']), validate(validator.getEntries), controller.getEntries)
    .post(auth(['manageUserItems']), validate(validator.addEntry), controller.addEntry);
  // batch route
  router.route('/batch')
    .post(auth(['manageUserItems']), validate(validator.addEntries), controller.addEntries)
    .delete(auth(['manageUserItems']), validate(validator.deleteEntries), controller.deleteEntries);
  // id routes
  router.route('/:id')
    .get(auth(['getUserItems']), validate(validator.getEntry), controller.getEntry)
    .put(auth(['manageUserItems']), validate(validator.updateEntry), controller.updateEntry)
    .delete(auth(['manageUserItems']), validate(validator.deleteEntry), controller.deleteEntry);
}
