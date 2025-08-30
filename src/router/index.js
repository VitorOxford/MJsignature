// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/lib/supabaseClient' // 👈 **IMPORTANTE: Adicione esta linha**

// Use o alias '@/' para padronizar e evitar erros
import Home from '@/views/Home.vue'
import Login from '@/views/Login.vue'
import Dashboard from '@/views/Dashboard.vue'
import UploadDocument from '@/views/UploadDocument.vue'
import SignDocument from '@/views/SignDocument.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/upload',
    name: 'UploadDocument',
    component: UploadDocument,
    meta: { requiresAuth: true }
  },
  {
    path: '/sign/:id',
    name: 'SignDocument',
    component: SignDocument,
    props: true,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Lógica para proteger rotas (Navigation Guard)
router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (requiresAuth && !session) {
    next('/login')
  } else {
    next()
  }
})

export default router