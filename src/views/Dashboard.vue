<template>
  <div>
    <h1>Meus Documentos</h1>
    <v-progress-circular v-if="loading" indeterminate color="primary"></v-progress-circular>
    <v-alert v-if="errorMessage" type="error">{{ errorMessage }}</v-alert>
    
    <v-list lines="two" v-if="!loading && documents.length > 0">
      <v-list-item
        v-for="doc in documents"
        :key="doc.id"
        :title="doc.title"
        :subtitle="`Status: ${doc.status} - Criado em: ${new Date(doc.created_at).toLocaleDateString()}`"
        :to="`/sign/${doc.id}`"
      >
        <template v-slot:append>
          <v-btn color="primary" size="small">Assinar</v-btn>
        </template>
      </v-list-item>
    </v-list>
    
    <p v-if="!loading && documents.length === 0">Nenhum documento encontrado. <router-link to="/upload">Envie seu primeiro documento!</router-link></p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '@/lib/supabaseClient';

const documents = ref([]);
const loading = ref(true);
const errorMessage = ref(null);

const fetchDocuments = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não encontrado");

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    documents.value = data;
  } catch (error) {
    errorMessage.value = `Erro ao buscar documentos: ${error.message}`;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchDocuments();
});
</script>