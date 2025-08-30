<template>
  <v-card>
    <v-tabs v-model="tab" bg-color="primary">
      <v-tab value="draw">Desenhar Assinatura</v-tab>
      <v-tab value="upload_image">Enviar Imagem</v-tab>
      <v-tab value="upload_signed_doc">Enviar Documento Assinado</v-tab>
    </v-tabs>

    <v-card-text>
      <v-window v-model="tab">
        <v-window-item value="draw">
          <p class="mb-2">Desenhe sua assinatura no campo abaixo:</p>
          <div style="border: 1px solid #ccc; max-width: 500px;">
            <VueSignaturePad
              ref="signaturePad"
              width="500px"
              height="200px"
              :options="{ onBegin, onEnd }"
            />
          </div>
          <v-btn @click="clearSignature" class="mt-2">Limpar</v-btn>
          <v-btn @click="saveSignature" color="primary" class="mt-2 ml-2">Salvar Assinatura Desenhada</v-btn>
        </v-window-item>

        <v-window-item value="upload_image">
          <p>Envie uma imagem da sua assinatura (formato PNG com fundo transparente é recomendado).</p>
          <v-file-input
            v-model="signatureImageFile"
            label="Selecione a imagem da assinatura"
            accept="image/png"
            prepend-icon="mdi-camera"
            class="mt-4"
          ></v-file-input>
          <v-btn @click="uploadSignatureImage" color="primary" :disabled="!signatureImageFile">Usar esta Imagem</v-btn>
        </v-window-item>

        <v-window-item value="upload_signed_doc">
          <p>Baixe o documento original, assine-o usando seu software de preferência (com certificado digital, por exemplo) e envie o arquivo assinado de volta.</p>
          <v-btn href="/caminho/para/documento/original" download color="secondary">Baixar Documento Original</v-btn>
          <v-file-input
            v-model="signedDocumentFile"
            label="Selecione o documento assinado"
            accept=".pdf"
            prepend-icon="mdi-file-upload"
            class="mt-4"
          ></v-file-input>
          <v-btn @click="uploadSignedDocument" color="primary" :disabled="!signedDocumentFile">Enviar Documento Assinado</v-btn>
        </v-window-item>
      </v-window>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref } from 'vue';
import VueSignaturePad from 'vue-signature-pad';

// Referências do Template
const signaturePad = ref(null);
const tab = ref(null);

// Modelos para os inputs de arquivo
const signatureImageFile = ref(null);
const signedDocumentFile = ref(null);

// Funções para a aba de desenho
const clearSignature = () => {
  signaturePad.value.clearSignature();
};

const saveSignature = () => {
  const { isEmpty, data } = signaturePad.value.saveSignature();
  if (!isEmpty) {
    console.log('Assinatura desenhada (Base64 Data URL):', data);
    // LÓGICA: Enviar 'data' para uma Supabase Edge Function que irá
    // mesclar esta imagem em um documento PDF.
    alert('Assinatura salva! (Ver console)');
  } else {
    alert('Por favor, desenhe sua assinatura primeiro.');
  }
};

// Funções para a aba de upload de imagem
const uploadSignatureImage = () => {
  if (!signatureImageFile.value) return;
  console.log('Arquivo de imagem da assinatura:', signatureImageFile.value);
  // LÓGICA: Fazer o upload deste arquivo para o Supabase Storage.
  // Depois, uma Edge Function pode usar o path do arquivo para mesclar no PDF.
  alert('Imagem da assinatura enviada! (Ver console)');
};

// Funções para a aba de upload do documento assinado
const uploadSignedDocument = () => {
  if (!signedDocumentFile.value) return;
  console.log('Arquivo do documento assinado:', signedDocumentFile.value);
  // LÓGICA: Fazer o upload deste arquivo para o bucket 'documentos-assinados'
  // e atualizar o registro na tabela 'documents' com o novo caminho.
  alert('Documento assinado enviado! (Ver console)');
};

// Opcional: Callbacks para saber quando o usuário começa/termina de desenhar
const onBegin = () => {
  console.log('Usuário começou a desenhar.');
};

const onEnd = () => {
  console.log('Usuário terminou de desenhar.');
};
</script>