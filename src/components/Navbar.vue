<template>
  <nav class="navbar">
    <div class="navbar-container">
      <div class="nav-links" :class="{'hidden': !isScreenLarge && isMenuVisible}">
        <router-link to="/" class="nav-link">Home</router-link>
        <router-link to="/about" class="nav-link">Om Oss</router-link>
        <router-link to="/support" class="nav-link">Kund Support</router-link>
      </div>

      <div class="hamburger" @click="toggleMenu" v-if="!isScreenLarge">
        <span v-if="!isMenuVisible" class="bar"></span>
        <span v-if="!isMenuVisible" class="bar"></span>
        <span v-if="!isMenuVisible" class="bar"></span>

        <div v-if="isMenuVisible" class="close-menu">
          <span class="bar">X</span>
        </div>
      </div>
    </div>

    <div :class="{'mobile-menu': true, 'show': isMenuVisible}">
      <router-link to="/" class="nav-link" @click="closeMenu">Home</router-link>
      <router-link to="/about" class="nav-link" @click="closeMenu">Om Oss</router-link>
      <router-link to="/support" class="nav-link" @click="closeMenu">Kund Support</router-link>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const isMenuVisible = ref(false);
const isScreenLarge = ref(window.innerWidth > 768);

const toggleMenu = () => {
  isMenuVisible.value = !isMenuVisible.value;
};

const closeMenu = () => {
  isMenuVisible.value = false;
};

const updateScreenSize = () => {
  isScreenLarge.value = window.innerWidth > 768;
  if (isScreenLarge.value && isMenuVisible.value) {
    isMenuVisible.value = false;
  }
};

onMounted(() => {
  updateScreenSize();
  window.addEventListener('resize', updateScreenSize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScreenSize);
});
</script>

<style scoped>
.navbar {
  background-color: #2ecc71;
  padding: 15px 0;
  position: sticky;
  top: 0;
  width: 100%;
  z-index: 10;
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.nav-links {
  display: flex;
  justify-content: space-between;
}

.nav-link {
  text-decoration: none;
  color: white;
  font-size: 18px;
  padding: 10px;
}

.nav-link:hover {
  text-decoration: underline;
}

.hamburger {
  display: none;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  width: 25px;
  height: 25px;
  cursor: pointer;
}

.bar {
  width: 25px;
  height: 4px;
  background-color: white;
  border-radius: 5px;
  transition: 0.3s;
}

/* Close (X) Button */
.close-menu {
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.close-menu .bar {
  font-size: 30px;
  font-weight: bold;
  color: white;
  transform: rotate(45deg);
}

.mobile-menu {
  display: none;
  flex-direction: column;
  align-items: center;
  background-color: #2ecc71;
  position: absolute;
  top: 60px;
  width: 100%;
  padding: 10px 0;
}

.mobile-menu.show {
  display: flex;
}

.hidden {
  display: none;
}

@media (max-width: 768px) {
  .nav-links {
    display: none;
  }

  .hamburger {
    display: flex;
  }
}
</style>
