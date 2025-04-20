<template>
  <div class="booking-container">
    <div class="header-row">
      <div>
        <h1 class="booking-title">Läkarvy – Bokningshantering</h1>
        <p class="doctor-name" v-if="doctorName">Välkommen, {{ doctorName }}</p>
      </div>
      <button @click="logout" class="logout-button">🚪 Logga ut</button>
    </div>

    <input
      type="text"
      v-model="search"
      class="search-input"
      placeholder="Sök namn eller e-post..."
    />

    <select v-model="sortOrder" class="sort-select">
      <option value="asc">↑ Kommande först</option>
      <option value="desc">↓ Senaste först</option>
    </select>

    <button @click="exportCSV" class="button export-button">Exportera CSV</button>
    <button @click="exportPDF" class="button export-button">Exportera PDF</button>

    <p v-if="isLoading" class="loading-text">Laddar bokningar...</p>
    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

    <div v-if="sortedBookings.length">
      <DoctorCard
        v-for="(booking, index) in sortedBookings"
        :key="booking.id"
        :booking="booking"
        :availableHours="booking.availableTimeOptions"
        @edit="() => editBooking(index)"
        @save="() => saveBooking(index)"
        @cancel="cancelEdit"
        @delete="() => deleteBooking(index)"
      />
    </div>

    <p v-else-if="!isLoading && !errorMessage" class="no-bookings-text">
      Inga bokningar tillgängliga.
    </p>

    <Toast v-if="toastMessage" :message="toastMessage" @close="toastMessage = ''" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import DoctorCard from '../components/DoctorCard.vue';
import Toast from '../components/Toast.vue';
import api from '../services/api';
import axios from 'axios';
import jsPDF from 'jspdf';

const router = useRouter();
const bookings = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');
const toastMessage = ref('');
const search = ref('');
const doctorName = ref('');
const sortOrder = ref('asc');

const API_BASE = '/api';

const playSound = (type) => {
  const sounds = {
    success: "/sounds/success.mp3",
    error: "/sounds/error.mp3",
    info: "/sounds/info.mp3",
    logout: "/sounds/logout.mp3"
  };
  const audio = new Audio(sounds[type] || sounds.success);
  audio.volume = 0.7;
  audio.play().catch(() => {});
};

const fetchBookings = async () => {
  isLoading.value = true;
  try {
    const response = await api.getBookings();
    console.log("📥 Hämtade bokningar:", response.data.data);
    bookings.value = response.data.data.map(b => ({
      ...b,
      isEditing: false,
      availableTimeOptions: []
    }));
  } catch (err) {
    console.error('❌ Fel vid hämtning av bokningar:', err);
    errorMessage.value = 'Fel vid hämtning av bokningar';
  } finally {
    isLoading.value = false;
  }
};

const updateAvailableTimes = async (booking) => {
  const selected = new Date(booking.date);
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const isPastDate = selected < todayDate;
  const isToday = selected.toDateString() === todayDate.toDateString();
  const isWeekendDay = selected.getDay() === 0 || selected.getDay() === 6;

  if (isWeekendDay) {
    toastMessage.value = '❌ Det går inte att boka tider på helger.';
    booking.availableTimeOptions = [];
    return;
  }

  if (isPastDate) {
    toastMessage.value = '❌ Du kan inte boka ett datum som har passerat.';
    booking.availableTimeOptions = [];
    return;
  }

  try {
    const res = await axios.get(`${API_BASE}/bookings/available-times?date=${booking.date}`);
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

    booking.availableTimeOptions = times;
  } catch (error) {
    toastMessage.value = '❌ Kunde inte hämta lediga tider.';
  }
};

const editBooking = index => {
  const booking = bookings.value[index];
  const now = new Date();
  const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
  if (bookingDateTime <= now) {
    toastMessage.value = '⛔ Du kan inte redigera passerade tider.';
    new Audio('/sounds/error.mp3').play().catch(() => {});
    return;
  }
  booking.isEditing = true;
  updateAvailableTimes(booking);
};

const saveBooking = async index => {
  const booking = bookings.value[index];
  try {
    await api.updateBooking(booking.id, {
      date: booking.date,
      time: booking.time,
      meetingLink: booking.meetingLink
    });
    booking.isEditing = false;
    toastMessage.value = 'Bokning uppdaterad!';
    setTimeout(() => toastMessage.value = '', 3000);
  } catch {
    toastMessage.value = 'Kunde inte uppdatera bokningen.';
  }
};

