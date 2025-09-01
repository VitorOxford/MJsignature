<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4">Gerenciamento de Templates</h1>
        <p class="text-medium-emphasis">Crie, edite e gerencie os documentos disponíveis para assinatura.</p>
      </div>
      <v-btn color="primary" size="large" prepend-icon="mdi-plus-circle" @click="dialog = true">
        Novo Template
      </v-btn>
    </div>

    <v-card>
      <v-card-title class="d-flex align-center pa-4">
        <p>Todos os Templates</p>
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          density="compact"
          label="Buscar template..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          flat
          hide-details
          single-line
        ></v-text-field>
      </v-card-title>
      
      <v-divider></v-divider>

      <v-data-table
        :headers="headers"
        :items="templates"
        :search="search"
        :loading="loading"
        loading-text="Buscando templates no banco de dados..."
        no-data-text="Nenhum template encontrado. Clique em 'Novo Template' para começar."
        items-per-page-text="Itens por página"
      >
        <template v-slot:item.created_at="{ item }">
          {{ new Date(item.created_at).toLocaleDateString('pt-BR') }}
        </template>
<template v-slot:item.actions="{ item }">
  <v-tooltip text="Editar Campos">
    <template v-slot:activator="{ props }">
      <v-btn
        v-bind="props"
        icon="mdi-pencil"
        variant="text"
        color="grey-darken-1"
        :to="{ name: 'TemplateEditor', params: { id: item.id } }"
      ></v-btn>
    </template>
  </v-tooltip>

  <v-tooltip text="Excluir Template">
    <template v-slot:activator="{ props }">
       <v-btn
        v-bind="props"
        icon="mdi-delete"
        variant="text"
        color="error"
        @click="deleteItem(item)"
      ></v-btn>
    </template>
  </v-tooltip>
</template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" persistent max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">Adicionar Novo Template</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-form v-if="dialog">
              <v-text-field
                v-model="newTemplate.title"
                label="Título do Documento *"
                required
                variant="outlined"
                class="mb-4"
              ></v-text-field>
              <v-file-input
                v-model="newTemplate.file"
                label="Arquivo PDF *"
                accept=".pdf"
                required
                variant="outlined"
              ></v-file-input>
            </v-form>
          </v-container>
          <small>* indica campo obrigatório</small>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDialog">Cancelar</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="handleCreateTemplate"
            :loading="isUploading"
            :disabled="!newTemplate.title || !newTemplate.file.length"
          >
            Salvar Template
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '@/lib/supabaseClient';

const search = ref('');
const loading = ref(false);
const templates = ref([]);
const headers = ref([
  { title: 'Título do Template', key: 'title', align: 'start' },
  { title: 'Criado em', key: 'created_at', align: 'start' },
  { title: 'Nº de Campos', key: 'editable_fields.length', align: 'center', sortable: false },
  { title: 'Ações', key: 'actions', sortable: false, align: 'end' },
]);

const dialog = ref(false);
const isUploading = ref(false);
const newTemplate = ref({
  title: '',
  file: [],
});

const fetchTemplates = async () => {
  loading.value = true;
  try {
    const { data, error } = await supabase.from('document_templates').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    templates.value = data;
  } catch (error) {
    console.error('Erro ao buscar templates:', error);
  } finally {
    loading.value = false;
  }
};

const handleCreateTemplate = async () => {
  if (!newTemplate.value.title || !newTemplate.value.file.length) {
    return alert('Por favor, preencha todos os campos.');
  }
  isUploading.value = true;
  try {
    const file = newTemplate.value.file[0];
    if (!file) throw new Error("Arquivo não selecionado.");

    const { data: { user } } = await supabase.auth.getUser();
    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('templates').upload(filePath, file);
    if (uploadError) throw uploadError;

    const { error: insertError } = await supabase.from('document_templates').insert({
      title: newTemplate.value.title,
      storage_path: filePath,
      created_by: user.id,
      editable_fields: [],
    });
    if (insertError) throw insertError;
    
    closeDialog();
    await fetchTemplates();
  } catch (error) {
    console.error('Erro ao criar template:', error);
    alert(`Erro: ${error.message}`);
  } finally {
    isUploading.value = false;
  }
};

const closeDialog = () => {
  dialog.value = false;
  newTemplate.value.title = '';
  newTemplate.value.file = [];
};

const editItem = (item) => {
  console.log('Editando:', item.title);
};

const deleteItem = (item) => {
  console.log('Excluindo:', item.title);
};

onMounted(() => {
  fetchTemplates();
});
</script>