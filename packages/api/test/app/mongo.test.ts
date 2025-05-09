import {init, terminate} from "../../src/app";
import {DBClient} from "../../src/utils/mongo";
import {ObjectId} from "mongodb";
import ApiError from "../../src/utils/ApiError";

describe('Database Modules', () => {

  let client : DBClient = undefined;
  let authKey = new ObjectId(100);
  let fakeAuthKey = new ObjectId(101);

  beforeAll(async () => {
    // init
    await init();
    // create client and set fake user
    client = new DBClient(DBClient.documentsCollection);
  })

  beforeEach(async () => {
    // empty collections
    await DBClient.commitsCollection.deleteMany({});
    await DBClient.itemsCollection.deleteMany({});
    await DBClient.documentsCollection.deleteMany({});
    // set auth
    client.setAuth(authKey.toString());
  });

  afterAll(async () => {
    // terminate
    await terminate();
  });


  test('Clean data object', () => {
    const res = DBClient._cleanDataObject({_id: 'abc', field: 'A', _commit: 'efg', number: 10});
    expect(res).toEqual({field: 'A', number: 10});
  });


  test('Insert document', async () => {
    // generate IDs
    const commit = new ObjectId(0);
    const item = new ObjectId(1);
    // insert document
    const ins = await client._insertDocumentEntry({field: 'A'}, item, commit);
    expect(ins.acknowledged).toBeTruthy();
    expect(ins.insertedId).toBeDefined();
    // get document
    const res = await DBClient.documentsCollection.find({}).toArray();
    expect(res.length).toBe(1);
    expect(res[0]).toEqual({
      _id: ins.insertedId,
      field: 'A',
      _commit: commit,
      _item: item,
      _links: []
    });
  });


  test('Insert item', async () => {
    // generate commit id
    const commitId = new ObjectId(0);
    // insert item
    const ins = await client._insertItem({field: 'A'}, commitId);
    expect(ins.item.acknowledged).toBeTruthy();
    expect(ins.item.insertedId).toBeDefined();
    expect(ins.document.acknowledged).toBeTruthy();
    expect(ins.document.insertedId).toBeDefined();
    // check document
    let res = await DBClient.documentsCollection.find({}).toArray();
    expect(res.length).toBe(1);
    expect(res[0]).toEqual({
      _id: ins.document.insertedId,
      _commit: commitId,
      _item: ins.item.insertedId,
      _links: [],
      field: 'A'
    });
    // check items
    res = await DBClient.itemsCollection.find({}).toArray();
    expect(res.length).toBe(1);
    // get item
    const item = await client._getItemEntryById(ins.item.insertedId);
    expect(item).toEqual({
      _id: ins.item.insertedId,
      auth: authKey,
      creationCommit: commitId,
      deletionCommit: null
    });
  });


  test('Mark item as deleted', async () => {
    // generate commit ids
    const commitId0 = new ObjectId(0);
    const commitId1 = new ObjectId(1);
    // insert item
    const ins = await client._insertItem({field: 'A'}, commitId0);
    // delete item
    await client._markItemAsDeleted(ins.item.insertedId, commitId1);
    // check document
    let res = await DBClient.documentsCollection.find({}).toArray();
    expect(res.length).toBe(1);
    // check item
    res = await DBClient.itemsCollection.find({}).toArray();
    expect(res.length).toBe(1);
    // get item
    let item = await client._getItemEntryById(ins.item.insertedId);
    expect(item).toBeNull();
    // get item
    item = await client._getItemEntryById(ins.item.insertedId, false);
    expect(item).toEqual({
      _id: ins.item.insertedId,
      auth: authKey,
      creationCommit: commitId0,
      deletionCommit: commitId1
    });
  });


  test('Try to mark non-owned item as deleted', async () => {
    // generate commit ids
    const commitId0 = new ObjectId(0);
    const commitId1 = new ObjectId(1);
    // insert item
    const ins = await client._insertItem({field: 'A'}, commitId0);
    // set auth
    client.setAuth(fakeAuthKey.toString());
    // callback to execute function
    const t = async () => {
      // try to delete item
      await client._markItemAsDeleted(ins.item.insertedId, commitId1);
    };
    // check for error
    await expect(t).rejects.toThrow(ApiError);
  });


  test('Add and get item and try to access with different auth', async () => {
    // add item
    const ins = await client._addItem({'field': 'A'});
    // check id, commit ID, document ID
    expect(ins).toHaveProperty('_item');
    expect(ins).toHaveProperty('_commit');
    expect(ins).toHaveProperty('_document');
    // generate ID objects
    const item = ins._item;
    // get item
    const res = await client._getDocumentByItemAndCommit(ins._commit, item);
    expect(res).toEqual({
      _id: ins._document,
      field: 'A',
      _item: item,
      _commit: ins._commit,
      _links: []
    });
    // set client to a different user
    client.setAuth(fakeAuthKey.toString());
    // callback to execute function
    const t = async () => {
      await client._getDocumentByItemAndCommit(ins._commit, item);
    };
    // check for error
    await expect(t).rejects.toThrow(ApiError);
  });


  test('Get unknown item', async () => {
    // callback to execute function
    const t = async () => {
      await client._getDocumentByItemAndCommit(new ObjectId(0), new ObjectId(1));
    };
    // check for error
    await expect(t).rejects.toThrow(ApiError);
  });


  test('Add multiple items', async () => {
    // add item
    const ins = await client._addManyItems([{field : 'A'}, {field : 'B'}]);
    // check IDs, commit ID, document IDs
    expect(ins).toHaveProperty('_items');
    expect(ins).toHaveProperty('_documents');
    expect(ins).toHaveProperty('_commit');
    // generate ID objects
    const docs = ins._documents;
    const items = ins._items;
    const commit = ins._commit;
    // get first item
    let res = await client._getDocumentByItemAndCommit(commit, items[0]);
    // check item
    expect(res).toEqual({
      _id: docs[0],
      _item: items[0],
      _commit: commit,
      _links: [],
      field: 'A',
    });
    // get second item
    res = await client._getDocumentByItemAndCommit(commit, items[1]);
    // check item
    expect(res).toEqual({
      _id: docs[1],
      field: 'B',
      _item: items[1],
      _commit: commit,
      _links: []
    });
  });


  test('Add and update item', async () => {
    // add item
    const ins = await client._addItem({'field': 'A'});
    // update callback
    const update = async (doc : any) => {
      doc.field = 'B';
    }
    // get item and check content
    const res = await client._updateItem(ins._item, update);
    expect(res).toHaveProperty('_commit');
    expect(res).toHaveProperty('_document');
    // get document
    const doc = await client._getDocumentByItemAndCommit(res._commit, ins._item);
    expect(doc).toEqual({
      _id: res._document,
      field: 'B',
      _commit: res._commit,
      _item: ins._item,
      _links: []
    });
    // set auth
    client.setAuth(fakeAuthKey.toString());
    // callback to execute function
    const t = async () => {
      await client._updateItem(ins._item, update);
    };
    // check for error
    await expect(t).rejects.toThrow(ApiError);
  });


  test('Add and link items, update and delete parent', async () => {
    // add item
    const insParent = await client._addItem({'type': 'parent'});
    const insChild = await client._addItem({'type': 'child'});
    const insGrandchild = await client._addItem({'type': 'grandchild'});
    // link items
    const link = await client._createLink(insParent._item, insChild._item, 'owns', 'owned_by');
    const sublink = await client._createLink(insChild._item, insGrandchild._item, 'owns', 'owned_by');
    // check result
    expect(link).toHaveProperty('_source');
    expect(link).toHaveProperty('_target');
    expect(link).toHaveProperty('_commit');
    expect(sublink).toHaveProperty('_source');
    expect(sublink).toHaveProperty('_target');
    expect(sublink).toHaveProperty('_commit');
    // get parent item
    let res = await client._getDocumentByItemAndCommit(sublink._commit, insParent._item);
    // check parent item
    expect(res).toEqual({
      _id: link._source,
      _item: insParent._item,
      _commit: link._commit,
      _links: [{ type: 'owns', target: insChild._item }],
      type: 'parent'
    });
    // get child item
    res = await client._getDocumentByItemAndCommit(sublink._commit, insChild._item);
    // check child item
    expect(res).toEqual({
      _id: sublink._source,
      _item: insChild._item,
      _commit: sublink._commit,
      _links: [
        { type: 'owned_by', target: insParent._item },
        { type: 'owns', target: insGrandchild._item }
      ],
      type: 'child'
    });
    // get grandchild item
    res = await client._getDocumentByItemAndCommit(sublink._commit, insGrandchild._item);
    // check child item
    expect(res).toEqual({
      _id: sublink._target,
      _item: insGrandchild._item,
      _commit: sublink._commit,
      _links: [{ type: 'owned_by', target: insChild._item }],
      type: 'grandchild'
    });
    // delete parent to check if child is deleted
    let del = await client._deleteItemById(insParent._item);
    // check deleted ids
    expect(del._ids.length).toBe(3);
    // delete again (should throw error)
    const t = async () => {
      await client._deleteItemById(insParent._item);
    };
    // check for error
    await expect(t).rejects.toThrow(ApiError);
  });


  test('Check errors', async () => {
    // add item
    const insParent = await client._addItem({'type': 'parent'});
    const insChild = await client._addItem({'type': 'child'});
    // try to link unknown item
    let t = async () => {
      await client._createLink(insParent._item, new ObjectId(0), 'owns');
    };
    // check for error
    await expect(t).rejects.toThrow(ApiError);
    // try to link unknown item
    t = async () => {
      await client._createLink(new ObjectId(0), insChild._item, 'owns');
    };
    // check for error
    await expect(t).rejects.toThrow(ApiError);
  });


  test('Get head document by item ID', async () => {
    // add items
    const insParent = await client._addItem({'type': 'parent'});
    const insChild = await client._addItem({'type': 'child'});
    // link items
    const link = await client._createLink(insParent._item, insChild._item, 'owns');
    // get head document from parents
    const res = await client._getHeadDocumentByItem(insParent._item);
    // check
    expect(res).toEqual({
      _id: link._source,
      _item: insParent._item,
      _commit: link._commit,
      _links: [{ target: insChild._item, type: 'owns' }],
      type: "parent"
    });
  });


  test('Link and unlink documents', async () => {
    // add items
    const insParent = await client._addItem({'type': 'parent'});
    const insChild = await client._addItem({'type': 'child'});
    // link items
    const link = await client._createLink(insParent._item, insChild._item, 'owns');
    // check target document to be created document (doesn't change, since no back link)
    expect(link._target.toString()).toEqual(insChild._document.toString());
    // get head document from parents
    let res = await client._getAllHeadDocuments();
    // check
    expect(res).toEqual([{
        _id: link._source,
        _item: insParent._item,
        _commit: link._commit,
        _links: [{ target: insChild._item, type: 'owns' }],
        type: "parent"
      }, {
        _id: insChild._document,
        _item: insChild._item,
        _commit: insChild._commit,
        _links: [],
        type: "child"
    }]);
    // get head document from parents
    res = await client._getAllByCommit(insChild._commit);
    // check
    expect(res).toEqual([{
      _id: insParent._document,
      _item: insParent._item,
      _commit: insParent._commit,
      _links: [],
      type: "parent"
    }, {
      _id: insChild._document,
      _item: insChild._item,
      _commit: insChild._commit,
      _links: [],
      type: "child"
    }]);
    // unlink items
    const unlink = await client._deleteLink(insParent._item, insChild._item, 'owns');
    // get head document from parents
    res = await client._getAllHeadDocuments();
    // check
    expect(res).toEqual([{
      _id: unlink._source,
      _item: insParent._item,
      _commit: unlink._commit,
      _links: [],
      type: "parent"
    }, {
      _id: insChild._document,
      _item: insChild._item,
      _commit: insChild._commit,
      _links: [],
      type: "child"
    }]);
  });


  test('Link and unlink documents (bi-directional)', async () => {
    // add items
    const insParent = await client._addItem({'type': 'parent'});
    const insChild = await client._addItem({'type': 'child'});
    // link items
    const link = await client._createLink(insParent._item, insChild._item, 'owns', 'owned_by');
    // get head document from parents
    let res = await client._getAllHeadDocuments();
    // check
    expect(res).toEqual([{
      _id: link._source,
      _item: insParent._item,
      _commit: link._commit,
      _links: [{ target: insChild._item, type: 'owns' }],
      type: "parent"
    }, {
      _id: link._target,
      _item: insChild._item,
      _commit: link._commit,
      _links: [{ target: insParent._item, type: 'owned_by' }],
      type: "child"
    }]);
    // unlink items
    const unlink = await client._deleteLink(insParent._item, insChild._item, 'owns', 'owned_by');
    // get head document from parents
    res = await client._getAllHeadDocuments();
    // check
    expect(res).toEqual([{
      _id: unlink._source,
      _item: insParent._item,
      _commit: unlink._commit,
      _links: [],
      type: "parent"
    }, {
      _id: unlink._target,
      _item: insChild._item,
      _commit: unlink._commit,
      _links: [],
      type: "child"
    }]);
  });


  test('Update item', async () => {
    // add item
    const ins = await client._addItem({'field1': 'A', 'field2': 'B'});
    // update item
    let upd = await client._updateDocumentById(ins._item, {'field1': 'C', 'field2': 'D'});
    // get result
    let res = await client._getHeadDocumentByItem(ins._item);
    // check
    expect(res).toEqual({
      _id: upd._document,
      _item: ins._item,
      _commit: upd._commit,
      _links: [],
      field1: 'C',
      field2: 'D'
    });
    // update item
    upd = await client._patchFieldsById(ins._item, {'field1' : 'F', 'field3': 'G'});
    // get result
    res = await client._getHeadDocumentByItem(ins._item);
    // check
    expect(res).toEqual({
      _id: upd._document,
      _item: ins._item,
      _commit: upd._commit,
      _links: [],
      field1: 'F',
      field2: 'D',
      field3: 'G'
    });
    // set client auth
    client.setAuth(fakeAuthKey.toHexString());
    // callback to execute function
    const t = async () => {
      await client._updateDocumentById(ins._item, {'type' : 'new new item'});
    };
    // check for error
    await expect(t).rejects.toThrow(ApiError);
  });


  test('Manage head', async () => {
    // add item
    const ins = await client._addItem({'field1': 'A'});
    // update item
    const c1 = await client._updateDocumentById(ins._item, {'field1': 'B'});
    const c2 = await client._updateDocumentById(ins._item, {'field1': 'C'});
    const c3 = await client._updateDocumentById(ins._item, {'field1': 'D'});
    // set head to second change
    await client._resetHead(c1._commit);
    // get head element
    let res = await client._getAllHeadDocuments();
    // check
    expect(res.length).toEqual(1);
    expect(res[0]).toEqual({
      _commit: c1._commit,
      _id: c1._document,
      _item: ins._item,
      _links: [],
      field1: 'B'
    });
    // set head to third change
    await client._resetHead(c2._commit);
    // get head element
    res = await client._getAllHeadDocuments();
    // check
    expect(res.length).toEqual(1);
    expect(res[0]).toEqual({
      _commit: c2._commit,
      _id: c2._document,
      _item: ins._item,
      _links: [],
      field1: 'C'
    });
    // set head to third change
    await client._resetHead();
    // get head element
    res = await client._getAllHeadDocuments();
    // check
    expect(res.length).toEqual(1);
    expect(res[0]).toEqual({
      _commit: c3._commit,
      _id: c3._document,
      _item: ins._item,
      _links: [],
      field1: 'D'
    });
    // callback to execute function
    const t = async () => {
      await client._resetHead(new ObjectId(0));
    };
    // check for error
    await expect(t).rejects.toThrow(ApiError);
  });


  test('Complex', async () => {
    // add item
    let insA = await client._addItem({'field1': 'A'});
    let insB = await client._addItem({'field1': 'B'});
    let insC = await client._addItem({'field1': 'C'});
  });

});
