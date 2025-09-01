<template>
  <v-container>
    <v-card max-width="500" class="mx-auto mt-16">
      <v-card-title class="text-center text-h5">Login do Sistema</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="handleLogin">
          <v-text-field
            v-model="email"
            label="Email"
            type="email"
            required
            prepend-inner-icon="mdi-email"
            variant="outlined"
            class="mb-4"
          ></v-text-field>
          <v-text-field
            v-model="password"
            label="Senha"
            type="password"
            required
            prepend-inner-iconmdi-lock
            variant="outlined"
          ></v-text-field>
          <v-alert v-if="errorMessage" type="error" dense class="my-4">{{ errorMessage }}</v-alert>
          <v-btn type="submit" color="primary" block size="large" :loading="loading">Entrar</v-btn>
        </v-form>
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

    const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });
    if (loginError) throw loginError;
    if (!user) throw new Error('Falha no login, usuário não encontrado.');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // --- INÍCIO DO CÓDIGO DE DIAGNÓSTICO ---
    console.clear(); // Limpa o console para facilitar a leitura
    console.log("--- DIAGNÓSTICO DE LOGIN ---");
    if (profileError) {
        console.error("ERRO AO BUSCAR PERFIL:", profileError);
    }
    
    if (profile) {
        console.log("1. Perfil encontrado:", profile);
        console.log("2. Valor do 'role' recebido do DB:", `'${profile.role}'`);
        console.log("3. Tamanho do texto (5 é o correto para 'admin'):", profile.role ? profile.role.length : 0);
        
        // CORREÇÃO: Limpa os espaços em branco antes de comparar
        const roleLimpo = profile.role ? profile.role.trim() : '';
        console.log("4. Valor do 'role' após limpeza (.trim()):", `'${roleLimpo}'`);
        console.log("5. Resultado da comparação (roleLimpo === 'admin'):", roleLimpo === 'admin');
    } else {
        console.log("NENHUM PERFIL FOI ENCONTRADO PARA ESTE USUÁRIO.");
    }
    console.log("--- FIM DO DIAGNÓSTICO ---");
    // --- FIM DO CÓDIGO DE DIAGNÓSTICO ---

    // LÓGICA DE REDIRECIONAMENTO À PROVA DE BALAS
    if (profile && profile.role && profile.role.trim() === 'admin') {
      console.log("Decisão: Redirecionando para /admin");
      router.push('/admin');
    } else {
      console.log("Decisão: Redirecionando para /dashboard");
      router.push('/dashboard');
    }

  } catch (error) {
    errorMessage.value = 'Email ou senha inválidos.';
    console.error('Erro Crítico no Bloco de Login:', error);
  } finally {
    loading.value = false;
  }
};
</script>