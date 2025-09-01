// src/main.js

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
// NÃO PRECISA MAIS DE: import * as components from 'vuetify/components'
// NÃO PRECISA MAIS DE: import { VDataTable } from 'vuetify/labs/VDataTable'
import '@mdi/font/css/materialdesignicons.css'
import VueSignaturePad from 'vue-signature-pad';

const ProfessionalTheme = {
  dark: true,
  colors: {
    background: '#121212',
    surface: '#1E1E1E',
    primary: '#1a1a1bff',
    secondary: '#03DAC6',
    error: '#CF6679',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FB8C00',
  },
}

// Note que a propriedade 'components' foi removida, pois o plugin cuida disso
const vuetify = createVuetify({
  theme: {
    defaultTheme: 'ProfessionalTheme',
    themes: {
      ProfessionalTheme,
    },
  },
})

const app = createApp(App)
app.use(router)
app.use(vuetify)
app.use(VueSignaturePad);
app.mount('#app')