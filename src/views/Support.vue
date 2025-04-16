<script setup>
import { ref, onMounted, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';

const chatMessages = ref([]);
const newMessage = ref("");
const chatBox = ref(null);
const STORAGE_KEY = "chat_messages";
const router = useRouter();

const allowedKeywords = [
  "boka", "bokning", "läkartid", "tid", "avboka", "mina bokningar",
  "hur bokar jag", "ändra en bokning", "navigera till bokning",
  "hur hittar jag mina bokningar", "avbokning", "läkare", "vård", "patient",
  "support", "hjälp med bokning", "möteslänk", "skapa möte", "akut vård"
];

onMounted(() => {
  const savedMessages = localStorage.getItem(STORAGE_KEY);
  if (savedMessages) {
    chatMessages.value = JSON.parse(savedMessages);
  }
});

watch(chatMessages, (newMessages) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newMessages));
}, { deep: true });

const sendMessage = async () => {
  if (newMessage.value.trim() === "") return;

  chatMessages.value.push({ sender: 'user', text: newMessage.value });
  await nextTick();
  chatBox.value.scrollTop = chatBox.value.scrollHeight;

  handleNavigation(newMessage.value);

  if (!isRelevantQuestion(newMessage.value)) {
    chatMessages.value.push({
      sender: 'chatgpt',
      text: "Tyvärr, vi svarar endast på frågor som rör vårdappen, bokningar och navigering till bokningar."
    });
    newMessage.value = "";
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: newMessage.value,
        context: "booking_assistance"
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();
    chatMessages.value.push({ sender: 'chatgpt', text: data.response });
  } catch (error) {
    chatMessages.value.push({ sender: 'chatgpt', text: "Ett fel uppstod. Försök igen senare." });
  }

  await nextTick();
  chatBox.value.scrollTop = chatBox.value.scrollHeight;

  newMessage.value = "";
};

const clearChat = () => {
  chatMessages.value = [];
  localStorage.removeItem(STORAGE_KEY);
};

const handleNavigation = (message) => {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("boka tid") || lowerMessage.includes("hur bokar jag en tid")) {
    router.push('/bookings');
    chatMessages.value.push({ sender: 'chatgpt', text: "✅ Jag har skickat dig till bokningssidan. Välj datum, tid och fyll i din information." });
  } else if (lowerMessage.includes("mina bokningar") || lowerMessage.includes("mina tider")) {
    router.push('/my-bookings');
    chatMessages.value.push({ sender: 'chatgpt', text: "📋 Jag har skickat dig till sidan för dina bokningar." });
  } else if (lowerMessage.includes("avboka tid") || lowerMessage.includes("avbokning")) {
    router.push('/cancel-booking');
    chatMessages.value.push({ sender: 'chatgpt', text: "⚠️ Du kan avboka din tid här. Välj bokningen och klicka på ‘Avboka’." });
  }
};

const isRelevantQuestion = (message) => {
  return allowedKeywords.some(keyword => message.toLowerCase().includes(keyword));
};
</script>

<template>
  <div class="support">
    <div class="chat-container">
      <h1>Kund Support</h1>
      <p>Hur kan vi hjälpa dig med din bokning?</p>

      <div class="chat-box" ref="chatBox">
        <div v-for="(message, index) in chatMessages" :key="index" class="message" :class="message.sender">
          <p>{{ message.text }}</p>
        </div>
      </div>

      <div class="chat-input-container">
        <input 
          v-model="newMessage" 
          @keyup.enter="sendMessage" 
          placeholder="Fråga om bokning..." 
          class="chat-input" 
        />
        <button @click="sendMessage" class="chat-send-button">&#9658;</button>
      </div>

      <button @click="clearChat" class="clear-chat-button">🗑️ Rensa chatten</button>
    </div>
  </div>
</template>

<style scoped>
.support {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 50px;
}

.chat-container {
  width: 100%;
  width: 500px;
  background: white;
  border-radius: 10px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  padding: 20px;
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
}

h1 {
  color: #333;
  font-size: 22px;
  margin-bottom: 5px;
}

p {
  color: #000000;
  font-size: 14px;
  margin-bottom: 15px;
}

.chat-box {
  height: 500px;
  overflow-y: auto;
  padding: 15px;
  border-radius: 8px;
  background: #f9f9f9;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.message {
  max-width: 75%;
  padding: 10px;
  border-radius: 10px;
  word-wrap: break-word;
}

.user {
  align-self: flex-end;
  background: #2ecc71;
  color: white;
}

.chatgpt {
  align-self: flex-start;
  background: #ddd;
  color: #333;
}

.chat-input-container {
  display: flex;
  align-items: center;
  margin-top: 10px;
}

.chat-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  outline: none;
}

.chat-send-button {
  background: #000000;
  border: none;
  padding: 10px 15px;
  margin-left: 10px;
  border-radius: 5px;
  color: white;
  cursor: pointer;
  font-size: 16px;
}

.chat-send-button:hover {
  background: #333;
}

.clear-chat-button {
  background-color: #B4656F;
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  margin-top: 10px;
  display: block;
  width: 100%;
  text-align: center;
}

.clear-chat-button:hover {
  background-color: #944d5b;
  transform: scale(1.05);
}

.clear-chat-button:active {
  background-color: #7a3f4a;
  transform: scale(0.98);
}

</style>