<template>
  <div v-if="template">
    <h2 class="mb-4">Assinando: {{ template.title }}</h2>
    
    <div class="pdf-container" style="position: relative; border: 1px solid #ccc;">
      <canvas ref="pdfCanvas"></canvas>
      
      <div
        v-for="field in template.editable_fields"
        :key="field.id"
        class="input-field"
        :style="{ left: `${field.x}px`, top: `${field.y}px`, width: `${field.width}px`, height: `${field.height}px` }"
      >
        <v-text-field
          v-if="field.type === 'text'"
          v-model="formData[field.id]"
          :label="field.id"
          variant="outlined"
          density="compact"
          hide-details
        ></v-text-field>

        <div v-if="field.type === 'signature'" class="signature-wrapper">
          <p class="text-caption mb-1">Assine aqui ({{ field.id }})</p>
          <SignaturePad 
            @input="(data) => formData[field.id] = data"
          />
        </div>
      </div>
    </div>
    
    <v-btn color="primary" @click="finalizeDocument" class="mt-4">Finalizar e Salvar Documento</v-btn>
  </div>
  <div v-else-if="loading" class="text-center pa-10">
     <v-progress-circular indeterminate size="64"></v-progress-circular>
    <p class="mt-4">Carregando documento...</p>
  </div>
   <v-alert v-if="error" type="error" class="mt-4">{{ error }}</v-alert>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { supabase } from '@/lib/supabaseClient';
import SignaturePad from '@/components/SignaturePad.vue';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

// CORREÇÃO FINAL: Aponta para o worker .js (versão mais compatível) na pasta /public
pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.js`;

const route = useRoute();
const template = ref(null);
const loading = ref(true);
const error = ref(null);
const pdfCanvas = ref(null);
const formData = ref({});

const fetchAndRender = async () => {
  try {
    const { data, error: dbError } = await supabase.from('document_templates').select('*').eq('id', route.params.id).single();
    if (dbError) throw dbError;
    template.value = data;

    const { data: urlData, error: urlError } = await supabase.storage.from('templates').createSignedUrl(data.storage_path, 3600);
    if (urlError) throw urlError;

    const loadingTask = pdfjsLib.getDocument(urlData.signedUrl);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = pdfCanvas.value;
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

  } catch (err) {
    error.value = `Erro ao carregar documento: ${err.message}`;
  } finally {
    loading.value = false;
  }
};

const finalizeDocument = async () => {
    alert("Funcionalidade de finalização ainda não implementada. Os dados coletados estão no console.");
    console.log("Dados do formulário para enviar ao backend:", formData.value);
};

onMounted(fetchAndRender);
</script>

<style scoped>
.pdf-container { overflow: auto; max-height: 80vh; }
.input-field { position: absolute; }
.signature-wrapper { width: 100%; height: 100%; border: 1px dashed #ccc; display: flex; flex-direction: column; }
.signature-wrapper p { padding: 2px 4px; background-color: #f0f0f0; }
</style>