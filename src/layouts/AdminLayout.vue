<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" app permanent>
      <v-list-item class="pa-4">
        <v-list-item-title class="text-h5 font-weight-bold">
          Painel Admin
        </v-list-item-title>
        <v-list-item-subtitle>
          Assinatura Digital
        </v-list-item-subtitle>
      </v-list-item>
      <v-divider></v-divider>
      <v-list density="compact" nav>
        <v-list-item prepend-icon="mdi-view-dashboard" title="Visão Geral" value="dashboard" to="/admin/dashboard"></v-list-item>
        <v-list-item prepend-icon="mdi-file-document-multiple" title="Gerenciar Templates" value="templates" to="/admin/templates"></v-list-item>
        <v-list-item prepend-icon="mdi-file-sign" title="Documentos Assinados" value="signed" to="/admin/signed"></v-list-item>
        <v-list-item prepend-icon="mdi-account-group" title="Usuários" value="users" to="/admin/users"></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app color="surface" elevation="1">
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>Bem-vindo, Admin!</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon>
        <v-icon>mdi-bell-outline</v-icon>
      </v-btn>
      <v-btn @click="handleLogout">
        Sair
        <v-icon end>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container fluid class="pa-6">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabaseClient';

const drawer = ref(true);
const router = useRouter();

const handleLogout = async () => {
  await supabase.auth.signOut();
  router.push('/login');
};
</script>