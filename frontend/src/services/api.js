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

export const analyzeRepository = async (task, repoPath, confirmed = false) => {
    console.log(`Sending request with confirmed=${confirmed}`);
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
};

export const askFollowUpQuestion = async (question) => {
    try {
        const response = await axiosInstance.post('/ask', {
            question
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Ein Fehler ist bei der Nachfrage aufgetreten');
    }
};

export const confirmAnalysis = async (requestId) => {
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
