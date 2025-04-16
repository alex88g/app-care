<template>
    <div class="not-found">
      <h1>404 - Sidan hittades inte</h1>
      <p>Tyvärr! Sidan du försökte nå existerar inte.</p>
      <router-link to="/" class="home-link">🏠 Gå till startsidan</router-link>
    </div>
  </template>
  
  <script setup>
  </script>
  
  <style scoped>
  .not-found {
    text-align: center;
    padding: 100px 20px;
  }
  
  h1 {
    font-size: 2em;
    color: #e74c3c;
  }
  
  p {
    font-size: 18px;
    margin: 20px 0;
  }
  
  .home-link {
    display: inline-block;
    margin-top: 20px;
    padding: 12px 24px;
    background-color: #3498db;
    color: white;
    text-decoration: none;
    border-radius: 6px;
    font-weight: bold;
  }
  </style>
  