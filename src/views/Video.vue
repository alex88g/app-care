<template>
  <div class="video-container">
    <h1 class="video-title">📹 Videosamtal</h1>
    <p class="video-info">Ansluter till videosamtal...</p>
    <div id="jitsi-container"></div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const jitsiLoaded = ref(false);

const loadJitsiScript = async () => {
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) {
      console.log('✅ Jitsi API redan laddat.');
      jitsiLoaded.value = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;

    script.onload = () => {
      console.log('✅ Jitsi API laddat!');
      jitsiLoaded.value = true;
      resolve();
    };

    script.onerror = (error) => {
      console.error('❌ Fel vid laddning av Jitsi API:', error);
      reject(error);
    };

    document.head.appendChild(script);
  });
};

const initializeJitsi = () => {
  if (!window.JitsiMeetExternalAPI) {
    console.error('❌ JitsiMeetExternalAPI saknas. Försöker igen...');
    setTimeout(initializeJitsi, 1000);
    return;
  }

  const container = document.getElementById('jitsi-container');
  if (!container) {
    console.error('❌ Kunde inte hitta #jitsi-container i DOM.');
    return;
  }

  container.innerHTML = '';

  const domain = 'meet.jit.si';
  const roomName = route.params.roomName ? decodeURIComponent(route.params.roomName) : 'VardApp-VideoCall';

  console.log(`🎥 Startar videosamtal i rum: ${roomName}`);

  const options = {
    roomName,
    parentNode: container,
    width: '100%',
    height: '81vh',
    configOverwrite: {
      startWithAudioMuted: true,
      startWithVideoMuted: false,
    },
    interfaceConfigOverwrite: {
      SHOW_JITSI_WATERMARK: false,
      TOOLBAR_BUTTONS: ['microphone', 'camera', 'chat', 'hangup'],
    },
  };

  new window.JitsiMeetExternalAPI(domain, options);
};

onMounted(async () => {
  try {
    console.log('🔄 Försöker ladda Jitsi API...');
    await loadJitsiScript();
    initializeJitsi();
  } catch (error) {
    console.error('❌ Ett fel uppstod vid laddning av Jitsi:', error);
  }
});
</script>

<style scoped>
.video-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100vh;
  padding: 40px;
  background: #2c3e50;
}

.video-title {
  font-size: 28px;
  font-weight: bold;
  color: white;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.video-info {
  font-size: 16px;
  color: white;
  margin-bottom: 20px;
}

#jitsi-container {
  width: 100%;
  max-width: 1200px;
  height: 80vh;
  background: white;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

@media (max-width: 768px) {
  #jitsi-container {
    height: 70vh;
  }
}

</style>
