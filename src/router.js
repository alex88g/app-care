import { createRouter, createWebHistory } from "vue-router";

import Home from "./views/Home.vue";
import About from "./views/About.vue";
import Support from "./views/Support.vue";
import Video from "./views/Video.vue";
import DoctorView from "./views/DoctorView.vue";
import BookingView from "./views/BookingView.vue";
import DoctorLogin from "./views/DoctorLogin.vue";
import PatientLogin from "./views/PatientLogin.vue";
import NotFoundView from "./views/NotFoundView.vue";

const routes = [
  { path: "/", component: Home },
  { path: "/about", component: About },
  { path: "/support", component: Support },
  { path: "/video-call/:roomName", component: Video },

  { path: "/doctor-login", component: DoctorLogin },
  { path: "/doctor", component: DoctorView, meta: { requiresDoctor: true } },

  { path: "/login", component: PatientLogin },
  { path: "/bookings", component: BookingView, meta: { requiresPatient: true } },

  { path: "/:pathMatch(.*)*", name: "NotFound", component: NotFoundView }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }; 
  }
});

const playSound = (type) => {
  const sounds = {
    success: "/sounds/success.mp3",
    error: "/sounds/error.mp3",
    info: "/sounds/info.mp3",
    logout: "/sounds/logout.mp3"
  };
  const audio = new Audio(sounds[type] || sounds.info);
  audio.volume = 0.7;
  audio.play().catch(() => console.warn("🔇 Kunde inte spela ljud"));
};

router.beforeEach((to, from, next) => {
  const doctor = localStorage.getItem("doctorToken");
  const patient = localStorage.getItem("patientPhone");

  if (to.meta.requiresDoctor && !doctor) {
    playSound("error");
    alert("⚠️ Du måste logga in som läkare för att komma åt denna sida.");
    return next("/doctor-login");
  }

  if (to.meta.requiresPatient && (!patient || patient === "null" || patient === "undefined")) {
    playSound("error");
    alert("⚠️ Du måste logga in som patient för att boka.");
    return next("/login");
  }

  if (to.path === "/login" && patient) {
    return next("/bookings");
  }

  if (to.path === "/doctor-login" && doctor) {
    return next("/doctor");
  }

  next();
});

export default router;
