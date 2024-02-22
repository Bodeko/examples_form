import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue')
    },
    {
      path:'/:userName/post/:postId',
      name: 'userPost',
      component: () => import('@/views/UserPostView.vue')
    },
    {
      path:'/:userName',
      name: 'userProfile',
      component: () => import('@/views/UserView.vue')
    },
    {
      path: '/',
      name: 'home',
      component: HomeView
    }
  ]
})

export default router
