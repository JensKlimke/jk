import {Collection, ObjectId} from "mongodb";
import ApiError from "./ApiError";
import HttpStatusCode from "./HttpStatusCode";
import "@sdk/utils"

export type FilterType = { [filter : string] : any };
export type BodyType = { [filter : string] : any };
export type ItemDocList = { item: ObjectId, document: ObjectId }[];
export type LinkType = { target: ObjectId, type: string }

export const COMMITS_COLLECTION_NAME = 'commits';
export const ITEMS_COLLECTION_NAME = 'items';
export const DOCUMENTS_COLLECTION_NAME = 'documents';


export class DBClient {

  static commitsCollection : Collection
  static itemsCollection : Collection
  static documentsCollection : Collection
  collection : Collection;
  authKey : ObjectId


  constructor(collection : Collection) {
    this.collection = collection;
  }

  setAuth(authKey : string) {
    this.authKey = new ObjectId(authKey);
  }


  /**
   * Inserts a document entry to the database.
   * Uses body as content and adds item ID and commit ID
   * @param body Content of the entry
   * @param itemId Item ID
   * @param commitId Commit ID
   * @param links Link list
   * @return The insert result
   */
  async _insertDocumentEntry(body : BodyType, itemId : ObjectId, commitId : ObjectId, links : LinkType[] = []) {
    // data body
    body = {
      ...body,
      _item: itemId,
      _commit: commitId,
      _links: links
    }
    // save and get document ID
    return await DBClient.documentsCollection.insertOne(body);
  }


  /**
   * Inserts an item to the database.
   * 1. Inserts an item entry with the commit ID.
   * 2. Inserts a document to the database with reference to the item and the commit using the body as content.
   * @param body Content of the document
   * @param commitId Commit ID
   * @return The item ID and the document ID
   */
  async _insertItem(body : BodyType, commitId : ObjectId) {
    // create item
    const itemId = await DBClient.itemsCollection.insertOne({
      creationCommit : commitId,
      deletionCommit : null,
      auth: this.authKey
    });
    // insert document
    const docId = await this._insertDocumentEntry(body, itemId.insertedId, commitId);
    // return item ID
    return {item: itemId, document: docId};
  }


  /**
   * Marks an item as deleted by saving the commit ID in the deletionCommit field
   * @param itemId ID of the item
   * @param commit Commit ID
   */
  async _markItemAsDeleted(itemId : ObjectId, commit: ObjectId) {
    // delete an item, by setting the deletionCommit field
    const res = await DBClient.itemsCollection.updateOne({
      _id: itemId,
      deletionCommit: null,
      auth: this.authKey
    }, {
      $set: {
        deletionCommit: commit,
      }
    });
    // check
    if (res.modifiedCount === 0)
      throw new ApiError(HttpStatusCode.NOT_FOUND);
  }


  /**
   * Returns the item entry by its ID.
   * @param itemId Item ID
   * @param onlyIfNotDeleted Flag to indicate if deleted item shall be considered.
   * @return The item entry
   */
  async _getItemEntryById(itemId : ObjectId, onlyIfNotDeleted : boolean = true) {
    // create filter
    const filter : FilterType = {_id : itemId};
    onlyIfNotDeleted && (filter.deletionCommit = null);
    filter.auth = this.authKey;
    // get item
    return await DBClient.itemsCollection.findOne(filter);
  }


  /**
   * Returns the document corresponding to the commit filter and item filter
   * @param commitFilter Commit filter
   * @param itemFilter Item filter
   * @return The document
   */
  async _generateDocumentRequest(commitFilter : any, itemFilter : any) {
    // get previous version of document
    const res = await DBClient.commitsCollection.aggregate([
      { $match: commitFilter },
      { $unwind: '$documents' },
      { $project: {
          document: '$documents.document',
          item: '$documents.item'
        }},
      { $match: itemFilter },
      { $lookup: {
          from: ITEMS_COLLECTION_NAME,
          localField: "item",
          foreignField: "_id",
          as: "item"
        }},
      { $unwind: '$item' },
      { $project: {
          _id: 1,
          document: 1,
          auth: '$item.auth'
        }},
      { $match: { auth: this.authKey } },
      { $lookup: {
          from: DOCUMENTS_COLLECTION_NAME,
          localField: "document",
          foreignField: "_id",
          as: "document"
        }},
      { $unwind: '$document' },
      { "$replaceRoot": { "newRoot": "$document" }  }
    ]).toArray();
    // check result
    if (!res || res.length !== 1)
      throw new ApiError(HttpStatusCode.NOT_FOUND);
    // return document
    return res[0];
  }


