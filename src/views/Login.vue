<template>
  <v-container>
    <v-card max-width="500" class="mx-auto mt-16">
      <v-card-title class="text-center">Login</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="handleLogin">
          <v-text-field
            v-model="email"
            label="Email"
            type="email"
            required
            prepend-inner-icon="mdi-email"
          ></v-text-field>
          <v-text-field
            v-model="password"
            label="Senha"
            type="password"
            required
            prepend-inner-icon="mdi-lock"
          ></v-text-field>
          <v-alert v-if="errorMessage" type="error" dense class="mb-4">{{ errorMessage }}</v-alert>
          <v-btn type="submit" color="primary" block :loading="loading">Entrar</v-btn>
        </v-form>
      </v-card-text>
      <v-card-text class="text-center">
        Não tem uma conta? <a href="#">Cadastre-se</a>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref(null);
const router = useRouter();

const handleLogin = async () => {
  try {
    loading.value = true;
    errorMessage.value = null;
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });

    if (error) throw error;

    // Se o login for bem-sucedido, redireciona para o dashboard
    router.push('/dashboard');
  } catch (error) {
    errorMessage.value = error.message || 'Ocorreu um erro ao tentar fazer login.';
  } finally {
    loading.value = false;
  }
};
</script>