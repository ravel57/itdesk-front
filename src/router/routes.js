const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: 'dialogs',
        component: () => import('pages/IndexPage.vue')
      },
      {
        path: 'tasks',
        component: () => import('pages/IndexPage.vue')
      },
      {
        path: 'tasks',
        component: () => import('pages/IndexPage.vue')
      }
    ]
  }
  // {
  //   path: '/:catchAll(.*)*',
  //   component: () => import('pages/ErrorNotFound.vue')
  // }
]

export default routes
