<template>
  <v-app>
    <v-app-bar app color="primary">
      <v-toolbar-title>Sistema de Assinatura Digital</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn to="/dashboard" text>Dashboard</v-btn>
      <v-btn text @click="handleLogout">Sair</v-btn>
    </v-app-bar>

    <v-main>
      <v-container>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabaseClient';

const router = useRouter();

const handleLogout = async () => {
  await supabase.auth.signOut();
  router.push('/login');
};
</script>