<template>
  <div class="document-preview-container">
    <canvas ref="canvasRef"></canvas>
    <div v-if="loading" class="overlay">
      <v-progress-circular indeterminate size="48" color="primary"></v-progress-circular>
    </div>
    <div v-if="error" class="overlay error-overlay">
      <v-icon size="48" color="error">mdi-alert-circle-outline</v-icon>
      <p class="mt-2">Erro ao carregar</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const props = defineProps({ documentUrl: { type: String, required: true } });
const canvasRef = ref(null);
const loading = ref(true);
const error = ref(null);

const renderPdf = async () => {
  if (!props.documentUrl) return;
  loading.value = true;
  error.value = null;
  try {
    const pdf = await pdfjsLib.getDocument(props.documentUrl).promise;
    const page = await pdf.getPage(1);
    const canvas = canvasRef.value;
    const context = canvas.getContext('2d');
    const viewport = page.getViewport({ scale: 1 });
    const scale = canvas.parentElement.clientWidth / viewport.width;
    const scaledViewport = page.getViewport({ scale });
    canvas.height = scaledViewport.height;
    canvas.width = scaledViewport.width;
    await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
  } catch (err) {
    console.error("Erro ao renderizar PDF:", err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

onMounted(renderPdf);
watch(() => props.documentUrl, renderPdf);
</script>

<style scoped>
.document-preview-container { position: relative; width: 100%; height: 250px; background-color: #e0e0e0; display: flex; align-items: center; justify-content: center; }
canvas { max-width: 100%; max-height: 100%; object-fit: contain; }
.overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: rgba(255, 255, 255, 0.7); }
.error-overlay { background-color: rgba(252, 232, 232, 0.9); color: #B71C1C; }
</style>