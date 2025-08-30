<template>
  <div>
    <h1>Enviar Novo Documento para Assinatura</h1>
    <v-card class="pa-4 mt-6">
      <v-form @submit.prevent="handleFileUpload">
        <v-text-field
          v-model="documentTitle"
          label="Título do Documento"
          required
        ></v-text-field>
        <v-file-input
          v-model="documentFile"
          label="Selecione o documento (PDF)"
          accept=".pdf"
          prepend-icon="mdi-file-document"
          required
        ></v-file-input>
        <v-alert v-if="errorMessage" type="error" class="mb-4">{{ errorMessage }}</v-alert>
        <v-alert v-if="successMessage" type="success" class="mb-4">{{ successMessage }}</v-alert>
        <v-btn type="submit" color="primary" :loading="loading" :disabled="!documentFile || !documentTitle">
          Enviar Documento
        </v-btn>
      </v-form>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { supabase } from '@/lib/supabaseClient';

const documentTitle = ref('');
const documentFile = ref(null); // v-file-input retorna um array, pegaremos o primeiro
const loading = ref(false);
const errorMessage = ref(null);
const successMessage = ref(null);

const handleFileUpload = async () => {
  if (!documentFile.value || documentFile.value.length === 0) {
    errorMessage.value = 'Por favor, selecione um arquivo.';
    return;
  }

  loading.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  try {
    // 1. Obter o usuário logado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado.');

    const file = documentFile.value[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    // 2. Fazer o upload para o Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('documentos-originais')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 3. Inserir o registro no banco de dados
    const { error: dbError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        title: documentTitle.value,
        original_file_path: filePath,
        status: 'pendente'
      });

    if (dbError) throw dbError;

    successMessage.value = `Documento "${documentTitle.value}" enviado com sucesso!`;
    documentTitle.value = '';
    documentFile.value = null;

  } catch (error) {
    errorMessage.value = `Erro: ${error.message}`;
  } finally {
    loading.value = false;
  }
};
</script>