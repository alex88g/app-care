export function useToastSound() {
    const playSound = (type = 'info') => {
      const sounds = {
        success: '/sounds/success.mp3',
        error: '/sounds/error.mp3',
        info: '/sounds/info.mp3'
      };
  
      const audio = new Audio(sounds[type] || sounds.info);
      audio.volume = 0.7;
      audio.play().catch(() => {
        console.warn('🔇 Kunde inte spela upp ljud.');
      });
    };
  
    return { playSound };
  }
  