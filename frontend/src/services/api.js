// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:443/api';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 300000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: false
});

const api = {
    async analyzeRepository(task, repoPath, confirmed = false) {
        try {
            const response = await axiosInstance.post('/analyze', {
                task,
                repoPath,
                confirm: confirmed
            });

            return response.data;
        } catch (error) {
            console.error('API Error:', error);
            if (error.response?.data?.error) {
                throw new Error(error.response.data.error);
            }
            throw new Error(error.message || 'Ein Fehler ist bei der Analyse aufgetreten');
        }
    },

    async askFollowUpQuestion(question) {
        try {
            const response = await axiosInstance.post('/ask', {
                question
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Ein Fehler ist bei der Nachfrage aufgetreten');
        }
    },

    async confirmAnalysis(requestId) {
        try {
            const response = await axiosInstance.post('/confirm', {
                requestId
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Ein Fehler ist bei der Bestätigung aufgetreten');
        }
    }
};

export default api;