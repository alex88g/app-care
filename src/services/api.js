import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const API_BASE = `${BASE_URL}/api`;

const formatPhone = (phone) => {
  return phone.startsWith('+46') ? phone : '+46' + phone.replace(/^0/, '');
};

const api = {
  sendOTP: (phone) =>
    axios.post(`${API_BASE}/auth/otp/send`, { phone: formatPhone(phone) }),

  verifyOTP: (phone, code) =>
    axios.post(`${API_BASE}/auth/otp/verify`, { phone: formatPhone(phone), code }),

  loginPatient: (phone) =>
    axios.post(`${API_BASE}/auth/patients/login`, { phone: formatPhone(phone) }),

  registerPatient: (name, phone, ssn, email) =>
    axios.post(`${API_BASE}/auth/patients/register`, {
      name,
      phone: formatPhone(phone),
      ssn,
      email,
    }),

  checkPhone: (phone) =>
    axios.post(`${API_BASE}/auth/patients/check-phone`, { phone: formatPhone(phone) }),

  loginDoctor: (code) =>
    axios.post(`${API_BASE}/auth/doctors/login`, { code }),

  deletePatient: (id) =>
    axios.delete(`${API_BASE}/patients/${id}`),

  getBookings: () =>
    axios.get(`${API_BASE}/bookings`),

  getAvailableTimes: (date) =>
    axios.get(`${API_BASE}/bookings/available-times`, { params: { date } }),

  createBooking: (booking) =>
    axios.post(`${API_BASE}/bookings`, booking),

  updateBooking: (id, data) =>
    axios.put(`${API_BASE}/bookings/${id}`, data),

  deleteBooking: (id) =>
    axios.delete(`${API_BASE}/bookings/${id}`),
};

export default api;
