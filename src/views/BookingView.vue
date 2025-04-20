<template>
  <div class="booking-container">
    <div class="logout-area">
      <span>Inloggad som: {{ name }}</span>
      <button @click="logout" class="logout-button">
  <span class="icon-text">🚪 Logga ut</span>
</button>

      <button @click="deleteAccount" class="logout-button" style="background-color: #c0392b">🗑 Radera konto</button>
    </div>

    <h1 class="booking-container__title">📅 Boka ett möte</h1>

    <p v-if="name" class="booking-container__welcome">
      👋 Välkommen, {{ name }}!
    </p>

    <div class="booking-container__input-group">
      <label for="date">📆 Välj datum</label>
      <input
        type="date"
        id="date"
        v-model="selectedDate"
        :min="today"
        class="booking-container__input"
      />
    </div>

    <div class="booking-container__input-group">
      <label for="time">⏰ Välj tid</label>
      <select
        id="time"
        v-model="selectedTime"
        class="booking-container__input"
        :disabled="isWeekend || availableTimeOptions.length === 0"
      >
        <option v-for="hour in availableTimeOptions" :key="hour" :value="hour">
          {{ hour }}
        </option>
      </select>
    </div>

    <p v-if="isWeekend" class="booking-container__warning">
      📞 Endast akut samtal möjligt på helger.
    </p>

    <div class="booking-container__input-group">
      <label for="name">👤 Ditt namn</label>
      <input type="text" id="name" v-model="name" readonly class="booking-container__input" />
    </div>

    <div class="booking-container__input-group">
      <label for="phone">📞 Mobilnummer</label>
      <input type="tel" id="phone" v-model="phone" readonly class="booking-container__input" />
    </div>

    <div class="booking-container__input-group">
      <label for="email">✉️ E-postadress</label>
      <input type="email" id="email" v-model="email" readonly class="booking-container__input" />
    </div>

    <button
      @click="generateMeetingLink"
      class="booking-container__button"
      :disabled="isLoading || isWeekend || availableTimeOptions.length === 0"
    >
      {{ isLoading ? '⏳ Skapar länk...' : '📩 Skapa möteslänk' }}
    </button>

    <div v-if="meetingLink" class="booking-container__meeting-info">
      <p>✅ Din möteslänk:</p>
      <a :href="meetingLink" target="_blank">{{ meetingLink }}</a>
    </div>

    <div v-if="bookingStatus" class="booking-container__status">
      <p>{{ bookingStatus }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import api from '../services/api';

const router = useRouter();

const selectedDate = ref('');
const selectedTime = ref('');
const name = ref('');
const phone = ref('');
const email = ref('');
const meetingLink = ref('');
const bookingStatus = ref('');
const isLoading = ref(false);
const availableTimeOptions = ref([]);
const today = new Date().toISOString().split('T')[0];

const apiKey = import.meta.env.VITE_BREVO_API_KEY;

const playSound = (type) => {
  const sounds = {
    success: '/sounds/success.mp3',
    error: '/sounds/error.mp3',
    info: '/sounds/info.mp3',
    logout: '/sounds/logout.mp3'
  };
  const sound = new Audio(sounds[type] || sounds.info);
  sound.volume = 0.7;
  sound.play().catch(() => console.warn('🔇 Ljud kunde inte spelas'));
};

onMounted(() => {
  const patient = JSON.parse(localStorage.getItem('loggedInUser'));
  if (patient) {
    name.value = patient.name || '';
    phone.value = patient.phone || '';
    email.value = patient.email || '';
  } else {
    router.push('/login');
  }
});

watch(selectedDate, async () => {
  if (!selectedDate.value) return;

  bookingStatus.value = '';
  meetingLink.value = '';
  selectedTime.value = '';

  const selected = new Date(selectedDate.value);
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const isPastDate = selected < todayDate;
  const isToday = selected.toDateString() === todayDate.toDateString();
  const isWeekendDay = selected.getDay() === 0 || selected.getDay() === 6;

  if (isWeekendDay) {
    bookingStatus.value = '❌ Det går inte att boka tider på helger.';
    playSound('error');
    availableTimeOptions.value = [];
    return;
  }

  if (isPastDate) {
    bookingStatus.value = '❌ Du kan inte boka ett datum som har passerat.';
    playSound('error');
    availableTimeOptions.value = [];
    return;
  }

  try {
    const res = await api.getAvailableTimes(selectedDate.value);
    let times = res.data.available;

    if (isToday) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      times = times.filter(time => {
        const [hour, minute] = time.split(':').map(Number);
        return hour > currentHour || (hour === currentHour && minute > currentMinute);
      });
    }

    availableTimeOptions.value = times;
  } catch (error) {
    console.error('❌ Kunde inte hämta lediga tider:', error);
    playSound('error');
  }
});

const logout = () => {
  localStorage.removeItem('loggedInUser');
  localStorage.removeItem('patientPhone');
  playSound('logout');
  router.push('/login');
};

