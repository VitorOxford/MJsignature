<template>
  <div class="editor-layout" v-if="template">
    <v-navigation-drawer permanent width="320" class="pa-4">
      <h3 class="text-h6 mb-4">Ferramentas</h3>
      <v-card variant="outlined" class="mb-6">
        <v-card-text>
          <v-text-field
            v-model="newField.id"
            label="ID do Novo Campo (único)"
            variant="outlined"
            density="compact"
            hide-details
            class="mb-3"
          ></v-text-field>
          <v-select
            v-model="newField.type"
            :items="['text', 'signature']"
            label="Tipo de Campo"
            variant="outlined"
            density="compact"
            hide-details
            class="mb-3"
          ></v-select>
          <v-btn color="primary" @click="addField" block>Adicionar na Página {{ currentPage }}</v-btn>
        </v-card-text>
      </v-card>

      <h3 class="text-h6 mb-4">Propriedades do Campo</h3>
      <v-card variant="outlined">
        <v-card-text v-if="selectedFieldData">
          <p class="font-weight-bold mb-2">ID: {{ selectedFieldData.id }}</p>
          <v-text-field readonly label="Página" :model-value="selectedFieldData.page" variant="outlined" density="compact"></v-text-field>
          <v-text-field type="number" label="Pos. X (px)" v-model.number="selectedFieldData.x" variant="outlined" density="compact"></v-text-field>
          <v-text-field type="number" label="Pos. Y (px)" v-model.number="selectedFieldData.y" variant="outlined" density="compact"></v-text-field>
          <v-text-field type="number" label="Largura (px)" v-model.number="selectedFieldData.width" variant="outlined" density="compact"></v-text-field>
          <v-text-field type="number" label="Altura (px)" v-model.number="selectedFieldData.height" variant="outlined" density="compact"></v-text-field>
        </v-card-text>
        <v-card-text v-else class="text-center text-grey">
          <p>Selecione um campo no documento para ver suas propriedades.</p>
        </v-card-text>
      </v-card>
      
      <template v-slot:append>
        <div class="pa-2">
          <v-btn color="success" @click="saveTemplate" block size="large">
            <v-icon left>mdi-content-save</v-icon>
            Salvar Template
          </v-btn>
        </div>
      </template>

    </v-navigation-drawer>

    <div class="canvas-workspace">
      <v-toolbar color="white" flat class="mb-4 border-b">
        <v-toolbar-title class="font-weight-bold">{{ template.title }}</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn @click="changePage(-1)" :disabled="currentPage === 1" icon="mdi-chevron-left"></v-btn>
        <span class="mx-2">Página {{ currentPage }} de {{ numPages }}</span>
        <v-btn @click="changePage(1)" :disabled="currentPage === numPages" icon="mdi-chevron-right"></v-btn>
      </v-toolbar>
      
      <div class="canvas-container">
        <div ref="pdfContainer" class="pdf-render-area" style="position: relative;">
          <canvas ref="pdfCanvas"></canvas>
          <div
            v-for="field in filteredFields"
            :key="field.id"
            class="field-box"
            :class="{ 'selected': selectedField === field.id }"
            :style="{ left: `${field.x}px`, top: `${field.y}px`, width: `${field.width}px`, height: `${field.height}px` }"
            @mousedown="selectField(field.id)"
            :data-id="field.id"
          >
            <span>{{ field.id }}</span>
            <div class="remove-btn" @click.stop="removeField(field.id)">
              <v-icon size="x-small">mdi-close</v-icon>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div v-else class="d-flex justify-center align-center h-100">
    <v-progress-circular indeterminate size="64"></v-progress-circular>
  </div>
  <v-alert v-if="error" type="error" prominent>{{ error }}</v-alert>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { supabase } from '@/lib/supabaseClient';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import interact from 'interactjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const route = useRoute();
const template = ref(null);
const loading = ref(true);
const error = ref(null);
const pdfCanvas = ref(null);
const selectedField = ref(null);

let pdfDoc = null;
const currentPage = ref(1);
const numPages = ref(0);

const newField = ref({ id: '', type: 'text' });

const filteredFields = computed(() => {
  return template.value?.editable_fields.filter(f => f.page === currentPage.value) || [];
});

const selectedFieldData = computed({
  get: () => template.value?.editable_fields.find(f => f.id === selectedField.value),
  set: (newValue) => {
    if (!newValue) return;
    const index = template.value.editable_fields.findIndex(f => f.id === selectedField.value);
    if (index !== -1) {
      template.value.editable_fields[index] = newValue;
    }
  }
});

