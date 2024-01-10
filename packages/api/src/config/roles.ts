const allRoles = {
  user: [
    'getUserInformation'
  ],
  admin: [
    'getUsers',
    'manageUsers',
    'getItems',
    'manageItems',
    'getUserInformation',
    'getUsers',
    'getDatabaseItems',
    'getLogItems'
  ],
  super_admin: [
    'getUsers',
    'manageUsers',
    'getItems',
    'manageItems',
    'getUserInformation',
    'getUsers',
    'getDatabaseItems',
    'getLogItems'
  ],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

export {
  roles,
  roleRights,
};