  /**
   * Returns the document corresponding to the item at the given commit.
   * @param commitId Commit ID
   * @param itemId Item ID
   * @return The document
   */
  async _getDocumentByItemAndCommit(commitId : ObjectId, itemId : ObjectId) {
    return this._generateDocumentRequest({ _id: commitId }, { item: itemId });
  }


  /**
   * Returns the document corresponding to the item and the head commit
   * @param itemId Item ID
   */
  async _getHeadDocumentByItem(itemId : ObjectId) {
    return this._generateDocumentRequest({ isHead: true }, { item: itemId });
  }


  /**
   * Removes all internal fields from the object. Internal fields start with "_"
   * @param obj Object to be cleaned
   */
  static _cleanDataObject(obj : any) {
    // copy object
    let newObject = {...obj};
    // remove all keys with
    Object.keys(obj).forEach(key => key.startsWith('_') && (delete newObject[key]));
    // return object
    return newObject;
  }


  /**
   * Gets the current version of the document and updates to the new commit.
   * @param prevCommitId Original commit ID
   * @param nextCommitId The new commit ID
   * @param itemId Item ID
   * @param updateCallback Callback to update document
   */
  async _incrementDocument(prevCommitId : ObjectId, nextCommitId : ObjectId, itemId : ObjectId, updateCallback : (document : any) => void) {
    // get document
    const document = await this._getDocumentByItemAndCommit(prevCommitId, itemId);
    // call update function
    updateCallback(document);
    // insert document
    return await this._insertDocumentEntry(DBClient._cleanDataObject(document), itemId, nextCommitId, document._links);
  }


  /**
   * Updates an item by adding a new document version in a new commit.
   * The update of the old document is done by a callback function passed to the method.
   * @param item Item ID
   * @param updateCallback Callback to update document
   * @return An object containing the new document ID and the new commit ID
   */
  async _updateItem(item : ObjectId, updateCallback : (document : any) => void) {
    // check item to available
    if (await this._getItemEntryById(item) === null)
      throw new ApiError(HttpStatusCode.NOT_FOUND);
    // create commit
    const commit = await DBClient._createCommit(this.authKey);
    // update document
    const doc = await this._incrementDocument(commit.previous, commit.id, item, updateCallback);
    // update commit
    commit.base.find(d => d.item.toHexString() === item.toHexString()).document = doc.insertedId;
    await DBClient._updateCommit(commit.id, commit.base);
    // update commit
    return { _document: doc.insertedId, _commit: commit.id };
  }


  /**
   * Adds an item within a new commit and saves the document accordingly.
   * @param body Body of the document
   */
  async _addItem(body : BodyType) {
    // create commit
    const commit = await DBClient._createCommit(this.authKey);
    // insert item
    const res = await this._insertItem(body, commit.id);
    // update commit
    commit.base.push({item: res.item.insertedId, document: res.document.insertedId});
    await DBClient._updateCommit(commit.id, commit.base);
    // insert single
    return {
      _item : res.item.insertedId,
      _document: res.document.insertedId,
      _commit: commit.id
    };
  }


  /**
   * Adds multiple items within a new commit and saves the documents accordingly.
   * @param bodies Bodies of the documents
   */
  async _addManyItems(bodies : BodyType[]) {
    // create commit
    const commit = await DBClient._createCommit(this.authKey);
    // insert items
    const items = await Promise.all(bodies.map(body => this._insertItem(body, commit.id)));
    // update base
    commit.base = [...commit.base, ...items.map(i => ({item: i.item.insertedId, document: i.document.insertedId}))];
    await DBClient._updateCommit(commit.id, commit.base);
    // insert many
    return {
      _items: items.map((r : any) => r.item.insertedId),
      _documents: items.map((r : any) => r.document.insertedId),
      _commit: commit.id
    };
  }


  /**
   * Writes the link to the document
   * @param document Document to be updated
   * @param target Target item to be linked
   * @param type Type of the link
   */
  async _writeLinkIntoDocument(document : any, target : ObjectId, type : string) {
    // add link uniquely
     document._links = (document._links as LinkType[]).addUniquely({target, type},
      (a, b) => (a.target.toString() === b.target.toString() && a.type === b.type)
    );
  }


