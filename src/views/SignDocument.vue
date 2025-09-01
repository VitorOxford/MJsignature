<template>
  <div v-if="template">
    <v-dialog v-model="showSuccessDialog" persistent max-width="400">
      <v-card>
        <v-card-title class="text-h5 green--text">Sucesso!</v-card-title>
        <v-card-text>
          Seu documento foi assinado e salvo com sucesso. Você será redirecionado para o Dashboard.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" text @click="redirectToDashboard">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <h2 class="mb-4">Assinando: {{ template.title }}</h2>

    <div class="pdf-container" style="border: 1px solid #ccc;">
      <div
        v-for="page in pages"
        :key="page.pageNumber"
        class="page-container"
        style="position: relative;"
      >
        <canvas :ref="el => setCanvasRef(el, page.pageNumber)"></canvas>

        <div
          v-for="field in page.fields"
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
            class="text-field-visible"
          ></v-text-field>

          <div v-if="field.type === 'signature'" class="signature-wrapper">
            <div class="signature-header">
              <span>Assine aqui ({{ field.id }})</span>
            </div>
            <div class="signature-pad-container">
              <VueSignaturePad
                :ref="el => setSignaturePadRef(el, field.id)"
                width="100%"
                height="100%"
                :options="{ onEnd: () => onSignatureEnd(field.id) }"
              />
              <input
                type="file"
                :ref="el => setFileInputRef(el, field.id)"
                style="display: none;"
                accept="image/*"
                @change="handleSignatureUpload($event, field.id)"
              />
            </div>
            <div class="signature-actions">
              <v-btn size="x-small" icon="mdi-upload" title="Carregar imagem" @click="triggerFileInput(field.id)"></v-btn>
              <v-btn size="x-small" icon="mdi-eraser" title="Limpar Assinatura" @click="clearSignature(field.id)"></v-btn>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <v-btn :loading="isSaving" :disabled="isSaving" color="primary" @click="finalizeDocument" class="mt-4">
      Finalizar e Salvar Documento
    </v-btn>
  </div>
  <div v-else-if="loading" class="text-center pa-10">
     <v-progress-circular indeterminate size="64"></v-progress-circular>
    <p class="mt-4">Carregando documento...</p>
  </div>
   <v-alert v-if="error" type="error" class="mt-4">{{ error }}</v-alert>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router'; // Importa useRouter
import { supabase } from '@/lib/supabaseClient';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const route = useRoute();
const router = useRouter(); // Instancia o router
const template = ref(null);
const loading = ref(true);
const error = ref(null);
const formData = ref({});

// --- VARIÁVEIS DE ESTADO ---
const isSaving = ref(false);
const showSuccessDialog = ref(false);

const pages = ref([]);
const canvasRefs = ref({});
const signaturePadRefs = ref({});
const fileInputRefs = ref({});

const setCanvasRef = (el, pageNumber) => {
  if (el) {
    canvasRefs.value[pageNumber] = el;
  }
};

const setSignaturePadRef = (el, fieldId) => {
  if (el) {
    signaturePadRefs.value[fieldId] = el;
  }
};

const setFileInputRef = (el, fieldId) => {
  if (el) {
    fileInputRefs.value[fieldId] = el;
  }
};

const fetchAndRender = async () => {
  try {
    const { data, error: dbError } = await supabase.from('document_templates').select('*').eq('id', route.params.id).single();
    if (dbError) throw dbError;
    template.value = data;

    const { data: urlData, error: urlError } = await supabase.storage.from('templates').createSignedUrl(data.storage_path, 3600);
    if (urlError) throw urlError;

    const loadingTask = pdfjsLib.getDocument(urlData.signedUrl);
    const pdf = await loadingTask.promise;
    const numPdfPages = pdf.numPages;
    const pagesData = [];

    for (let i = 1; i <= numPdfPages; i++) {
      const fieldsForPage = template.value.editable_fields.filter(f => (f.page || 1) === i);
      pagesData.push({ pageNumber: i, fields: fieldsForPage });
    }
    pages.value = pagesData;

    await nextTick();

    for (let i = 1; i <= numPdfPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = canvasRefs.value[i];

      if (canvas) {
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      }
    }

  } catch (err) {
    console.error(err);
    error.value = `Erro ao carregar documento: ${err.message}`;
  } finally {
    loading.value = false;
  }
};

const onSignatureEnd = (fieldId) => {
  const signaturePad = signaturePadRefs.value[fieldId];
  if (signaturePad) {
    // A biblioteca salva um objeto { isEmpty, data }, pegamos apenas os dados.
    const signatureData = signaturePad.saveSignature();
    if (!signatureData.isEmpty) {
        formData.value[fieldId] = signatureData.data;
    }
  }
};

const clearSignature = (fieldId) => {
  if (signaturePadRefs.value[fieldId]) {
    signaturePadRefs.value[fieldId].clearSignature();
    formData.value[fieldId] = null;
  }
};

const triggerFileInput = (fieldId) => {
  fileInputRefs.value[fieldId].click();
};

const handleSignatureUpload = (event, fieldId) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const signaturePad = signaturePadRefs.value[fieldId];
    if (signaturePad) {
        // Usa fromDataURL para carregar a imagem e então salva
        signaturePad.fromDataURL(e.target.result);
        // Garante que o onEnd seja chamado para atualizar os dados
        setTimeout(() => onSignatureEnd(fieldId), 100);
    }
  };
  reader.readAsDataURL(file);
};

const finalizeDocument = async () => {
  isSaving.value = true;
  error.value = null;

  try {
    for (const field of template.value.editable_fields) {
      if (!formData.value[field.id]) {
        throw new Error(`O campo "${field.id}" é obrigatório.`);
      }
    }

    const { data, error: functionError } = await supabase.functions.invoke('merge-pdf', {
      body: {
        templateId: route.params.id,
        formData: formData.value
      },
    });

    if (functionError) {
      const detailedError = functionError.context?.data?.error || functionError.message;
      throw new Error(`Erro no servidor: ${detailedError}`);
    }

    console.log('Documento salvo com sucesso:', data);
    showSuccessDialog.value = true;

  } catch (err) {
    error.value = err.message;
  } finally {
    isSaving.value = false;
  }
};

const redirectToDashboard = () => {
  showSuccessDialog.value = false;
  router.push('/dashboard');
};

onMounted(fetchAndRender);
</script>

<style scoped>
.text-field-visible :deep(input) {
  color: black !important;
}

.pdf-container {
  overflow: auto;
  max-height: 80vh;
  background-color: #f0f0f0;
}
.page-container {
  margin: 10px auto;
  box-shadow: 0 0 10px rgba(0,0,0,0.2);
}
.input-field {
  position: absolute;
  z-index: 10;
}
.signature-wrapper {
  width: 100%;
  height: 100%;
  border: 1px dashed #0056b3;
  display: flex;
  flex-direction: column;
  background-color: rgba(230, 240, 255, 0.7);
}
.signature-header {
  background-color: #0056b3;
  color: white;
  padding: 2px 4px;
  font-size: 10px;
  text-align: center;
  user-select: none;
}
.signature-pad-container {
  flex-grow: 1;
  position: relative;
}
.signature-pad-container :deep(canvas) {
  position: absolute;
  width: 100% !important;
  height: 100% !important;
}
.signature-actions {
  display: flex;
  justify-content: space-around;
  background-color: #f0f0f0;
  padding: 2px;
}
</style>