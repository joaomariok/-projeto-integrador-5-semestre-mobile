import axios from 'axios';

// const oldUrl = "http://localhost:3050/api"
// const herokuApiURl = 'https://projeto-integrador-5s-backend.herokuapp.com/'
// const herokuApiURl = 'https://pi-5-semestre-backend.herokuapp.com/'
const renderApiURl = 'https://pi-5-semestre-backend.onrender.com/'

const api = axios.create({
    baseURL: renderApiURl,
});

export default api;