  /**
   * Creates a link between the source and the target item and backwards, when backType is set.
   * @param source Source item
   * @param target Target item
   * @param type Type of the link
   * @param backType Type of the back link
   */
  async _createLink(source : ObjectId, target : ObjectId, type : string, backType ?: string) {
    // check item to available
    if (await this._getItemEntryById(source) === null || await this._getItemEntryById(target) === null)
      throw new ApiError(HttpStatusCode.NOT_FOUND);
    // create commit
    const commit = await DBClient._createCommit(this.authKey);
    // update source
    const sourceDoc = await this._incrementDocument(commit.previous, commit.id, source, (document : any) => {
      this._writeLinkIntoDocument(document, target, type);
    });
    // update commit base
    commit.base.find(d => d.item.toHexString() === source.toHexString()).document = sourceDoc.insertedId;
    // if back type is set ...
    let targetDocId = null;
    if (backType) {
      // update target
      const targetDoc = await this._incrementDocument(commit.previous, commit.id, target, (document: any) => {
        this._writeLinkIntoDocument(document, source, backType);
      });
      // set target doc id
      targetDocId = targetDoc.insertedId;
      // update target base
      commit.base.find(d => d.item.toHexString() === target.toHexString()).document = targetDocId;
    }
    // update commit
    await DBClient._updateCommit(commit.id, commit.base);
    // return docs and commit
    return { _source: sourceDoc.insertedId, _target: targetDocId, _commit: commit.id };
  }


  /**
   * Delete item recursively (sub items which are linked by "owned")
   * @param itemId Item ID
   * @param commit New commit ID
   * @param previousCommit Previous commit ID
   */
  async _deleteItemsRecursively(itemId : ObjectId, commit : ObjectId, previousCommit: ObjectId) {
    // get item links
    const doc = await this._getDocumentByItemAndCommit(previousCommit, itemId);
    // throw if not found
    const delIds = await Promise.all(doc._links.filter((l : any) => l.type === 'owns').map(async (l: any) => {
      return this._deleteItemsRecursively(l.target, commit, previousCommit);
    }));
    // delete item
    await this._markItemAsDeleted(itemId, commit);
    // return ID array
    return [itemId, ...delIds.flat(Infinity)];
  }


  /**
   * Deletes the item given by its ID
   * @param itemId Item to be deleted
   */
  async _deleteItemById(itemId : ObjectId) {
    // create commit
    const commit = await DBClient._createCommit(this.authKey);
    // delete recursively
    const ids = await this._deleteItemsRecursively(itemId, commit.id, commit.previous);
    // remove from base
    ids.forEach(id => {
      commit.base.remove(d => d.item.toHexString() === id.toHexString());
    });
    // save base
    await DBClient._updateCommit(commit.id, commit.base);
    // return id
    return {_ids: ids, _commit: commit.id.toHexString()};
  }


  async getAllLatest() {
    return await DBClient.commitsCollection.aggregate([
      { $match: { isHead: true }},
      ...DBClient._generateDocumentsAggregate(),
      { $sort: { rank: 1 }}
    ]).toArray();
  }

  async getAllByCommit(commit : string) {
    return await DBClient.commitsCollection.aggregate([
      { $match: { _id: new ObjectId(commit) }},
      ...DBClient._generateDocumentsAggregate(),
      { $sort: { rank: 1 }}
    ]).toArray();
  }

  async deleteById(id : string) {
    // create commit
    const commit = await DBClient._createCommit(this.authKey);
    // delete item
    const itemId = new ObjectId(id);
    await this._markItemAsDeleted(itemId, commit.id);
    // delete from base
    commit.base.splice(commit.base.findIndex(d => d.item.toHexString() === id), 1);
    await DBClient._updateCommit(commit.id, commit.base);
    // return id
    return {_id: itemId.toHexString(), _commit: commit.id.toHexString()};
  }

  async deleteAllLatest() {
    // create commit
    const commit = await DBClient._createCommit(this.authKey);
    const commitId = commit.id;
    // get IDs
    const ids = await DBClient.itemsCollection
      .find({ deletionCommit: null })
      .map(e => e._id)
      .toArray();
    // delete an item, by setting the deletionCommit field
    await DBClient.itemsCollection.updateMany({
      deletionCommit: null
    }, {
      $set: {
        deletionCommit: commitId
      }
    });
    // delete many from base
    ids.map(deleted => {
      commit.base.splice(commit.base.findIndex(i => i.item.toHexString() === deleted.toHexString()), 1);
    });
    await DBClient._updateCommit(commit.id, commit.base);
    // return IDs
    return {_ids: ids.map(i => i.toHexString()), _commit: commitId};
  }

