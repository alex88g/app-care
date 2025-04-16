<template>
  <div class="login-container">
    <h1>🔐 Patientinloggning</h1>

    <form @submit.prevent="handleLogin">
      <div class="input-group">
        <label for="phone">📱 Telefonnummer</label>
        <input
          v-model="phone"
          type="tel"
          id="phone"
          placeholder="07xxxxxxxx"
          autocomplete="off"
          required
        />
      </div>

      <p v-if="otpSent && !showRegisterFields" class="info-text">
        Kod skickad till <strong>{{ formatPhone(phone) }}</strong>
      </p>
      <div v-if="!otpSent && !showRegisterFields">
        <button type="button" class="login-button" @click="sendOTP" :disabled="isLoading || countdown > 0">
          {{ isLoading ? '⏳ Skickar kod...' : countdown > 0 ? `Skicka igen om ${countdown}s` : 'Skicka engångskod' }}
        </button>
      </div>
      <div v-if="otpSent && !showRegisterFields">
        <div class="input-group">
          <label for="otp">🔐 Engångskod</label>
          <input
            ref="otpInput"
            v-model="otpCode"
            type="text"
            id="otp"
            placeholder="6-siffrig kod"
            required
          />
        </div>
        <button type="submit" class="login-button" :disabled="isLoading">
          {{ isLoading ? '⏳ Verifierar...' : 'Verifiera och logga in' }}
        </button>
      </div>
      <div v-if="showRegisterFields">
        <div class="input-group">
          <label for="name">👤 Namn</label>
          <input v-model="name" type="text" id="name" placeholder="Ditt namn" required />
        </div>
        <div class="input-group">
          <label for="ssn">🆔 Personnummer</label>
          <input v-model="ssn" type="text" id="ssn" placeholder="ÅÅÅÅMMDDXXXX" required />
        </div>
        <div class="input-group">
          <label for="email">✉️ E-postadress</label>
          <input v-model="email" type="email" id="email" placeholder="din@email.se" required />
        </div>
        <button type="submit" class="login-button" :disabled="isLoading">
          {{ isLoading ? '⏳ Registrerar...' : 'Registrera och logga in' }}
        </button>
      </div>

      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
    </form>

    <p class="toggle-text">
      <span v-if="!showRegisterFields">
        Har du inget konto?
        <a @click="toggleRegister">Registrera dig här</a>
      </span>
      <span v-else>
        Har du redan ett konto?
        <a @click="toggleRegister">Logga in istället</a>
      </span>
    </p>
  </div>
</template>

<script setup>
import { ref, nextTick, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';
import { useToastSound } from '../composables/useToastSound';

const router = useRouter();
const { playSound } = useToastSound();

const phone = ref('');
const otpCode = ref('');
const name = ref('');
const ssn = ref('');
const email = ref('');
const otpSent = ref(false);
const showRegisterFields = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');
const otpInput = ref(null);
const countdown = ref(0);
let interval = null;

const isValidPhone = phone => /^07\d{8}$/.test(phone) || /^\+467\d{8}$/.test(phone);
const isValidOTP = code => /^\d{6}$/.test(code);
const isValidEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidSSN = ssn => /^\d{10,12}$/.test(ssn);

const formatPhone = (phone) => {
  if (phone.startsWith('0')) return '+46' + phone.slice(1);
  return phone;
};

const toggleRegister = () => {
  showRegisterFields.value = !showRegisterFields.value;
  errorMessage.value = '';
  otpSent.value = false;
  otpCode.value = '';
  name.value = '';
  ssn.value = '';
  email.value = '';
};

const startCountdown = () => {
  countdown.value = 30;
  interval = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0 && interval) {
      clearInterval(interval);
    }
  }, 1000);
};

const checkPhoneExists = async () => {
  try {
    const res = await api.checkPhone(phone.value);
    return res.data.exists;
  } catch (err) {
    console.error('❌ checkPhone error:', err);
    return false;
  }
};

