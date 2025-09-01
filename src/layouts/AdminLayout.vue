<template>
  <v-app>
    <v-navigation-drawer app permanent width="250">
      <v-list dense nav>
        <v-list-item prepend-icon="mdi-view-dashboard" title="Dashboard" to="/admin/dashboard"></v-list-item>
        <v-list-item prepend-icon="mdi-file-document-outline" title="Templates" to="/admin/templates"></v-list-item>
        <v-list-item prepend-icon="mdi-file-check-outline" title="Documentos Assinados" to="/admin/signed"></v-list-item>
        <v-list-item prepend-icon="mdi-account-group-outline" title="Usuários" to="/admin/users"></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main class="main-content">
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
// Nenhuma lógica adicional necessária
</script>

<style scoped>
.main-content {
  background-color: #f4f7f9;
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