  async updateById(itemId : string, body : BodyType) {
    // get item id
    const item = new ObjectId(itemId);
    // check item
    if (await this._getItemEntryById(item) === null)
      throw new ApiError(HttpStatusCode.NOT_FOUND);
    // create commit
    const commit = await DBClient._createCommit(this.authKey);
    // insert document
    const doc = await this._insertDocumentEntry(body, item, commit.id);
    // update commit
    commit.base.find(d => d.item.toHexString() === itemId).document = doc.insertedId;
    await DBClient._updateCommit(commit.id, commit.base);
    // update commit
    return { _document: doc.insertedId.toHexString(), _commit: commit.id.toHexString() };
  }

  async patchFieldsById(itemId : string, fields : BodyType) {
    return this._updateItem(new ObjectId(itemId), async (document : any) => {
      document.fields = fields;
    });
  }

  async deleteLink(id : string, target : string, type : string, backType : string | undefined) {
    // update, TODO: test to added twice (should be added once)
    return this._updateItem(new ObjectId(id), async (document : any) => {
      // TODO
    })
  }

  async resetHead(commitId : string | undefined) {
    // get commit
    let commit : any;
    if (commitId)
      commit = await DBClient.commitsCollection.findOne({_id: new ObjectId(commitId)});
    else
      commit = (await DBClient.commitsCollection.find({}).sort({_id:-1}).limit(1).toArray())[0];
    // check commit
    if (!commit)
      throw new ApiError(HttpStatusCode.NOT_FOUND);
    // unset all other
    await DBClient.commitsCollection.updateOne({isHead: true}, {$set: {isHead: false}});
    // set commit as head
    await DBClient.commitsCollection.updateOne({_id: commit._id}, {$set: {isHead: true}});
    // send commit id
    return {commit: commit._id.toHexString()};
  }

  static async _createCommit(authorId : ObjectId) {
    // get last commit
    const prev = (await DBClient.commitsCollection.findOne({isHead: true}));
    // create commit
    const commit = await DBClient.commitsCollection.insertOne({
      date: new Date(),
      previous: prev?._id || null,
      documents: null,
      author: authorId,
      isHead: true
    });
    // update previous
    prev && await this.commitsCollection.updateOne({_id : prev._id}, {$set : {isHead: false}});
    // return id
    return {id: commit.insertedId, base: (prev?.documents || []) as ItemDocList, previous : prev?._id};
  }

  static async _updateCommit(commitId : ObjectId, documents : ItemDocList) {
    // save documents
    await this.commitsCollection.updateOne({_id: commitId}, { $set: { documents : documents } });
  }

  protected static _generateDocumentsAggregate () {
    return [
      { $unwind: '$documents' },
      { $lookup: {
          from: DOCUMENTS_COLLECTION_NAME,
          localField: "documents.document",
          foreignField: "_id",
          as: "document"
        }},
      { $unwind: '$document' },
      { $lookup: {
          from: ITEMS_COLLECTION_NAME,
          localField: "documents.item",
          foreignField: "_id",
          as: "item"
        }},
      { $unwind: '$item' },
      { $lookup: {
          from: COMMITS_COLLECTION_NAME,
          localField: "item.creationCommit",
          foreignField: "_id",
          as: "creationCommit"
        }},
      { $unwind: '$creationCommit' },
      { $lookup: {
          from: COMMITS_COLLECTION_NAME,
          localField: "document._commit",
          foreignField: "_id",
          as: "updateCommit"
        }},
      { $unwind: '$updateCommit' },
      { $project: {
          _id: '$documents.item',
          project: "$document.project",
          title: "$document.title",
          labels: "$document.labels",
          rank: "$document.rank",
          links: "$document.links",
          tags: "$document.tags",
          fields: "$document.fields",
          changed: {
            date: "$updateCommit.date",
            author: "$updateCommit.author",
            commit: "$updateCommit._id",
          },
          created: {
            date: "$creationCommit.date",
            author: "$creationCommit.author",
            commit: "$creationCommit._id",
          }
        }},
    ]
  }


}