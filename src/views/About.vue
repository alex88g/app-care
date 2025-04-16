<template>
  <div class="about-us">
    <div class="content">
      <h1>Om Oss</h1>
      <p>
        Vi är en digital vårdplattform som erbjuder snabb och säker tillgång till
        läkare genom videosamtal.
      </p>
      <p>
        Vårt mål är att göra det lättare att träffa läkare utan att behöva gå till
        en fysisk klinik.
      </p>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.about-us {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 200px;
  color: white;
  text-align: center;
  padding: 20px;
}

.content {
  max-width: 600px;
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  padding: 30px;
  border-radius: 10px;
  backdrop-filter: blur(10px);
}

h1 {
  font-size: 32px;
  margin-bottom: 15px;
  color: #333;
}

p {
  font-size: 18px;
  line-height: 1.5;
}
</style>
