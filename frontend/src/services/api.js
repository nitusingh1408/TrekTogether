import axios from 'axios'
const api=axios.create({baseURL:import.meta.env.VITE_API_BASE_URL||'http://localhost:8084/api',withCredentials:true,headers:{'Content-Type':'application/json'}})
api.interceptors.response.use(r=>r.data,e=>Promise.reject(new Error(e.response?.data?.error||e.message||'Something went wrong.')))
export default api
