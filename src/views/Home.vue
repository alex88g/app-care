<template>
  <main class="home-container">
    <header class="header">
      <h1>🏥 Vårdappen – Träffa din läkare online</h1>
      <p v-if="userName">👋 Välkommen, {{ userName }}!</p>
      <p v-else>📞 Boka videosamtal med en läkare enkelt och smidigt.</p>

      <nav class="nav-buttons">
        <router-link
          v-if="isLoggedIn"
          to="/bookings"
          class="button"
        >📅 Boka Tid</router-link>

        <router-link
          v-else
          to="/login"
          class="button"
        >🔒 Logga in för att boka</router-link>

        <router-link
          v-if="isDoctor"
          to="/doctor"
          class="button secondary"
        >👨‍⚕️ Läkarens Profil</router-link>

        <router-link
          v-else
          to="/doctor-login"
          class="button secondary"
        >🩺 Läkarinloggning</router-link>

        <button
          v-if="isLoggedIn || isDoctor"
          @click="logout"
          class="button logout-button"
        >🚪 Logga ut</button>
      </nav>
    </header>

    <section class="features">
      <div class="feature">
        <img :src="bookingImage" alt="Illustration: Boka tid" />
        <h2>🗓️ Snabb och säker bokning</h2>
        <p>Boka ett möte med några få klick.</p>
      </div>

      <div class="feature">
        <img :src="videoCallImage" alt="Illustration: Videosamtal med läkare" />
        <h2>📹 Träffa läkare online</h2>
        <p>Genomför ditt möte var du än är.</p>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import bookingImage from '../assets/booking.svg';
import videoCallImage from '../assets/video-call.svg';

const router = useRouter();
const isLoggedIn = ref(false);
const isDoctor = ref(false);
const userName = ref('');

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

onMounted(() => {
  const doctor = JSON.parse(localStorage.getItem('loggedInDoctor'));
  const patient = JSON.parse(localStorage.getItem('loggedInUser'));

  if (doctor) {
    isDoctor.value = true;
    userName.value = doctor.name;
  } else if (patient) {
    isLoggedIn.value = true;
    userName.value = patient.name;
  }
});

const logout = () => {
  localStorage.removeItem('loggedInUser');
  localStorage.removeItem('loggedInDoctor');
  localStorage.removeItem('patientPhone');
  localStorage.removeItem('doctorToken');
  isLoggedIn.value = false;
  isDoctor.value = false;
  userName.value = '';
  playSound('logout');
  router.push('/');
};
</script>

<style scoped>
.home-container {
  text-align: center;
  margin-top: 150px;
  padding: 0 20px;
}

.header {
  background: rgba(255, 255, 255, 0.9);
  padding: 40px 20px;
  border-radius: 10px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
}

.nav-buttons {
  margin-top: 20px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}

.button {
  padding: 14px 24px;
  background-color: #2ecc71;
  color: white;
  border-radius: 6px;
  text-decoration: none;
  font-size: 16px;
  transition: background 0.3s ease;
  border: none;
  cursor: pointer;
}

.button:hover {
  background-color: #27ae60;
}

.button.secondary {
  background-color: #e67e22;
}

.button.secondary:hover {
  background-color: #d35400;
}

.logout-button {
  background-color: #c0392b;
}

.logout-button:hover {
  background-color: #e74c3c;
}

.features {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 40px;
  gap: 24px;
}

.feature {
  width: 100%;
  max-width: 400px;
  padding: 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease-in-out;
}

.feature:hover {
  transform: scale(1.05);
}

.feature img {
  width: 80px;
  margin-bottom: 12px;
}

@media (max-width: 600px) {
  .home-container {
    margin-top: 80px;
    padding: 0 10px;
  }

  .header {
    padding: 30px 16px;
  }

  .button {
    font-size: 14px;
    padding: 12px 18px;
  }

  .feature {
    max-width: 100%;
  }

  .feature img {
    width: 60px;
  }
}

@media (min-width: 601px) and (max-width: 1024px) {
  .home-container {
    padding: 0 30px;
  }

  .feature {
    flex: 1 1 45%;
  }

  .button {
    font-size: 15px;
  }
}

@media (min-width: 1025px) {
  .features {
    gap: 32px;
  }

  .feature {
    flex: 1 1 30%;
  }

  .button {
    font-size: 16px;
  }
}
</style>
