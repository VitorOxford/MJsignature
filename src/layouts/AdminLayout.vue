<template>
  <v-app id="inspire">
    <v-navigation-drawer
      v-model="drawer"
      app
      color="primary"
      dark
    >
      <v-list-item class="pa-4">
        <v-list-item-title class="text-h6 font-weight-bold">
          MJ Signature
        </v-list-item-title>
        <v-list-item-subtitle>
          Painel Admin
        </v-list-item-subtitle>
      </v-list-item>

      <v-divider></v-divider>

      <v-list dense nav>
        <v-list-item
          v-for="item in items"
          :key="item.title"
          :to="item.to"
          link
          class="my-1"
        >
          <template v-slot:prepend>
            <v-icon>{{ item.icon }}</v-icon>
          </template>
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app color="white" flat class="border-b">
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title class="font-weight-bold text-grey-darken-3">
        </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn text icon="mdi-logout" to="/dashboard">
        <v-icon>mdi-logout</v-icon>
        <v-tooltip activator="parent" location="bottom">Sair do Painel</v-tooltip>
      </v-btn>
    </v-app-bar>

    <v-main class="bg-grey-lighten-4">
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue';

const drawer = ref(true); // Menu começa aberto
const items = ref([
  { title: 'Dashboard', icon: 'mdi-view-dashboard-variant-outline', to: '/admin/dashboard' },
  { title: 'Templates', icon: 'mdi-file-document-multiple-outline', to: '/admin/templates' },
  { title: 'Assinados', icon: 'mdi-check-decagram-outline', to: '/admin/signed' },
  { title: 'Usuários', icon: 'mdi-account-group-outline', to: '/admin/users' },
]);
</script>

<style scoped>
/* Estilos para garantir que o conteúdo preencha o espaço */
.v-main {
  height: 100vh;
  overflow-y: auto;
}
</style>