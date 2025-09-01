<template>
  <div class="template-editor-container">
    <v-navigation-drawer permanent location="left" width="200" class="page-thumbnail-drawer">
      <v-list dense nav>
        <v-list-subheader>PÁGINAS</v-list-subheader>
        <v-list-item
          v-for="page in pages"
          :key="page.pageNumber"
          @click="scrollToPage(page.pageNumber)"
          :class="{ 'v-list-item--active': page.pageNumber === currentPage }"
        >
          <div class="thumbnail-container">
            <canvas :ref="el => setThumbnailCanvasRef(el, page.pageNumber)" class="thumbnail-canvas"></canvas>
            <div class="thumbnail-overlay">Página {{ page.pageNumber }}</div>
          </div>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <div class="editor-main-content" ref="mainContent">
      <div v-if="loading" class="loading-overlay">
        <v-progress-circular indeterminate size="64"></v-progress-circular>
        <p class="mt-4">Carregando editor...</p>
      </div>

      <v-alert v-if="error" type="error" closable class="ma-4">{{ error }}</v-alert>

      <div v-if="template && !loading" class="pdf-pages-container">
        <div
          v-for="page in pages"
          :key="page.pageNumber"
          class="page-wrapper"
          :data-page-number="page.pageNumber"
        >
          <h4>Página {{ page.pageNumber }}</h4>
          <div class="canvas-container">
            <canvas :ref="el => setCanvasRef(el, page.pageNumber)"></canvas>
            <div
              v-for="field in page.fields"
              :key="field.id"
              class="editable-field"
              :style="getFieldStyle(field)"
            >
              {{ field.id }} ({{ field.type }})
            </div>
          </div>
        </div>
      </div>
    </div>

    <v-navigation-drawer permanent location="right" width="350">
      <v-toolbar color="primary" dark>
        <v-toolbar-title>Propriedades</v-toolbar-title>
      </v-toolbar>
      <div class="pa-4">
        <p v-if="!template">Carregue um template para ver as opções.</p>
        <div v-if="template">
          <v-text-field label="Título do Template" v-model="template.title" variant="outlined" density="compact"></v-text-field>
          <v-textarea label="Descrição" v-model="template.description" variant="outlined" density="compact" rows="3"></v-textarea>

          <v-divider class="my-4"></v-divider>
          <h4 class="mb-2">Campos Editáveis</h4>
          <p class="text-caption mb-2">Adicione e posicione os campos no PDF.</p>
          <v-btn color="primary" block>Adicionar Campo</v-btn>
        </div>
      </div>
    </v-navigation-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { supabase } from '@/lib/supabaseClient';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const route = useRoute();
const template = ref(null);
const loading = ref(true);
const error = ref(null);
const pages = ref([]);
const currentPage = ref(1);

const canvasRefs = ref({});
const thumbnailCanvasRefs = ref({});
const mainContent = ref(null);

const setCanvasRef = (el, pageNumber) => {
  if (el) canvasRefs.value[pageNumber] = el;
};
const setThumbnailCanvasRef = (el, pageNumber) => {
  if (el) thumbnailCanvasRefs.value[pageNumber] = el;
};

const fetchAndRenderPDF = async () => {
  try {
    const { data, error: dbError } = await supabase
      .from('document_templates')
      .select('*')
      .eq('id', route.params.id)
      .single();
    if (dbError) throw dbError;
    template.value = data;

    const { data: urlData, error: urlError } = await supabase.storage
      .from('templates')
      .createSignedUrl(data.storage_path, 3600);
    if (urlError) throw urlError;

    const pdf = await pdfjsLib.getDocument(urlData.signedUrl).promise;
    const pagesData = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const fieldsForPage = (template.value.editable_fields || []).filter(f => (f.page || 1) === i);
      pagesData.push({ pageNumber: i, fields: fieldsForPage });
    }
    pages.value = pagesData;

    await nextTick();

    for (const pageData of pages.value) {
      const pageNumber = pageData.pageNumber;
      const pdfPage = await pdf.getPage(pageNumber);

      // Renderiza canvas principal
      const viewport = pdfPage.getViewport({ scale: 1.5 });
      const canvas = canvasRefs.value[pageNumber];
      if (canvas) {
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await pdfPage.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      }

      // Renderiza miniatura (thumbnail)
      const thumbViewport = pdfPage.getViewport({ scale: 0.3 });
      const thumbCanvas = thumbnailCanvasRefs.value[pageNumber];
      if (thumbCanvas) {
        thumbCanvas.height = thumbViewport.height;
        thumbCanvas.width = thumbViewport.width;
        // ***** LINHA CORRIGIDA *****
        await pdfPage.render({ canvasContext: thumbCanvas.getContext('2d'), viewport: thumbViewport }).promise;
      }
    }
    setupScrollSpy();
  } catch (err) {
    console.error(err);
    error.value = `Erro ao carregar o template: ${err.message}`;
  } finally {
    loading.value = false;
  }
};

const getFieldStyle = (field) => ({
    left: `${field.x * 1.5}px`,
    top: `${field.y * 1.5}px`,
    width: `${field.width * 1.5}px`,
    height: `${field.height * 1.5}px`,
});

const scrollToPage = (pageNumber) => {
  const pageElement = mainContent.value.querySelector(`[data-page-number="${pageNumber}"]`);
  if (pageElement) {
    pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const setupScrollSpy = () => {
  if (!mainContent.value) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        currentPage.value = parseInt(entry.target.getAttribute('data-page-number'));
      }
    });
  }, { root: mainContent.value, threshold: 0.5 });

  pages.value.forEach(p => {
    const el = mainContent.value.querySelector(`[data-page-number="${p.pageNumber}"]`);
    if(el) observer.observe(el);
  });
};

onMounted(fetchAndRenderPDF);
</script>

<style scoped>
.template-editor-container { display: flex; height: 100vh; overflow: hidden; width: 100%; }
.editor-main-content { flex-grow: 1; overflow-y: auto; background-color: #f0f3f8; position: relative; }
.loading-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; background-color: rgba(255, 255, 255, 0.8); z-index: 10; }
.pdf-pages-container { padding: 24px; width: 100%; }
.page-wrapper { margin: 0 0 24px 0; width: 100%; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.canvas-container { position: relative; width: 100%; }
.editable-field { position: absolute; border: 1px dashed #007bff; background-color: rgba(0, 123, 255, 0.2); display: flex; align-items: center; justify-content: center; font-size: 12px; color: #007bff; font-weight: bold; user-select: none; }
.page-thumbnail-drawer .v-list-item { padding: 8px !important; margin-bottom: 8px; }
.thumbnail-container { position: relative; cursor: pointer; border-radius: 4px; overflow: hidden; }
.thumbnail-canvas { display: block; width: 100%; height: auto; background-color: white; }
.thumbnail-overlay { position: absolute; bottom: 0; left: 0; right: 0; background-color: rgba(0, 0, 0, 0.6); color: white; text-align: center; font-size: 12px; padding: 2px 0; }
.v-list-item--active .thumbnail-container { outline: 3px solid #1976D2; }
</style>
