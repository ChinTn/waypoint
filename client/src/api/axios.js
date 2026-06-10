import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1',
    withCredentials: true // This is crucial for sending our httpOnly cookies!
});

// Response Interceptor for Silent Token Refresh (AUTH-03)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // If the error is 401 Unauthorized, and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/users/login') {
            originalRequest._retry = true;
            
            try {
                // Attempt to refresh the token directly via axios (so it doesn't trigger an infinite loop)
                await axios.post('http://localhost:8000/api/v1/users/refresh-token', {}, {
                    withCredentials: true
                });
                
                // If successful, retry the original request
                return api(originalRequest);
            } catch (refreshError) {
                // If refresh fails, they need to log in again
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;