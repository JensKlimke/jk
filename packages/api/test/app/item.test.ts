import App, {init, terminate} from "../../src/app";
import request = require('supertest')
import {DBClient} from "../../src/utils/mongo";
import HttpStatusCode from "../../src/utils/HttpStatusCode";
import {ObjectId} from "mongodb";
import httpStatusCode from "../../src/utils/HttpStatusCode";

describe('User Endpoints', () => {

  let author : string;

  let firstItem : string;
  let nextItems : string[];
  let fifthItem : string;
  let sixthItem : string;

  let firstDocument : string;

  let firstCommit : string;
  let secondCommit : string;
  let thirdCommit : string;
  let fourthCommit : string;
  let fifthCommit : string;
  let sixthCommit : string;
  let seventhCommit : string;

  beforeAll(async () => {
    // init
    await init();
    // empty collections
    await DBClient.commitsCollection.deleteMany({});
    await DBClient.itemsCollection.deleteMany({});
    await DBClient.documentsCollection.deleteMany({});
  });

  afterAll(async () => {
    // terminate
    await terminate();
  });


  test('PATCH /v1/items/head should return 404', async () => {
    let res = await request(App)
      .patch(`/v1/items/head`)
      .set('authorization', 'test');
    // check status
    expect(res.status).toBe(httpStatusCode.NOT_FOUND);
  });

  test('POST /v1/items should add item', async () => {
    let res = await request(App)
      .post('/v1/items')
      .send({
        project: 'test-project',
        title: 'First item',
        rank: 0,
      })
      .set('authorization', 'test');
    // check status
    expect(res.status).toBe(HttpStatusCode.CREATED);
    // check properties
    expect(res.body).toHaveProperty('_id');
    expect(res.body).toHaveProperty('_document');
    expect(res.body).toHaveProperty('_commit');
    // save ID and commit
    firstItem = res.body._id;
    firstCommit = res.body._commit;
    const firstDocument = res.body._document;
    // check content
    const item = await DBClient.itemsCollection.findOne({_id: new ObjectId(firstItem)});
    const document = await DBClient.documentsCollection.findOne({_id: new ObjectId(firstDocument)});
    const commit = await DBClient.commitsCollection.findOne({_id: new ObjectId(firstCommit)});
    // save author
    author = commit.author.toHexString();
    // check item
    expect(item).toEqual({
      _id: new ObjectId(firstItem),
      creationCommit: new ObjectId(firstCommit),
      deletionCommit: null,
    });
    // check document
    expect(document).toEqual({
      _id: new ObjectId(firstDocument),
      project: 'test-project',
      title: 'First item',
      rank: 0,
      labels: [],
      links: [],
      tags: {},
      fields: {},
      _item: new ObjectId(firstItem),
      _commit: new ObjectId(firstCommit)
    });
    // check commit
    expect(commit).toEqual({
      _id: new ObjectId(firstCommit),
      date: commit.date,
      previous: null,
      documents: [{ document: new ObjectId(firstDocument), item: new ObjectId(firstItem) }],
      author: new ObjectId(author),
      isHead: true
    });
  });

  test('PUT /v1/items/:id should update item', async () => {
    let res = await request(App)
      .put(`/v1/items/${firstItem}`)
      .send({
        project: 'test-project',
        title: 'First updated item',
        rank: 0,
      })
      .set('authorization', 'test')
    // check status
    expect(res.status).toBe(HttpStatusCode.OK);
    // check properties
    expect(res.body).toHaveProperty('_commit');
    expect(res.body).toHaveProperty('_document');
    // get commit
    secondCommit = res.body._commit;
    // check content
    const item = await DBClient.itemsCollection.findOne({_id: new ObjectId(firstItem)});
    const documents = await DBClient.documentsCollection
      .find({_item: new ObjectId(firstItem)})
      .sort({_id : 1})
      .toArray();
    const commits = await DBClient.commitsCollection.find({}).toArray();
    // check item
    expect(item).toEqual({
      _id: new ObjectId(firstItem),
      creationCommit: new ObjectId(firstCommit),
      deletionCommit: null,
    });
    // check document
    expect(documents.length).toBe(2);
    // check first object
    expect(documents[0].title).toEqual('First item');
    expect(documents[0]._commit).toEqual(new ObjectId(firstCommit));
    // check second object
    expect(documents[1].title).toEqual('First updated item');
    expect(documents[1]._commit).toEqual(new ObjectId(secondCommit));
    // save document
    firstDocument = documents[1]._id.toHexString();
    // check commit
    expect(commits[0]).toEqual({
      _id: new ObjectId(firstCommit),
      date: commits[0].date,
      previous: null,
      documents: [{ document: new ObjectId(documents[0]._id), item: new ObjectId(firstItem) }],
      author: new ObjectId(author),
      isHead: false
    });
    expect(commits[1]).toEqual({
      _id: new ObjectId(secondCommit),
      date: commits[1].date,
      previous: new ObjectId(firstCommit),
      documents: [{ document: new ObjectId(documents[1]._id), item: new ObjectId(firstItem) }],
      author: new ObjectId(author),
      isHead: true
    });
  });

  test('POST /v1/items/batch should add 3 items', async () => {
    let res = await request(App)
      .post('/v1/items/batch')
      .send([{
        project: 'test-project-2',
        title: 'Second item',
        rank: 1,
      }, {
        project: 'test-project-2',
        title: 'Third item',
        rank: 2,
      }, {
        project: 'test-project',
        title: 'Fourth item',
        rank: 3,
      }])
      .set('authorization', 'test');
    // check status
    expect(res.status).toBe(HttpStatusCode.CREATED);
    // save commits
    nextItems = res.body._ids;
    const docs = res.body._documents;
    thirdCommit = res.body._commit;
    // check size of arrays
    expect(nextItems.length).toBe(3);
    expect(docs.length).toBe(3);
    // get commit
    const commit = await DBClient.commitsCollection.findOne({_id: new ObjectId(thirdCommit)});
    const documents = await DBClient.documentsCollection
      .find({_commit: new ObjectId(thirdCommit)})
      .sort({ rank: 1 })
      .toArray();
    // check documents
    expect(documents.length).toBe(3);
    expect(documents[0].title).toEqual('Second item');
    expect(documents[0]._item).toEqual(new ObjectId(nextItems[0]));
    expect(documents[1].title).toEqual('Third item');
    expect(documents[1]._item).toEqual(new ObjectId(nextItems[1]));
    expect(documents[2].title).toEqual('Fourth item');
    expect(documents[2]._item).toEqual(new ObjectId(nextItems[2]));
    // check commit
    expect(commit).toEqual({
      _id: new ObjectId(thirdCommit),
      date: commit.date,
      previous: new ObjectId(secondCommit),
      documents: [
        { document: new ObjectId(firstDocument), item: new ObjectId(firstItem) },
        { document: new ObjectId(documents[0]._id), item: new ObjectId(nextItems[0]) },
        { document: new ObjectId(documents[1]._id), item: new ObjectId(nextItems[1]) },
        { document: new ObjectId(documents[2]._id), item: new ObjectId(nextItems[2]) }
      ],
      author: new ObjectId(author),
      isHead: true
    });
  });

  test('GET /v1/items/:id should return the latest document of item', async () => {
    let res = await request(App)
      .get(`/v1/items/${firstItem}`)
      .set('authorization', 'test');
    // check status
    expect(res.status).toBe(httpStatusCode.OK);
    // check object
    expect(res.body).toEqual({
      _id: firstItem,
      project: 'test-project',
      title: 'First updated item',
      labels: [],
      rank: 0,
      links: [],
      tags: {},
      fields: {},
      changed: {
        date: res.body.changed.date,
        author: author,
        commit: secondCommit
      },
      created: {
        date: res.body.created.date,
        author: author,
        commit: firstCommit
      }
    })
  });

  test('GET /v1/items should return the latest documents of all items', async () => {
    let res = await request(App)
      .get('/v1/items')
      .set('authorization', 'test');
    // check status
    expect(res.status).toBe(httpStatusCode.OK);
    // check body
    expect(res.body.length).toBe(4);
    // check items by order
    expect(res.body[0].title).toEqual('First updated item');
    expect(res.body[1].title).toEqual('Second item');
    expect(res.body[2].title).toEqual('Third item');
    // check properties
    expect(res.body[0]).toHaveProperty('changed');
    expect(res.body[0]).toHaveProperty('created');
    expect(res.body[1]).toHaveProperty('changed');
    expect(res.body[1]).toHaveProperty('created');
    expect(res.body[2]).toHaveProperty('changed');
    expect(res.body[2]).toHaveProperty('created');
  });


  test('PUT /v1/items/:unknown_id should throw error', async () => {
    let res = await request(App)
      .put('/v1/items/1234a5678b9012c3456d7890')
      .send({
        project: 'test-project',
        title: 'First updated item',
      })
      .set('authorization', 'test')
    // check code and text
    expect(res.status).toBe(HttpStatusCode.NOT_FOUND);
    expect(res.text).toEqual('Not Found');
  });

  test('DELETE /v1/items/:id should delete item', async () => {
    const res = await request(App)
      .delete(`/v1/items/${firstItem}`)
      .set('authorization', 'test');
    // check code
    expect(res.status).toBe(httpStatusCode.OK);
    // check content
    expect(res.body).toHaveProperty('_id');
    expect(res.body).toHaveProperty('_commit');
    expect(res.body._id).toEqual(firstItem);
    // save commit
    fourthCommit = res.body._commit;
  });

  test('PUT /v1/items/:id should update a second item', async () => {
    let res = await request(App)
      .put(`/v1/items/${nextItems[0]}`)
      .send({
        project: 'test-project',
        title: 'Second updated item',
        rank: 1,
      })
      .set('authorization', 'test');
    // check code
    expect(res.status).toBe(HttpStatusCode.OK);
    // save commit
    fifthCommit = res.body._commit;
  });

  test('DELETE /v1/items/batch should delete all items', async () => {
    const res = await request(App)
      .delete('/v1/items/batch')
      .set('authorization', 'test');
    // check status
    expect(res.status).toBe(httpStatusCode.OK);
    // check content
    expect(res.body).toHaveProperty('_ids');
    expect(res.body).toHaveProperty('_commit');
    expect(res.body._ids.length).toEqual(3);
    // save commit
    sixthCommit = res.body._commit;
  });

  test('POST /v1/items should add another item', async () => {
    let res = await request(App)
      .post('/v1/items')
      .send({
        project: 'test-project-3',
        title: 'Fifth item',
        rank: 5,
      })
      .set('authorization', 'test');
    // check status
    expect(res.status).toBe(HttpStatusCode.CREATED);
    // check content
    expect(res.body).toHaveProperty('_id');
    expect(res.body).toHaveProperty('_commit');
    // save id
    fifthItem = res.body._id;
    seventhCommit = res.body._commit;
  });

  test('GET /v1/items/commit/:commitId should return the documents of items at the first commit', async () => {
    let res = await request(App)
      .get(`/v1/items/commit/${firstCommit}`)
      .set('authorization', 'test');
    // check status
    expect(res.status).toBe(httpStatusCode.OK);
    // check content
    expect(res.body.length).toBe(1);
    // check element
    expect(res.body[0]).toEqual({
      _id: firstItem,
      project: 'test-project',
      title: 'First item',
      labels: [],
      rank: 0,
      links: [],
      tags: {},
      fields: {},
      changed: {
        date: res.body[0].changed.date,
        author: author,
        commit: firstCommit,
      },
      created: {
        date: res.body[0].created.date,
        author: author,
        commit: firstCommit,
      }
    });
  });

  test('GET /v1/items/commit/:commitId should return the documents of items at the second commit', async () => {
    let res = await request(App)
      .get(`/v1/items/commit/${secondCommit}`)
      .set('authorization', 'test');
    // check status
    expect(res.status).toBe(httpStatusCode.OK);
    // check content
    expect(res.body.length).toBe(1);
    // check element
    expect(res.body[0]).toEqual({
      _id: firstItem,
      project: 'test-project',
      title: 'First updated item',
      labels: [],
      rank: 0,
      links: [],
      tags: {},
      fields: {},
      changed: {
        date: res.body[0].changed.date,
        author: author,
        commit: secondCommit,
      },
      created: {
        date: res.body[0].created.date,
        author: author,
        commit: firstCommit,
      }
    });
  });

  test('GET /v1/items/commit/:commitId should return the documents of items at the third commit', async () => {
    let res = await request(App)
      .get(`/v1/items/commit/${thirdCommit}`)
      .set('authorization', 'test');
    // check status
    expect(res.status).toBe(httpStatusCode.OK);
    // check content
    expect(res.body.length).toBe(4);
    // check IDs
    expect(res.body[0]._id).toEqual(firstItem);
    expect(res.body[1]._id).toEqual(nextItems[0]);
    expect(res.body[2]._id).toEqual(nextItems[1]);
    expect(res.body[3]._id).toEqual(nextItems[2]);
  });

  test('GET /v1/items/commit/:commitId should return the documents of items at the fourth commit', async () => {
    let res = await request(App)
      .get(`/v1/items/commit/${fourthCommit}`)
      .set('authorization', 'test');
    // check status
    expect(res.status).toBe(httpStatusCode.OK);
    // check content
    expect(res.body.length).toBe(3);
    // check IDs
    expect(res.body[0]._id).toEqual(nextItems[0]);
    expect(res.body[1]._id).toEqual(nextItems[1]);
    expect(res.body[2]._id).toEqual(nextItems[2]);
  });

  test('GET /v1/items/commit/:commitId should return the documents of items at the fifth commit', async () => {
    let res = await request(App)
      .get(`/v1/items/commit/${fifthCommit}`)
      .set('authorization', 'test');
    // check status
    expect(res.status).toBe(httpStatusCode.OK);
    // check content
    expect(res.body.length).toBe(3);
  });

  test('GET /v1/items/commit/:commitId should return the documents of items at the sixth commit', async () => {
    let res = await request(App)
      .get(`/v1/items/commit/${sixthCommit}`)
      .set('authorization', 'test');
    // check status
    expect(res.status).toBe(httpStatusCode.OK);
    // check content
    expect(res.body.length).toBe(0);
  });

  test('GET /v1/items/commit/:commitId should return the documents of items at the seventh commit', async () => {
    let res = await request(App)
      .get(`/v1/items/commit/${seventhCommit}`)
      .set('authorization', 'test');
    // check status
    expect(res.status).toBe(httpStatusCode.OK);
    // check content
    expect(res.body.length).toBe(1);
    expect(res.body[0]._id).toEqual(fifthItem);
  });

  test('PATCH /v1/items/head/:commitId should reset head to commit', async () => {
    let res = await request(App)
      .patch(`/v1/items/head/${thirdCommit}`)
      .set('authorization', 'test');
    // check status
    expect(res.status).toBe(httpStatusCode.OK);
    // check content
    expect(res.body).toEqual({ commit: thirdCommit });
    // get items
    res = await request(App)
      .get('/v1/items')
      .set('authorization', 'test');
    // check items
    expect(res.body.length).toBe(4);
    expect(res.body[0]._id).toEqual(firstItem);
    expect(res.body[1]._id).toEqual(nextItems[0]);
    expect(res.body[2]._id).toEqual(nextItems[1]);
    expect(res.body[3]._id).toEqual(nextItems[2]);
    // check commits
    expect(res.body[0].changed.commit).toEqual(secondCommit);
    expect(res.body[0].created.commit).toEqual(firstCommit);
    expect(res.body[1].changed.commit).toEqual(thirdCommit);
    expect(res.body[1].created.commit).toEqual(thirdCommit);
    expect(res.body[2].changed.commit).toEqual(thirdCommit);
    expect(res.body[2].created.commit).toEqual(thirdCommit);
    expect(res.body[3].changed.commit).toEqual(thirdCommit);
    expect(res.body[3].created.commit).toEqual(thirdCommit);
  });

  test('PATCH /v1/items/head/:commitId should reset head to commit', async () => {
    let res = await request(App)
      .patch(`/v1/items/head/${fourthCommit}`)
      .set('authorization', 'test');
    // check status
    expect(res.status).toBe(httpStatusCode.OK);
    // check content
    expect(res.body).toEqual({ commit: fourthCommit });
    // get items
    res = await request(App)
      .get('/v1/items')
      .set('authorization', 'test');
    // check items
    expect(res.body.length).toBe(3);
    expect(res.body[0]._id).toEqual(nextItems[0]);
    expect(res.body[1]._id).toEqual(nextItems[1]);
    expect(res.body[2]._id).toEqual(nextItems[2]);
    // check commits
    expect(res.body[0].changed.commit).toEqual(thirdCommit);
    expect(res.body[0].created.commit).toEqual(thirdCommit);
    expect(res.body[1].changed.commit).toEqual(thirdCommit);
    expect(res.body[1].created.commit).toEqual(thirdCommit);
    expect(res.body[2].changed.commit).toEqual(thirdCommit);
    expect(res.body[2].created.commit).toEqual(thirdCommit);
  });

  test('PATCH /v1/items/head should reset head to latest', async () => {
    let res = await request(App)
      .patch(`/v1/items/head`)
      .set('authorization', 'test');
    // check status
    expect(res.status).toBe(httpStatusCode.OK);
    // check content
    expect(res.body).toEqual({ commit: seventhCommit });
    // get items
    res = await request(App)
      .get('/v1/items')
      .set('authorization', 'test');
    // check items
    expect(res.body.length).toBe(1);
    expect(res.body[0]._id).toEqual(fifthItem);
    expect(res.body[0].created.commit).toEqual(seventhCommit);
    expect(res.body[0].changed.commit).toEqual(seventhCommit);
  });

  test('PATCH /v1/items/:id should update fields', async () => {
    let res = await request(App)
      .patch(`/v1/items/${fifthItem}`)
      .send({
        field1: 'A',
        field2: 'B',
      })
      .set('authorization', 'test');
    // check result
    expect(res.status).toBe(httpStatusCode.OK);
    // get document
    res = await request(App)
      .get(`/v1/items`)
      .set('authorization', 'test');
    // check fields
    expect(res.body.length).toBe(1);
    expect(res.body[0].fields).toEqual({
      field1: 'A',
      field2: 'B'
    });
  });

  test('POST /v1/items/link/:id should create link', async () => {
    // create new item
    let res = await request(App)
      .post(`/v1/items/`)
      .send({
        project: 'test',
        title: '6th item',
        rank: 6
      })
      .set('authorization', 'test');
    // check result
    expect(res.status).toBe(httpStatusCode.CREATED);
    sixthItem = res.body._id;
    // link items
    res = await request(App)
      .post(`/v1/items/link/${fifthItem}/${sixthItem}`)
      .set('authorization', 'test');
    console.log(res.body);
    expect(res.status).toBe(httpStatusCode.CREATED);
  });



});