import axios from 'axios';

// Instance API untuk Customer Microservice
export const customerApi = axios.create({
  baseURL: '/api/customer',
  headers: {
    'Content-Type': 'application/json',
  },
});

customerApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('customer_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Instance API untuk Employee Microservice
export const employeeApi = axios.create({
  baseURL: '/api/employee',
  headers: {
    'Content-Type': 'application/json',
  },
});

employeeApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('employee_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default { customerApi, employeeApi };
