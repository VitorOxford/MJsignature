<template>
  <v-app>
    <v-app-bar app color="primary">
      <v-toolbar-title>Sistema de Assinatura Digital</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn to="/" text>Home</v-btn>
      <v-btn to="/dashboard" text>Dashboard</v-btn>
      <v-btn to="/upload" text>Novo Documento</v-btn>
    </v-app-bar>

    <v-main>
      <v-container>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
// Nenhuma lógica necessária aqui por enquanto
</script>