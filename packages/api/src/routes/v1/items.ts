import express from "express";
import {itemValidation} from "../../validations/items";
import {validate} from "../../middlewares/validate";
import {auth} from "../../middlewares/auth";
import {itemController} from "../../controllers/items";

// create router
const router = express.Router();

// base route
router.route('/')
  .get(auth(['getItems']), validate(itemValidation.getEntries), itemController.getEntries)
  .put(auth(['manageItems']), validate(itemValidation.updateEntries), itemController.updateEntries)
  .post(auth(['manageItems']), validate(itemValidation.addEntry), itemController.addEntry);
// batch route
router.route('/batch')
  .post(auth(['manageItems']), validate(itemValidation.addEntries), itemController.addEntries)
  .delete(auth(['manageItems']), validate(itemValidation.deleteEntries), itemController.deleteEntries);
// commit routes
router.route('/commit/:commitId')
  .get(auth(['getItems']), validate(itemValidation.getEntriesByCommit), itemController.getCommit)
// head routes
router.route('/head')
  .patch(auth(['manageItems']), validate(itemValidation.patchHeadToLatestCommit), itemController.setHeadToCommit)
// head routes with commit ID
router.route('/head/:commitId')
  .patch(auth(['manageItems']), validate(itemValidation.patchHeadToCommit), itemController.setHeadToCommit)
// id routes
router.route('/:id')
  .get(auth(['getItems']), validate(itemValidation.getEntry), itemController.getEntry)
  .put(auth(['manageItems']), validate(itemValidation.updateEntry), itemController.updateEntry)
  .patch(auth(['manageItems']), validate(itemValidation.patchEntry), itemController.patchFields)
  .delete(auth(['manageItems']), validate(itemValidation.deleteEntry), itemController.deleteEntry);
// id routes with attributes
router.route('/link/:source/:target')
  .post(auth(['manageItems']), validate(itemValidation.linkEntry), itemController.linkEntry)
  .delete(auth(['manageItems']), validate(itemValidation.unlinkEntry), itemController.unlinkEntry)

export {router as itemsRouter}
