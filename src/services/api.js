import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

const formatPhone = (phone) => {
  return phone.startsWith('+46') ? phone : '+46' + phone.replace(/^0/, '');
};

const api = {
  sendOTP: (phone) =>
    axios.post(`${API_BASE}/otp/send`, { phone: formatPhone(phone) }),
  verifyOTP: (phone, code) =>
    axios.post(`${API_BASE}/otp/verify`, { phone: formatPhone(phone), code }),

  loginPatient: (phone) =>
    axios.post(`${API_BASE}/patients/login`, { phone: formatPhone(phone) }),
  registerPatient: (name, phone, ssn, email) =>
    axios.post(`${API_BASE}/patients/register`, {
      name,
      phone: formatPhone(phone),
      ssn,
      email
    }),
  deletePatient: (id) => axios.delete(`${API_BASE}/patients/${id}`),

  loginDoctor: (code) => axios.post(`${API_BASE}/doctors/login`, { code }),

  checkPhone: (phone) =>
    axios.post(`${API_BASE}/patients/check-phone`, { phone: formatPhone(phone) }),

  getBookings: () => axios.get(`${API_BASE}/bookings`),
  getAvailableTimes: (date) =>
    axios.get(`${API_BASE}/bookings/available-times`, { params: { date } }),
  createBooking: (booking) => axios.post(`${API_BASE}/bookings`, booking),
  updateBooking: (id, data) => axios.put(`${API_BASE}/bookings/${id}`, data),
  deleteBooking: (id) => axios.delete(`${API_BASE}/bookings/${id}`)
};

export default api;
