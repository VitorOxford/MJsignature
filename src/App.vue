<template>
  <v-app>
    <v-app-bar app color="primary">
      <v-container class="d-flex align-center py-0">
        <v-img
          :src="logoUrl"
          alt="Logo da Empresa"
          max-height="40"
          max-width="120"
          contain
          class="mr-5"
        ></v-img>
        <v-toolbar-title>Sistema de Assinatura Digital</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn to="/dashboard" text>Dashboard</v-btn>
        <v-btn text @click="handleLogout">Sair</v-btn>
      </v-container>
    </v-app-bar>

    <v-main style="background-color: #f4f7f9;">
      <v-container>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabaseClient';
// A importação agora vai funcionar
import logoEstudio from '@/assets/logo-estudio.png';

const logoUrl = ref(logoEstudio);
const router = useRouter();

const handleLogout = async () => {
  await supabase.auth.signOut();
  router.push('/login');
};
</script>

<style>
/* Estilo global para a aplicação */
body {
  font-family: 'Roboto', sans-serif;
}
</style>