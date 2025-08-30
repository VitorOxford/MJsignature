<template>
  <div>
    <div v-if="loading">Carregando documento...</div>
    <div v-if="errorMessage">{{ errorMessage }}</div>
    
    <div v-if="document">
      <h2>Assinando: {{ document.title }}</h2>
      
      <div class="my-4" style="border: 1px solid #ccc; height: 70vh;">
        <iframe :src="pdfUrl" width="100%" height="100%"></iframe>
      </div>

      <SignaturePad />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '@/lib/supabaseClient';
import SignaturePad from '@/components/SignaturePad.vue'; // Importe o componente

// props virá do router (:id)
const props = defineProps({
  id: String
});

const document = ref(null);
const pdfUrl = ref(null);
const loading = ref(true);
const errorMessage = ref(null);

const getDocumentDetails = async () => {
  try {
    // 1. Busca os detalhes do documento no banco de dados
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', props.id)
      .single(); // .single() para pegar apenas um resultado ou erro se não houver

    if (error || !data) throw new Error('Documento não encontrado.');
    document.value = data;

    // 2. Gera uma URL assinada (temporária e segura) para o arquivo no Storage privado
    const { data: urlData, error: urlError } = await supabase.storage
      .from('documentos-originais')
      .createSignedUrl(data.original_file_path, 3600); // URL válida por 1 hora (3600 segundos)

    if (urlError) throw urlError;

    pdfUrl.value = urlData.signedUrl;

  } catch (error) {
    errorMessage.value = `Erro: ${error.message}`;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  getDocumentDetails();
});
</script>