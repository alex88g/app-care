<template>
    <div class="toast" :class="toastType" v-show="visible">
      <span class="icon">{{ icon }}</span>
      <span class="message">{{ message }}</span>
      <span @click="close" class="close">✖</span>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, computed } from 'vue';
  
  const props = defineProps({
    message: String,
    type: {
      type: String,
      default: 'info',
    },
  });
  
  const emit = defineEmits(['close']);
  const visible = ref(true);
  
  const close = () => {
    visible.value = false;
    emit('close');
  };
  
  const toastType = computed(() => {
    return {
      success: 'toast-success',
      error: 'toast-error',
      info: 'toast-info',
    }[props.type] || 'toast-info';
  });
  
  const icon = computed(() => {
    return {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
    }[props.type] || 'ℹ️';
  });
  
  const playSound = () => {
    const soundMap = {
      success: '/sounds/success.mp3',
      error: '/sounds/error.mp3',
      info: '/sounds/info.mp3',
    };
    const soundPath = soundMap[props.type] || soundMap.info;
    const audio = new Audio(soundPath);
    audio.play().catch(() => {
      console.warn('🔇 Ljud kunde inte spelas – användaren kanske inte har interagerat än.');
    });
  };
  
  onMounted(() => {
    playSound();
    setTimeout(close, 3000);
  });
  </script>
  
  
  <style scoped>
.toast {
  position: fixed;
  bottom: 80px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #333;
  color: #fff;
  padding: 14px 20px;
  border-radius: 8px;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  animation: fadeIn 0.3s ease-in-out;
  z-index: 9999;
  max-width: 90vw;
  width: auto;
  word-break: break-word;
}

.toast-success {
  background-color: #2ecc71;
}

.toast-error {
  background-color: #e74c3c;
}

.toast-info {
  background-color: #3498db;
}

.icon {
  font-size: 20px;
}

.message {
  flex: 1;
  font-size: 15px;
}

.close {
  margin-left: 12px;
  cursor: pointer;
  font-weight: bold;
  color: #fff;
  font-size: 18px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 600px) {
  .toast {
    bottom: 20px;
    left: 10px;
    right: 10px;
    font-size: 14px;
    padding: 12px 16px;
    border-radius: 6px;
    flex-direction: column;
    align-items: flex-start;
  }

  .message {
    font-size: 14px;
    width: 100%;
  }

  .close {
    align-self: flex-end;
  }
}

@media (min-width: 601px) and (max-width: 1024px) {
  .toast {
    font-size: 15px;
    padding: 14px 18px;
  }

  .close {
    font-size: 16px;
  }
}
</style>
