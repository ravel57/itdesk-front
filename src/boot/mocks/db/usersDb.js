export function createUsersDb() {
  return {
    me: {
      id: 1,
      username: 'dev',
      firstname: 'Dev',
      lastname: 'User',
      role: 'ADMIN',
      authorities: ['ADMIN'],
      welcomeSeen: true,
      taskCardFieldsConfig: null,
      onboardingProgress: {}
    },

    users: [
      {id: 1, username: 'dev', firstname: 'Dev', lastname: 'User', role: 'ADMIN', authorities: ['ADMIN']},
      {id: 2, username: 'operator', firstname: 'Олег', lastname: 'Оператор', role: 'OPERATOR', authorities: ['OPERATOR']}
    ],

    roles: ['ADMIN', 'OPERATOR', 'OBSERVER']
  }
}
