<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col>
        <h1 class="text-h4 font-weight-bold text-grey-darken-4">Visão Geral</h1>
        <p class="text-subtitle-1 text-grey-darken-1">Bem-vindo ao seu painel de controle.</p>
      </v-col>
    </v-row>

    <div v-if="loading" class="text-center py-16">
      <v-progress-circular indeterminate size="64" color="primary"></v-progress-circular>
    </div>

    <v-alert v-else-if="error" type="error" variant="tonal" prominent class="my-4">
      {{ error }}
    </v-alert>

    <div v-else>
      <v-row>
        <v-col cols="12" md="4">
          <v-card class="stat-card" color="#1A237E" theme="dark" elevation="4">
            <div class="d-flex align-center">
              <v-icon size="50" class="mr-4">mdi-file-document-multiple-outline</v-icon>
              <div>
                <p class="text-subtitle-1">Total de Templates</p>
                <h2 class="text-h3 font-weight-black">{{ stats.templates }}</h2>
              </div>
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="stat-card" color="#00695C" theme="dark" elevation="4">
            <div class="d-flex align-center">
              <v-icon size="50" class="mr-4">mdi-check-decagram-outline</v-icon>
              <div>
                <p class="text-subtitle-1">Documentos Assinados</p>
                <h2 class="text-h3 font-weight-black">{{ stats.signed }}</h2>
              </div>
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="stat-card" color="#BF360C" theme="dark" elevation="4">
            <div class="d-flex align-center">
              <v-icon size="50" class="mr-4">mdi-account-group-outline</v-icon>
              <div>
                <p class="text-subtitle-1">Total de Usuários</p>
                <h2 class="text-h3 font-weight-black">{{ stats.users }}</h2>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12" md="7">
          <v-card class="fill-height" elevation="2">
            <v-card-title class="font-weight-bold">Atividade de Assinaturas (Últimos 7 dias)</v-card-title>
            <v-card-text class="d-flex align-center justify-center text-grey-lighten-1 h-100">
              <div class="text-center">
                <v-icon size="60">mdi-chart-bar</v-icon>
                <p>(Espaço reservado para um gráfico de atividades)</p>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="5">
          <v-card class="fill-height" elevation="2">
            <v-card-title class="font-weight-bold">Ações Rápidas</v-card-title>
            <v-list lines="two">
              <v-list-item to="/admin/templates" title="Criar Novo Template" subtitle="Comece a configurar um novo documento para assinatura." prepend-icon="mdi-file-plus-outline"></v-list-item>
              <v-divider inset></v-divider>
              <v-list-item to="/admin/users" title="Adicionar Usuário" subtitle="Convide um novo membro para a plataforma." prepend-icon="mdi-account-plus-outline"></v-list-item>
              <v-divider inset></v-divider>
              <v-list-item to="/admin/signed" title="Verificar Documentos" subtitle="Revise os últimos documentos que foram assinados." prepend-icon="mdi-file-eye-outline"></v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '@/lib/supabaseClient';

const stats = ref({
  templates: 0,
  signed: 0,
  users: 0,
});
const loading = ref(true);
const error = ref(null);

const fetchStats = async () => {
  try {
    const [templatesCount, usersCount] = await Promise.all([
      supabase.from('document_templates').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true })
    ]);

    if (templatesCount.error) throw templatesCount.error;
    if (usersCount.error) throw usersCount.error;

    stats.value.templates = templatesCount.count;
    stats.value.users = usersCount.count;
    stats.value.signed = 0;

  } catch (err) {
    error.value = `Erro ao carregar estatísticas: ${err.message}`;
  } finally {
    loading.value = false;
  }
};

onMounted(fetchStats);
</script>

<style scoped>
.stat-card {
  padding: 24px;
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.stat-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22) !important;
}
.fill-height {
  height: 100%;
}
</style>