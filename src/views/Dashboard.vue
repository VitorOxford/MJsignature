<template>
  <v-container fluid>
    <h1 class="mb-6 text-h4 font-weight-bold">Meus Documentos</h1>

    <v-tabs v-model="tab" color="primary" grow>
      <v-tab value="mj">Empresa MJ</v-tab>
      <v-tab value="santoslopes">Santos & Lopes</v-tab>
    </v-tabs>

    <v-window v-model="tab" class="mt-5">
      <v-window-item value="mj">
        <DocumentList :company-filter="'MJ'" />
      </v-window-item>
      <v-window-item value="santoslopes">
        <DocumentList :company-filter="'Santos & Lopes'" />
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script setup>
import { ref, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabaseClient';
import DocumentPreview from '@/components/DocumentPreview.vue';
import { VProgressCircular, VAlert, VRow, VCol, VCard, VCardTitle, VCardSubtitle, VCardActions, VBtn } from 'vuetify/components';

const tab = ref(null);
const router = useRouter();

const DocumentList = {
  props: ['companyFilter'],
  setup(props) {
    const documents = ref([]);
    const loading = ref(true);
    const error = ref(null);

    const fetchDocuments = async () => {
      try {
        loading.value = true;
        const { data, error: dbError } = await supabase.from('document_templates').select('*');
        if (dbError) throw dbError;
        const docsWithUrls = await Promise.all(
          data.map(async (doc) => {
            const { data: urlData } = await supabase.storage.from('templates').createSignedUrl(doc.storage_path, 3600);
            return { ...doc, previewUrl: urlData?.signedUrl };
          })
        );
        documents.value = docsWithUrls.filter(d => d.previewUrl);
      } catch (err) {
        error.value = `Erro ao buscar documentos: ${err.message}`;
      } finally {
        loading.value = false;
      }
    };

    onMounted(fetchDocuments);

    return () => {
      if (loading.value) return h('div', { class: 'text-center pa-10' }, [h(VProgressCircular, { indeterminate: true, size: '64' })]);
      if (error.value) return h(VAlert, { type: 'error' }, error.value);
      if (documents.value.length === 0) return h(VAlert, { type: 'info' }, 'Nenhum documento encontrado.');

      return h(VRow, {}, documents.value.map(doc =>
        h(VCol, { cols: 12, sm: 6, md: 4, lg: 3 }, [
          h(VCard, { class: 'document-card', hover: true }, [
            h(DocumentPreview, { documentUrl: doc.previewUrl }),
            h(VCardTitle, {}, doc.title),
            h(VCardSubtitle, {}, doc.description || 'Sem descrição'),
            h(VCardActions, [
              h(VBtn, { color: 'primary', block: true, onClick: () => router.push(`/sign/${doc.id}`) }, 'Assinar')
            ])
          ])
        ])
      ));
    };
  }
};
</script>

<style scoped>
.document-card { transition: all 0.2s ease-in-out; }
.document-card:hover { transform: translateY(-5px); box-shadow: 0 8px 20px rgba(0,0,0,0.12) !important; }
</style>