const sendOTP = async () => {
  if (!isValidPhone(phone.value)) {
    errorMessage.value = '❌ Ogiltigt telefonnummer. Format: 07xxxxxxxx';
    playSound('error');
    return;
  }
  isLoading.value = true;

  const exists = await checkPhoneExists();
  if (!exists) {
    errorMessage.value = '📋 Nummer hittades inte – registrera dig först.';
    showRegisterFields.value = true;
    isLoading.value = false;
    return;
  }

  try {
    await api.sendOTP(formatPhone(phone.value));
    otpSent.value = true;
    errorMessage.value = '';
    playSound('info');
    startCountdown();
    await nextTick();
    otpInput.value?.focus();
  } catch {
    errorMessage.value = '❌ Kunde inte skicka kod.';
    playSound('error');
  } finally {
    isLoading.value = false;
  }
};

const handleLogin = async () => {
  errorMessage.value = '';
  isLoading.value = true;

  const formatted = formatPhone(phone.value);

  if (!isValidPhone(phone.value)) {
    errorMessage.value = '❌ Ogiltigt telefonnummer.';
    playSound('error');
    isLoading.value = false;
    return;
  }

  if (otpSent.value && !showRegisterFields.value) {
    if (!isValidOTP(otpCode.value)) {
      errorMessage.value = '❌ Ogiltig kod. Måste vara 6 siffror.';
      playSound('error');
      isLoading.value = false;
      return;
    }
    try {
      const res = await api.verifyOTP(formatted, otpCode.value);
      localStorage.setItem('loggedInUser', JSON.stringify(res.data.data));
      localStorage.setItem('patientPhone', formatted);
      playSound('success');
      router.push('/bookings');
    } catch {
      errorMessage.value = '❌ Fel kod eller utgången kod.';
      playSound('error');
    } finally {
      isLoading.value = false;
    }
    return;
  }

  if (!name.value || !ssn.value || !email.value) {
    errorMessage.value = '❌ Alla fält krävs för registrering.';
    playSound('error');
    isLoading.value = false;
    return;
  }

  if (!isValidSSN(ssn.value)) {
    errorMessage.value = '❌ Ogiltigt personnummer.';
    playSound('error');
    isLoading.value = false;
    return;
  }

  if (!isValidEmail(email.value)) {
    errorMessage.value = '❌ Ogiltig e-postadress.';
    playSound('error');
    isLoading.value = false;
    return;
  }

  try {
    const res = await api.registerPatient(name.value, formatted, ssn.value, email.value);
    localStorage.setItem('loggedInUser', JSON.stringify(res.data.data));
    localStorage.setItem('patientPhone', formatted);
    playSound('success');
    router.push('/bookings');
  } catch (err) {
    if (err.response?.status === 409) {
      errorMessage.value = '❌ Detta nummer är redan registrerat.';
    } else {
      errorMessage.value = '❌ Fel vid registrering.';
    }
    playSound('error');
  } finally {
    isLoading.value = false;
  }
};

onUnmounted(() => {
  if (interval) clearInterval(interval);
});
</script>


<style scoped>
.login-container {
  max-width: 400px;
  width: 90%;
  margin: 120px auto;
  background: white;
  padding: 24px;
  border-radius: 10px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  text-align: center;
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
  font-size: 15px;
}
.login-button {
  width: 100%;
  padding: 12px;
  background: #2ecc71;
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 12px;
  transition: background 0.2s ease-in-out;
}
.login-button:hover:enabled {
  background: #27ae60;
}
.login-button:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}
.error-text {
  color: red;
  margin-top: 10px;
  font-weight: bold;
}
.info-text {
  font-size: 14px;
  color: #444;
  margin-bottom: 12px;
}
.toggle-text {
  margin-top: 16px;
  font-size: 14px;
}
.toggle-text a {
  color: #3498db;
  cursor: pointer;
  font-weight: bold;
  margin-left: 6px;
}
@media (max-width: 600px) {
  .login-container {
    margin: 60px 16px;
    padding: 20px;
  }
  .input-group input {
    font-size: 14px;
  }
  .login-button {
    padding: 10px;
    font-size: 15px;
  }
}
@media (min-width: 601px) and (max-width: 1024px) {
  .login-container {
    margin: 100px auto;
    padding: 24px;
  }
}
</style>