const cancelEdit = () => {
  fetchBookings();
  toastMessage.value = 'Redigering avbruten.';
};

const deleteBooking = async index => {
  const id = bookings.value[index].id;
  if (confirm('Vill du radera denna bokning?')) {
    try {
      await api.deleteBooking(id);
      bookings.value.splice(index, 1);
      toastMessage.value = 'Bokning raderad!';
      setTimeout(() => toastMessage.value = '', 3000);
    } catch {
      toastMessage.value = 'Kunde inte radera bokningen.';
    }
  }
};

const filteredBookings = computed(() =>
  bookings.value.filter(b =>
    b.name?.toLowerCase().includes(search.value.toLowerCase()) ||
    b.email?.toLowerCase().includes(search.value.toLowerCase())
  )
);

const sortedBookings = computed(() => {
  return [...filteredBookings.value].sort((a, b) => {
    const dA = new Date(`${a.date}T${a.time}`);
    const dB = new Date(`${b.date}T${b.time}`);
    return sortOrder.value === 'asc' ? dA - dB : dB - dA;
  });
});

const exportCSV = () => {
  const csv = [
    ['Namn', 'Telefon', 'E-post', 'Datum', 'Tid', 'Länk'],
    ...bookings.value.map(b => [b.name, b.phone, b.email, b.date, b.time, b.meetingLink])
  ].map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'bokningar.csv';
  link.click();
};

const exportPDF = () => {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text('Bokningar', 10, 10);
  let y = 20;
  bookings.value.forEach(b => {
    const lines = [
      `Namn: ${b.name || 'Saknas'}`,
      `Telefon: ${b.phone || 'Saknas'}`,
      `E-post: ${b.email || 'Saknas'}`,
      `Datum: ${b.date || ''} kl. ${b.time || ''}`,
      `Länk: ${b.meetingLink || 'Ingen länk'}`,
      '-----------------------------'
    ];
    lines.forEach(line => { doc.text(line, 10, y); y += 8; });
    if (y > 270) { doc.addPage(); y = 20; }
  });
  doc.save('bokningar.pdf');
};

const logout = () => {
  localStorage.clear();
  playSound('logout');
  router.push('/doctor-login');
};

onMounted(() => {
  fetchBookings();
  const doctor = JSON.parse(localStorage.getItem('loggedInDoctor'));
  if (doctor?.name) doctorName.value = doctor.name;

  window.addEventListener('global-toast', e => {
    if (e.detail?.message) toastMessage.value = e.detail.message;
  });
});
</script>


<style scoped>
.booking-container {
  max-width: 860px;
  margin: 100px auto;
  background-color: #ffffff;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 30px;
}

.booking-title {
  font-size: 28px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 4px;
}

.doctor-name {
  font-size: 15px;
  color: #666;
  margin-top: 4px;
}

.logout-button {
  background-color: #e74c3c;
  color: white;
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.logout-button:hover {
  background-color: #c0392b;
}

.search-input,
.sort-select {
  width: 100%;
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 16px;
  border: 1px solid #ccc;
  border-radius: 10px;
}

.export-button {
  background-color: #8e44ad;
  color: white;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 20px;
  margin-left: 10px;
  transition: background 0.2s ease;
}

.export-button:hover {
  background-color: #732d91;
}

.loading-text {
  color: #2980b9;
  font-weight: 600;
  font-size: 16px;
}

.error-text {
  color: #e74c3c;
  font-weight: 600;
  font-size: 16px;
}

.no-bookings-text {
  color: #999;
  font-size: 16px;
  font-style: italic;
  text-align: center;
  margin-top: 30px;
}

@media (max-width: 600px) {
  .booking-container {
    padding: 20px;
    margin: 60px 16px;
  }

  .booking-title {
    font-size: 22px;
    text-align: center;
  }

  .logout-button,
  .export-button {
    width: 100%;
    padding: 12px;
  }

  .search-input,
  .sort-select {
    font-size: 14px;
  }
}

@media (min-width: 601px) and (max-width: 1024px) {
  .booking-container {
    padding: 28px;
  }

  .booking-title {
    font-size: 24px;
  }

  .logout-button,
  .export-button {
    font-size: 15px;
  }
}

@media (min-width: 1025px) {
  .search-input,
  .sort-select {
    max-width: 400px;
  }

  .export-button {
    float: right;
    margin-top: -50px;
  }
}
</style>
