<template>
  <div class="doctor-card">
    <template v-if="!booking.isEditing">
      <p><strong>👤 Namn:</strong> {{ booking.name || 'Saknas' }}</p>
      <p><strong>📞 Mobil:</strong> {{ booking.phone || 'Saknas' }}</p>
      <p><strong>✉️ E-post:</strong> {{ booking.email || 'Saknas' }}</p>
      <p><strong>🗖 Datum:</strong> {{ formattedDate }} kl. {{ booking.time || 'okänt' }}</p>
      <p><strong>🔗 Länk:</strong>
        <a v-if="booking.meetingLink" :href="booking.meetingLink" target="_blank">{{ booking.meetingLink }}</a>
        <span v-else>Saknas</span>
      </p>
      <div class="button-group">
        <button @click="$emit('edit')" class="button edit-button">✏️ Redigera</button>
        <button @click="$emit('delete')" class="button delete-button">🗑 Radera</button>
      </div>
    </template>

    <template v-else>
      <input
        type="date"
        v-model="booking.date"
        class="edit-input"
        :min="today"
        @input="preventWeekend"
      />
      <select v-model="booking.time" class="edit-input">
        <option
          v-for="hour in filteredAvailableHours"
          :key="hour"
          :value="hour"
        >
          {{ hour }}
        </option>
      </select>
      <div class="button-group">
        <button @click="$emit('save')" class="button save-button">📏 Spara</button>
        <button @click="$emit('cancel')" class="button cancel-button">❌ Avbryt</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, watch, ref } from 'vue';
import axios from 'axios';

const props = defineProps(['booking']);
defineEmits(['edit', 'save', 'cancel', 'delete']);

const availableHours = ref([]);
const today = new Date().toISOString().split('T')[0];

const API_BASE = '/api';

const formattedDate = computed(() => {
  if (!props.booking.date) return 'Okänd';
  const d = new Date(props.booking.date);
  return d.toLocaleDateString('sv-SE');
});

const preventWeekend = (event) => {
  const selectedDay = new Date(event.target.value).getDay();
  if (selectedDay === 0 || selectedDay === 6) {
    const audio = new Audio('/sounds/error.mp3');
    audio.volume = 0.7;
    audio.play().catch(() => {});
    event.target.value = '';
    props.booking.date = '';
    window.dispatchEvent(new CustomEvent('global-toast', {
      detail: { message: '❌ Du kan inte boka på helger.', type: 'error' }
    }));
  }
};

const filteredAvailableHours = computed(() => {
  const selectedDate = props.booking.date;
  if (!selectedDate) return [];
  const todayDate = new Date();
  const selected = new Date(selectedDate);
  const isToday = selected.toDateString() === todayDate.toDateString();
  if (!isToday) return availableHours.value;

  const now = new Date();
  return availableHours.value.filter(time => {
    const [hour, minute] = time.split(':').map(Number);
    return hour > now.getHours() || (hour === now.getHours() && minute > now.getMinutes());
  });
});

watch(() => props.booking.date, async (newDate) => {
  if (!newDate) return;
  const selected = new Date(newDate);
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const isPastDate = selected < todayDate;
  const isWeekend = selected.getDay() === 0 || selected.getDay() === 6;

  if (isPastDate) {
    window.dispatchEvent(new CustomEvent('global-toast', {
      detail: { message: '❌ Du kan inte boka ett datum som har passerat.', type: 'error' }
    }));
    availableHours.value = [];
    return;
  }

  if (isWeekend) {
    availableHours.value = [];
    return;
  }

  try {
    const res = await axios.get(`${API_BASE}/bookings/available-times?date=${newDate}`);
    availableHours.value = res.data.available;
  } catch (err) {
    window.dispatchEvent(new CustomEvent('global-toast', {
      detail: { message: '❌ Kunde inte hämta lediga tider.', type: 'error' }
    }));
  }
});
</script>


<style scoped>
.doctor-card {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.doctor-card:hover {
  transform: scale(1.01);
}

.doctor-card a {
  color: #3498db;
  font-weight: bold;
  word-break: break-all;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
}

.button {
  padding: 10px 16px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  border: none;
  transition: background 0.2s ease;
}

.edit-button {
  background-color: #f39c12;
  color: white;
}

.delete-button {
  background-color: #e74c3c;
  color: white;
}

.save-button {
  background-color: #2ecc71;
  color: white;
}

.cancel-button {
  background-color: #95a5a6;
  color: white;
}

.edit-input {
  width: 100%;
  padding: 10px;
  margin-top: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

@media (max-width: 600px) {
  .doctor-card {
    padding: 16px;
  }

  .edit-input {
    font-size: 13px;
    padding: 8px;
  }

  .button {
    flex: 1 1 100%;
    padding: 10px;
    font-size: 13px;
  }

  .button-group {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (min-width: 601px) and (max-width: 1024px) {
  .doctor-card {
    padding: 18px;
  }

  .edit-input {
    font-size: 14px;
  }

  .button {
    font-size: 14px;
  }
}

@media (min-width: 1025px) {
  .doctor-card {
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
  }
}
</style>
