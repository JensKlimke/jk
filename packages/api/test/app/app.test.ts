import App, {init, terminate} from "../../src/app";
import request = require('supertest')
import moment from "moment/moment";
import HttpStatusCode from "../../src/utils/HttpStatusCode";
import {dbItems} from "../../src/middlewares/database";
import {GITHUB_AUTHORIZE_URL, STATE_SECRET} from "../../src/config/env";
import jwt from "jsonwebtoken";
import {clearFakeSessions} from "../../src/utils/auth";

describe('User Endpoints', () => {

  beforeAll(async () => {
    await init();
    await clearFakeSessions(true);
    // clear all users
    await dbItems.users.deleteMany({});
  });

  afterAll(async () => {
    await terminate();
  });

  test('GET /whois should show system id', async () => {
    // delete the whois entry
    await dbItems.meta.deleteMany({key: 'whois'});
    // get the whois key (should create one in database)
    let res = await request(App).get('/whois');
    expect(res.status).toEqual(HttpStatusCode.OK);
    expect(res.type).toEqual('text/html');
    expect(res.text.length).toBe(36);
    // check in database
    const whois = await dbItems.meta.findOne({key: 'whois'});
    expect(whois.value).toEqual(res.text);
    // get the previously created whois key
    res = await request(App).get('/whois');
    expect(res.status).toEqual(HttpStatusCode.OK);
    expect(res.type).toEqual('text/html');
    expect(res.text.length).toBe(36);
  });

  test('POST /logs should save content to log file', async () => {
    const res = await request(App).post('/logs').send({
      loggerName: 'test',
      messages: ['This is a log message', 'Just for testing'],
      level: 'warning'
    });
    expect(res.status).toEqual(HttpStatusCode.OK);
    expect(res.type).toEqual(expect.stringContaining('json'));
    expect(res.body).toEqual(true)
  });

  test('GET /logs should return log file', async () => {
    const res = await request(App).get('/logs')
      .set('authorization', 'test')
      .query({
        loggerName: 'test',
        date: moment().format('YYYY-MM-DD')
      });
    expect(res.status).toEqual(HttpStatusCode.OK);
    expect(res.type).toEqual(expect.stringContaining('json'));
    expect(res.body).toEqual(expect.arrayContaining([]))
  });

  test('GET /v1/auth should return test user data', async () => {
    // get user without authorization
    let res = await request(App)
      .get('/v1/auth');
    expect(res.status).toEqual(HttpStatusCode.UNAUTHORIZED);
    expect(res.type).toEqual('text/plain');
    expect(res.text).toEqual('Unauthorized');
    // get user with authorization
    res = await request(App)
      .get('/v1/auth')
      .set('authorization', 'test');
    expect(res.status).toEqual(HttpStatusCode.OK);
    expect(res.type).toEqual('application/json');
    expect(res.body).toEqual({
      id: 'a1b2c3d4e5f6g7h8',
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'admin'
    });
  });

  test('GET /v1/auth/login redirect to GitHub', async () => {
    const res = await request(App)
      .get('/v1/auth/login');
    expect(res.status).toEqual(HttpStatusCode.FOUND);
    expect(res.type).toEqual('text/plain');
    expect(res.text).toMatch(/^Found. Redirecting to \S*$/);
    // get redirect url
    const url = new URL(res.headers.location);
    expect(url.protocol + '//' + url.host + url.pathname).toEqual(GITHUB_AUTHORIZE_URL)
    // check params
    expect(url.searchParams.size).toBe(3);
    expect(url.searchParams.has('client_id')).toBeTruthy()
    expect(url.searchParams.has('redirect_uri')).toBeTruthy()
    expect(url.searchParams.has('state')).toBeTruthy()
  });

  test('GET /v1/auth/logout (unauthorized)', async () => {
    // logout without authorization
    let res = await request(App)
      .get('/v1/auth/logout');
    expect(res.status).toEqual(HttpStatusCode.UNAUTHORIZED);
    expect(res.type).toEqual('text/plain');
    expect(res.text).toEqual('Unauthorized');
    // logout without authorization
    res = await request(App)
      .get('/v1/auth/logout')
      .set('authorization', 'test');
    expect(res.status).toEqual(HttpStatusCode.OK);
    expect(res.type).toEqual('text/plain');
    expect(res.text).toEqual("OK");
  });

  test('GET /v1/auth/fake returns a token', async () => {
    // login
    let resFake = await request(App)
      .get('/v1/auth/fake');
    expect(resFake.status).toEqual(HttpStatusCode.OK);
    expect(resFake.type).toEqual('application/json');
    expect(resFake.body).toHaveProperty('token');
    expect(resFake.body.user).toEqual('inserted');
    const token = resFake.body.token;
    // get user
    let user = await request(App)
      .get('/v1/auth')
      .set('authorization', `Bearer ${token}`);
    expect(user.status).toEqual(HttpStatusCode.OK);
    expect(user.type).toEqual('application/json');
    expect(user.body).toHaveProperty('id');
    expect(user.body).toHaveProperty('email');
    expect(user.body).toHaveProperty('name');
    expect(user.body).toHaveProperty('role');
    const res = await request(App)
      .get('/v1/auth/logout')
      .set('authorization', `Bearer ${token}`);
    expect(res.status).toEqual(HttpStatusCode.OK);
    expect(res.type).toEqual('text/plain');
    expect(res.text).toEqual('OK');
    // get user
    user = await request(App)
      .get('/v1/auth')
      .set('authorization', `Bearer ${token}`);
    expect(user.status).toEqual(HttpStatusCode.UNAUTHORIZED);
    expect(user.type).toEqual('text/plain');
    expect(user.text).toEqual('Unauthorized');
    // login again, without creating user
    resFake = await request(App)
      .get('/v1/auth/fake')
      .query('redirect=http://localhost');
    expect(resFake.status).toEqual(HttpStatusCode.FOUND);
    expect(resFake.type).toEqual('text/plain');
    expect(resFake.text).toMatch(/^Found. Redirecting to \S*$/);
    // login again, without creating user
    resFake = await request(App)
      .get('/v1/auth/fake');
    expect(resFake.status).toEqual(HttpStatusCode.OK);
    expect(resFake.type).toEqual('application/json');
    expect(resFake.body).toHaveProperty('token');
    expect(resFake.body.user).toEqual('updated');
  });

  test('GET /v1/auth/code GitHub workflow', async () => {
    // without state
    let res = await request(App)
      .get('/v1/auth/code');
    expect(res.status).toBe(HttpStatusCode.BAD_REQUEST);
    expect(res.type).toEqual('text/plain');
    expect(res.text).toEqual('Bad Request');
    // with state
    const state = jwt.sign('http://localhost', STATE_SECRET);
    res = await request(App)
      .get(`/v1/auth/code?state=${state}`);
    expect(res.status).toBe(HttpStatusCode.NOT_FOUND);
    expect(res.type).toEqual('text/plain');
    expect(res.text).toEqual('Not Found');
    // with state and code
    const code = 'abcdefg';
    res = await request(App)
      .get(`/v1/auth/code?state=${state}&code=${code}`);
    expect(res.status).toBe(HttpStatusCode.NOT_FOUND);
    expect(res.type).toEqual('text/plain');
    expect(res.text).toEqual('Not Found');
  });

  test('GET /v1/users get users', async () => {
    // request users with test auth
    const res = await request(App)
      .get('/v1/users')
      .set('authorization', 'test');
    expect(res.status).toBe(HttpStatusCode.OK);
    expect(res.type).toEqual('application/json');
    expect(res.body).toEqual([]);
  });


});