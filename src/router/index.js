import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/lib/supabaseClient'

import AdminLayout from '@/layouts/AdminLayout.vue'
import Home from '@/views/Home.vue'
import Login from '@/views/Login.vue'

const routes = [
  // Rotas de Usuário
  { path: '/', component: Home },
  { path: '/login', component: Login },
  { path: '/dashboard', component: () => import('@/views/Dashboard.vue'), meta: { requiresAuth: true } },
  { path: '/sign/:id', component: () => import('@/views/SignDocument.vue'), meta: { requiresAuth: true } },

  // ROTAS DO PAINEL DE ADMIN (AGORA COMPLETAS)
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: '', redirect: '/admin/dashboard' }, // Redireciona para o novo dashboard
      { path: 'dashboard', component: () => import('@/views/admin/AdminDashboard.vue') }, // ROTA ADICIONADA
      { path: 'templates', component: () => import('@/views/admin/AdminTemplates.vue') },
      { path: 'signed', component: () => import('@/views/admin/AdminSigned.vue') },
      { path: 'users', component: () => import('@/views/admin/AdminUsers.vue') }
    ]
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Guarda de Navegação (sem alterações)
router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session && to.meta.requiresAuth) {
    return next('/login');
  }

  if (session && to.meta.requiresAdmin) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    if (profile && profile.role === 'admin') {
      next();
    } else {
      next('/dashboard');
    }
  } else {
    next();
  }
});

export default router