<template>
  <v-container class="fill-height d-flex justify-center align-center">
    <v-card class="text-center pa-8" max-width="600">
      <v-card-title class="text-h4 font-weight-bold mb-4">
        Sistema de Assinatura Digital
      </v-card-title>

      <v-card-subtitle class="text-h6 mb-6">
        Gerencie e assine seus documentos de forma fácil e segura.
      </v-card-subtitle>

      <v-card-text>
        Para começar a usar o sistema, faça o seu login. Se você já estiver conectado,
        acesse seu painel de controle para ver seus documentos.
      </v-card-text>

      <v-card-actions class="justify-center">
        <v-btn
          color="primary"
          size="large"
          to="/login"
          class="mx-2"
        >
          <v-icon start icon="mdi-login"></v-icon>
          Fazer Login
        </v-btn>

        <v-btn
          color="secondary"
          size="large"
          to="/dashboard"
          class="mx-2"
        >
          <v-icon start icon="mdi-view-dashboard"></v-icon>
          Meu Dashboard
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup>
// Nenhuma lógica de script é necessária para esta página de boas-vindas estática.
// A navegação é controlada pelo `to="/caminho"` nos componentes v-btn.
</script>

<style scoped>
/* Adicione estilos específicos para esta página aqui, se necessário */
.fill-height {
  min-height: 80vh;
}
</style>