const fetchTemplate = async () => {
  try {
    const { data, error: dbError } = await supabase.from('document_templates').select('*').eq('id', route.params.id).single();
    if (dbError) throw dbError;
    data.editable_fields = data.editable_fields.map(f => ({ ...f, page: f.page || 1 }));
    template.value = data;
    await renderPdf();
  } catch (err) {
    error.value = `Erro ao carregar template: ${err.message}`;
  } finally {
    loading.value = false;
  }
};

const renderPdf = async () => {
  if (!template.value) return;
  try {
    if (!pdfDoc) {
      const { data: urlData, error: urlError } = await supabase.storage.from('templates').createSignedUrl(template.value.storage_path, 3600);
      if (urlError) throw urlError;
      pdfDoc = await pdfjsLib.getDocument(urlData.signedUrl).promise;
      numPages.value = pdfDoc.numPages;
    }
    const page = await pdfDoc.getPage(currentPage.value);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = pdfCanvas.value;
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    await nextTick();
    setupInteract();
  } catch(err) {
    error.value = `Erro ao renderizar PDF: ${err.message}`;
  }
};

const changePage = (offset) => {
  const newPage = currentPage.value + offset;
  if (newPage > 0 && newPage <= numPages.value) {
    currentPage.value = newPage;
    selectedField.value = null;
    renderPdf();
  }
};

const addField = () => {
  if (!newField.value.id || !template.value.editable_fields.every(f => f.id !== newField.value.id)) {
    alert('ID do campo é obrigatório e deve ser único.');
    return;
  }
  template.value.editable_fields.push({
    id: newField.value.id,
    type: newField.value.type,
    x: 20, y: 20, width: 200, height: 50,
    page: currentPage.value,
  });
  newField.value.id = '';
  nextTick(setupInteract);
};

const removeField = (fieldId) => {
  template.value.editable_fields = template.value.editable_fields.filter(f => f.id !== fieldId);
};

const selectField = (fieldId) => {
  selectedField.value = fieldId;
};

const saveTemplate = async () => {
  try {
    const { error: saveError } = await supabase.from('document_templates').update({ editable_fields: template.value.editable_fields }).eq('id', route.params.id);
    if (saveError) throw saveError;
    alert('Template salvo com sucesso!');
  } catch (err) {
    error.value = `Erro ao salvar: ${err.message}`;
  }
};

const setupInteract = () => {
  interact('.field-box').draggable({
    listeners: {
      move(event) {
        const field = selectedFieldData.value;
        if (field) {
          field.x = Math.round((field.x + event.dx) * 100) / 100;
          field.y = Math.round((field.y + event.dy) * 100) / 100;
        }
      },
    },
    modifiers: [interact.modifiers.restrictRect({ restriction: 'parent' })]
  }).resizable({
    edges: { left: true, right: true, bottom: true, top: true },
    listeners: {
      move(event) {
        const field = selectedFieldData.value;
        if (field) {
          field.width = Math.round(event.rect.width);
          field.height = Math.round(event.rect.height);
          field.x = Math.round((field.x + event.deltaRect.left) * 100) / 100;
          field.y = Math.round((field.y + event.deltaRect.top) * 100) / 100;
        }
      }
    },
    modifiers: [
      interact.modifiers.restrictEdges({ outer: 'parent' }),
      interact.modifiers.restrictSize({ min: { width: 50, height: 20 } })
    ]
  });
};

onMounted(fetchTemplate);

onMounted(() => {
  document.addEventListener('mousedown', (e) => {
    if (!e.target.closest('.field-box') && !e.target.closest('.v-navigation-drawer')) {
      selectedField.value = null;
    }
  });
});
</script>

<style scoped>
.editor-layout {
  display: flex;
  height: calc(100vh - 64px); /* 64px é a altura da app-bar */
  overflow: hidden;
}
.canvas-workspace {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.canvas-container {
  flex-grow: 1;
  overflow: auto;
  background-color: #ECEFF1;
  padding: 32px;
  display: flex;
  justify-content: center;
}
.pdf-render-area {
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}
.field-box {
  position: absolute;
  border: 2px dashed rgba(52, 152, 219, 0.7);
  background-color: rgba(52, 152, 219, 0.2);
  color: #2c3e50;
  font-size: 12px;
  box-sizing: border-box;
  user-select: none;
  cursor: move;
  transition: all 0.1s ease-in-out;
}
.field-box.selected {
  border-style: solid;
  border-color: #e74c3c;
  background-color: rgba(231, 76, 60, 0.3);
  z-index: 10;
}
.field-box span {
  padding: 2px 4px;
  background-color: rgba(255,255,255,0.7);
  border-radius: 4px;
  font-weight: bold;
}
.remove-btn {
  position: absolute;
  top: -12px;
  right: -12px;
  width: 24px;
  height: 24px;
  background-color: #e74c3c;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: bold;
  opacity: 0;
  transition: opacity 0.2s;
}
.field-box.selected .remove-btn {
  opacity: 1;
}
</style>