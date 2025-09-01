<template>
  <v-container>
    <h1 class="mb-6">Templates Disponíveis para Assinatura</h1>

    <div v-if="loading" class="text-center">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4">Buscando documentos...</p>
    </div>

    <v-alert v-if="errorMessage" type="error" prominent>
      {{ errorMessage }}
    </v-alert>

    <v-row v-if="!loading && templates.length > 0">
      <v-col
        v-for="template in templates"
        :key="template.id"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card class="d-flex flex-column" height="100%">
          <v-card-item>
            <v-card-title class="text-wrap">{{ template.title }}</v-card-title>
            <v-card-subtitle>
              Disponibilizado em: {{ new Date(template.created_at).toLocaleDateString() }}
            </v-card-subtitle>
          </v-card-item>

          <v-card-text class="flex-grow-1">
            Clique abaixo para preencher os campos necessários e assinar este documento.
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              variant="flat"
              :to="`/sign/${template.id}`"
            >
              <v-icon start icon="mdi-file-edit-outline"></v-icon>
              Preencher e Assinar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <div v-if="!loading && templates.length === 0 && !errorMessage" class="text-center pa-8">
       
      <p class="text-h6 mt-4">Nenhum documento disponível no momento.</p>
      <p class="text-medium-emphasis">Por favor, verifique novamente mais tarde.</p>
    </div>

  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '@/lib/supabaseClient';

// Variáveis reativas para controlar o estado da UI
const templates = ref([]);
const loading = ref(true);
const errorMessage = ref(null);

// Função para buscar os templates no banco de dados
const fetchTemplates = async () => {
  loading.value = true;
  errorMessage.value = null;
  try {
    // Busca na nova tabela 'document_templates'
    const { data, error } = await supabase
      .from('document_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Se houver um erro na busca, joga o erro para o bloco catch
      throw error;
    }
    
    // Se a busca for bem-sucedida, atualiza a lista de templates
    templates.value = data;

  } catch (error) {
    // Captura o erro e define uma mensagem amigável para o usuário
    console.error("Erro ao buscar templates:", error);
    errorMessage.value = 'Não foi possível carregar os documentos. Por favor, tente novamente mais tarde.';
  } finally {
    // Garante que o indicador de carregamento seja desativado ao final
    loading.value = false;
  }
};

// Hook do ciclo de vida: chama a função de busca quando o componente é montado
onMounted(() => {
  fetchTemplates();
});
</script>

<style scoped>
.text-wrap {
  white-space: normal;
}
</style>