const deleteAccount = async () => {
  const confirmDelete = confirm('Är du säker på att du vill radera ditt konto? Detta går inte att ångra.');
  if (!confirmDelete) return;

  try {
    const patient = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!patient?.id) {
      bookingStatus.value = '❌ Kunde inte identifiera patient.';
      playSound('error');
      return;
    }

    await api.deletePatient(patient.id);
    playSound('success');
    alert('Ditt konto har raderats.');
    logout();
  } catch (error) {
    console.error('❌ Kunde inte radera konto:', error);
    playSound('error');
    bookingStatus.value = '❌ Kunde inte radera konto.';
  }
};

const isWeekend = computed(() => {
  if (!selectedDate.value) return false;
  const day = new Date(selectedDate.value).getDay();
  return day === 0 || day === 6;
});

const isValidEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = phone =>
  /^07\d{8}$/.test(phone) || /^\+467\d{8}$/.test(phone);

const generateMeetingLink = async () => {
  if (!selectedDate.value || !selectedTime.value || !name.value || !phone.value || !email.value) {
    bookingStatus.value = '⚠️ Fyll i alla fält för att boka ett möte.';
    playSound('error');
    return;
  }

  if (!isValidEmail(email.value)) {
    bookingStatus.value = '❌ Ange en giltig e-postadress.';
    playSound('error');
    return;
  }

  if (!isValidPhone(phone.value)) {
    bookingStatus.value = '❌ Ange ett giltigt mobilnummer (07xxxxxxxx).';
    playSound('error');
    return;
  }

  isLoading.value = true;

  try {
    const patient = JSON.parse(localStorage.getItem('loggedInUser'));

    if (!patient || !patient.id) {
      bookingStatus.value = '❌ Du måste vara inloggad för att boka.';
      playSound('error');
      return;
    }

    const check = await api.getAvailableTimes(selectedDate.value);
    if (!check.data.available.includes(selectedTime.value)) {
      bookingStatus.value = '❌ Den valda tiden är redan bokad. Välj en annan.';
      playSound('error');
      isLoading.value = false;
      return;
    }

    meetingLink.value = `https://meet.jit.si/${encodeURIComponent(selectedDate.value)}-${encodeURIComponent(selectedTime.value.replace(':', ''))}`;

    await api.createBooking({
      date: selectedDate.value,
      time: selectedTime.value,
      meetingLink: meetingLink.value,
      patient_id: patient.id
    });

    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { name: 'Support', email: 'support@vardappen.se' },
      to: [{ email: email.value.trim(), name: name.value.trim() }],
      subject: 'Ditt möte är bokat!',
      htmlContent: `
        <p>Hej ${name.value},<br>
        Du har bokat ett möte den <strong>${selectedDate.value}</strong> klockan <strong>${selectedTime.value}</strong>.<br>
        Möteslänk: <a href="${meetingLink.value}">${meetingLink.value}</a></p>`
    }, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      }
    });

    bookingStatus.value = '✅ Möteslänk skickad till din e-post!';
    playSound('success');
  } catch (error) {
    console.error('❌ Fel vid bokning:', error);
    bookingStatus.value = '❌ Ett fel inträffade vid bokningen.';
    playSound('error');
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.booking-container {
  max-width: 500px;
  width: 90%;
  padding: 25px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
  animation: fadeIn 0.5s ease-in-out;
  margin: 150px auto 0;
}

.logout-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
}

.logout-button {
  background-color: #e74c3c;
  color: white;
  padding: 12px 12px;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  margin: 6px;
  display: inline-block;
  white-space: nowrap; 
}

.icon-text {
  display: inline-flex; 
  align-items: center;
  gap: 6px;                
}

.booking-container__title {
  color: #3498db;
  font-size: 24px;
}

.booking-container__welcome {
  font-size: 16px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 20px;
}

.booking-container__input-group {
  margin-bottom: 15px;
  text-align: left;
}

.booking-container__input-group label {
  font-weight: bold;
  color: #555;
}

.booking-container__input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
}

.booking-container__button {
  width: 100%;
  background: #27ae60;
  color: white;
  padding: 14px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  font-weight: bold;
}

.booking-container__button:hover {
  background: #2ecc71;
}

.booking-container__button:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.booking-container__meeting-info {
  margin-top: 20px;
  font-size: 16px;
}

.booking-container__status {
  margin-top: 10px;
  font-size: 16px;
  color: green;
}

.booking-container__warning {
  color: red;
  font-weight: bold;
}

@media (max-width: 600px) {
  .booking-container {
    margin: 80px 16px;
    padding: 20px;
  }

  .booking-container__title {
    font-size: 20px;
  }

  .booking-container__input {
    font-size: 15px;
  }

  .booking-container__button {
    font-size: 15px;
    padding: 12px;
  }

  .booking-container__status,
  .booking-container__meeting-info {
    font-size: 14px;
  }
}

@media (min-width: 601px) and (max-width: 1024px) {
  .booking-container {
    max-width: 600px;
    padding: 28px;
  }

  .booking-container__title {
    font-size: 26px;
  }

  .booking-container__button {
    font-size: 17px;
  }
}

@media (min-width: 1025px) {
  .booking-container {
    max-width: 700px;
  }

  .booking-container__title {
    font-size: 28px;
  }
}
</style>
