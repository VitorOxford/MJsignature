<template>
  <div v-if="template">
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h1 class="text-h4">Editor de Template: {{ template.title }}</h1>
        <p class="text-medium-emphasis">Arraste e posicione os campos no documento.</p>
      </div>
      <div>
        <v-btn @click="addField('text')" class="me-2" prepend-icon="mdi-format-text">Adicionar Texto</v-btn>
        <v-btn @click="addField('signature')" prepend-icon="mdi-draw">Adicionar Assinatura</v-btn>
        <v-btn @click="saveFields" color="primary" class="ms-4" :loading="isSaving">Salvar Campos</v-btn>
      </div>
    </div>

    <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>

    <div ref="pageContainer" class="pdf-container" style="position: relative; border: 1px solid #ccc;">
      <canvas ref="pdfCanvas"></canvas>
      
      <div
        v-for="(field, index) in fields"
        :key="field.id"
        class="draggable-field"
        :class="{ 'signature-field': field.type === 'signature', 'text-field': field.type === 'text' }"
        :data-id="field.id"
        :style="{ left: `${field.x}px`, top: `${field.y}px`, width: `${field.width}px`, height: `${field.height}px` }"
      >
        <div class="field-label">{{ field.type === 'text' ? 'Texto' : 'Assinatura' }} ({{ field.id }})</div>
        <v-btn
          icon="mdi-delete"
          size="x-small"
          variant="flat"
          color="error"
          class="delete-btn"
          @click.stop="removeField(index)"
        ></v-btn>
      </div>
    </div>
  </div>
  <div v-else-if="loading" class="text-center pa-10">
    <v-progress-circular indeterminate size="64"></v-progress-circular>
    <p class="mt-4">Carregando template...</p>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { supabase } from '@/lib/supabaseClient';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import interact from 'interactjs';
import { nanoid } from 'nanoid';

// CORREÇÃO FINAL: Aponta para o worker .js (versão mais compatível) na pasta /public
pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.js`;

const props = defineProps({ id: String });
const template = ref(null);
const fields = ref([]);
const loading = ref(true);
const isSaving = ref(false);
const error = ref(null);
const pdfCanvas = ref(null);
const pageContainer = ref(null);

const fetchTemplate = async () => {
  try {
    const { data, error: dbError } = await supabase.from('document_templates').select('*').eq('id', props.id).single();
    if (dbError) throw dbError;
    template.value = data;
    fields.value = data.editable_fields || [];
    await renderPdf(data.storage_path);
  } catch (err) {
    error.value = `Erro ao carregar template: ${err.message}`;
  } finally {
    loading.value = false;
  }
};

const renderPdf = async (path) => {
  try {
    const { data, error: urlError } = await supabase.storage.from('templates').createSignedUrl(path, 3600);
    if (urlError) throw urlError;
    const loadingTask = pdfjsLib.getDocument(data.signedUrl);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = pdfCanvas.value;
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    const renderContext = { canvasContext: context, viewport: viewport };
    await page.render(renderContext).promise;
    await nextTick();
    setupInteract();
  } catch (err) {
    error.value = `Erro ao renderizar PDF: ${err.message}`;
  }
};

const addField = (type) => {
  fields.value.push({
    id: nanoid(8),
    type: type,
    x: 20, y: 20,
    width: type === 'signature' ? 200 : 250,
    height: type === 'signature' ? 80 : 40,
  });
};

const removeField = (index) => {
  fields.value.splice(index, 1);
};

const saveFields = async () => {
  isSaving.value = true;
  try {
    const { error: updateError } = await supabase.from('document_templates').update({ editable_fields: fields.value }).eq('id', props.id);
    if (updateError) throw updateError;
    alert('Campos salvos com sucesso!');
  } catch (err) {
    error.value = `Erro ao salvar campos: ${err.message}`;
  } finally {
    isSaving.value = false;
  }
};

const setupInteract = () => {
  interact('.draggable-field').draggable({
    listeners: {
      move(event) {
        const target = event.target;
        const fieldId = target.getAttribute('data-id');
        const field = fields.value.find(f => f.id === fieldId);
        if (field) {
          field.x += event.dx;
          field.y += event.dy;
        }
      }
    },
    modifiers: [interact.modifiers.restrictRect({ restriction: 'parent' })]
  }).resizable({
    edges: { left: true, right: true, bottom: true, top: true },
    listeners: {
      move(event) {
        const target = event.target;
        const fieldId = target.getAttribute('data-id');
        const field = fields.value.find(f => f.id === fieldId);
        if (field) {
          field.width = event.rect.width;
          field.height = event.rect.height;
          field.x += event.deltaRect.left;
          field.y += event.deltaRect.top;
        }
      }
    },
    modifiers: [interact.modifiers.restrictSize({ min: { width: 50, height: 30 } })]
  });
};

onMounted(fetchTemplate);
onBeforeUnmount(() => {
  if (interact.isSet('.draggable-field')) {
    interact('.draggable-field').unset();
  }
});
</script>

<style scoped>
.pdf-container { overflow: auto; max-height: 80vh; }
.draggable-field { position: absolute; border: 2px dashed; touch-action: none; box-sizing: border-box; display: flex; align-items: center; justify-content: center; color: white; font-family: sans-serif; }
.text-field { background-color: rgba(63, 81, 181, 0.7); border-color: #3F51B5; }
.signature-field { background-color: rgba(3, 218, 198, 0.7); border-color: #03DAC6; }
.field-label { font-size: 14px; font-weight: bold; pointer-events: none; }
.delete-btn { position: absolute; top: -12px; right: -12px; cursor: pointer; }
</style>