<template>
  <v-container fluid>
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold text-grey-darken-3">Dashboard</h1>
        <p class="text-subtitle-1 text-grey">Documentos pendentes de assinatura</p>
      </div>
    </div>

    <div v-if="loading" class="text-center py-16">
      <v-progress-circular indeterminate size="64" color="primary"></v-progress-circular>
      <p class="mt-4 text-grey">Carregando documentos...</p>
    </div>

    <v-alert v-else-if="error" type="error" variant="tonal" prominent class="my-4">
      {{ error }}
    </v-alert>

    <v-row v-else-if="documents.length > 0">
      <v-col
        v-for="doc in documents"
        :key="doc.id"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card class="document-card" elevation="2" @click="signDocument(doc.id)">
          <div class="canvas-container">
            <canvas :ref="el => setCanvasRef(el, doc.id)"></canvas>
            <div class="overlay">
              <v-icon size="50">mdi-pen</v-icon>
              <span class="mt-2">Assinar Agora</span>
            </div>
          </div>
          <v-divider></v-divider>
          <div class="card-content">
            <v-card-title class="font-weight-bold text-grey-darken-4 pb-1">
              {{ doc.title }}
            </v-card-title>
            <v-card-subtitle class="text-wrap">
              {{ doc.description || 'Sem descrição.' }}
            </v-card-subtitle>
          </div>
        </v-card>
      </v-col>
    </v-row>
    
    <v-card v-else variant="tonal" class="text-center pa-16">
       <v-icon size="60" color="grey-lighten-1">mdi-file-check-outline</v-icon>
       <h2 class="text-h6 font-weight-regular text-grey-darken-1 mt-4">Nenhum documento pendente!</h2>
       <p class="text-grey mt-2">Você está em dia com suas assinaturas.</p>
    </v-card>

  </v-container>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabaseClient';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const router = useRouter();
const documents = ref([]);
const loading = ref(true);
const error = ref(null);
const canvasRefs = ref({});

const setCanvasRef = (el, docId) => {
  if (el) {
    canvasRefs.value[docId] = el;
  }
};

const fetchDocuments = async () => {
  try {
    const { data, error: dbError } = await supabase.from('document_templates').select('*');
    if (dbError) throw dbError;
    documents.value = data;

    await nextTick();
    
    for (const doc of documents.value) {
      await renderPreview(doc);
    }
  } catch (err) {
    error.value = `Erro ao buscar documentos: ${err.message}`;
  } finally {
    loading.value = false;
  }
};

const renderPreview = async (doc) => {
  try {
    const { data: urlData, error: urlError } = await supabase.storage.from('templates').createSignedUrl(doc.storage_path, 3600);
    if (urlError) throw urlError;

    const pdf = await pdfjsLib.getDocument(urlData.signedUrl).promise;
    const page = await pdf.getPage(1);
    const canvas = canvasRefs.value[doc.id];
    
    if (canvas) {
      const viewport = page.getViewport({ scale: 0.5 });
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    }
  } catch (err) {
    console.error(`Erro ao renderizar preview para ${doc.id}:`, err);
  }
};

const signDocument = (id) => {
  router.push(`/sign/${id}`);
};

onMounted(fetchDocuments);
</script>

<style scoped>
.document-card {
  transition: all 0.2s ease-in-out;
  border: 1px solid #E0E0E0;
  cursor: pointer;
}
.document-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important;
  border-color: var(--v-theme-primary);
}
.canvas-container {
  position: relative;
  background-color: #f5f5f5;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  min-height: 250px;
  overflow: hidden;
}
.canvas-container canvas {
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 86, 179, 0.7);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
  font-weight: bold;
}
.document-card:hover .overlay {
  opacity: 1;
}
.card-content {
  padding: 16px;
  background: white;
}
.text-wrap {
  white-space: normal;
}
</style>