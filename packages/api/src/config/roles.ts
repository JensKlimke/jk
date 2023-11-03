const allRoles = {
  user: ['getUserItems', 'manageUserItems', 'getUserInformation'],
  admin: ['getUsers', 'manageUsers', 'getUserItems', 'manageUserItems', 'getUserInformation', 'getUsers', 'getDatabaseItems'],
  super_admin: ['getUsers', 'manageUsers', 'getUserItems', 'manageUserItems', 'getUserInformation', 'getUsers', 'getDatabaseItems'],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

export {
  roles,
  roleRights,
};
