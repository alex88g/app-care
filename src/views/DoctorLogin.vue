<template>
    <div class="login-container">
      <h1>🩺 Läkarinloggning</h1>
  
      <form @submit.prevent="handleLogin">
        <div class="input-group">
          <label for="code">🔑 Admins lösenord</label>
          <input
            v-model="code"
            type="text"
            id="code"
            required
            placeholder="Ange kod"
            autocomplete="off"
          />
        </div>
  
        <button type="submit" class="login-button" :disabled="isLoading">
          {{ isLoading ? '⏳ Loggar in...' : 'Logga in som läkare' }}
        </button>
  
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      </form>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import axios from 'axios';
  import { useToastSound } from '../composables/useToastSound';
  
  const code = ref('');
  const errorMessage = ref('');
  const isLoading = ref(false);
  const router = useRouter();
  const { playSound } = useToastSound();

  
  const handleLogin = async () => {
    errorMessage.value = '';
    isLoading.value = true;
  
    const trimmedCode = code.value.trim();
  
    if (!trimmedCode) {
      errorMessage.value = '⚠️ Du måste ange en kod.';
      playSound('error');
      isLoading.value = false;
      return;
    }
  
    try {
      const response = await axios.post('http://localhost:3000/api/doctors/login', {
        code: trimmedCode
      });
  
      const doctor = response.data.data;
  
      if (doctor?.name) {
        localStorage.setItem('loggedInDoctor', JSON.stringify(doctor));
        localStorage.setItem('doctorToken', 'auth-doctor-123');
        code.value = '';
        playSound('success');
        router.push('/doctor');
      } else {
        errorMessage.value = '❌ Ogiltig kod. Försök igen.';
        playSound('error');
      }
    } catch (error) {
        playSound('error');
      if (error.response?.status === 401) {
        errorMessage.value = '❌ Fel kod. Behörighet saknas.';
      } else {
        errorMessage.value = '❌ Ett fel uppstod vid inloggning.';
      }
      console.error('Login failed:', error);
    } finally {
      isLoading.value = false;
    }
  };
  </script>
  
  <style scoped>
.login-container {
  max-width: 400px;
  margin: 150px auto;
  background: white;
  padding: 24px;
  border-radius: 10px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: all 0.3s ease;
}

.input-group {
  margin-bottom: 16px;
  text-align: left;
}

.input-group label {
  font-weight: bold;
  display: block;
  margin-bottom: 6px;
}

.input-group input {
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 16px;
}

.login-button {
  width: 100%;
  padding: 12px;
  background: #3498db;
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
  font-size: 16px;
}

.login-button:hover:enabled {
  background: #2980b9;
}

.login-button:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.error-message {
  margin-top: 12px;
  color: red;
  font-weight: bold;
  font-size: 14px;
}

@media (max-width: 600px) {
  .login-container {
    margin: 80px 16px;
    padding: 20px;
    max-width: 100%;
  }

  .input-group input,
  .login-button {
    font-size: 15px;
  }
}

@media (min-width: 601px) and (max-width: 1024px) {
  .login-container {
    max-width: 90%;
    padding: 28px;
  }

  .login-button {
    font-size: 16px;
  }
}

@media (min-width: 1025px) {
  .login-container {
    max-width: 480px;
  }
}
</style>
