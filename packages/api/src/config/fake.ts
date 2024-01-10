import {UserData} from "../types/session";

const FAKE_ADMIN_USER = {
  name: 'Fake Admin',
  email: 'admin@example.com',
  role: 'admin'
};

const FAKE_USER = {
  name: 'Fake User',
  email: 'user@example.com',
  role: 'user'
};

const users : {[key : string]: UserData} = {
  admin: FAKE_ADMIN_USER,
  user: FAKE_USER
}

export {
  users
}