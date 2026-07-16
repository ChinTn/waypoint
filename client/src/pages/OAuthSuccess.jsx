import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const OAuthSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const userParam = searchParams.get('user');
        if (userParam) {
            try {
                // Decode and parse the user JSON string from the URL
                const userData = JSON.parse(decodeURIComponent(userParam));
                
                // Directly update Zustand state to log the user in!
                useAuthStore.setState({
                    user: userData,
                    isAuthenticated: true,
                    error: null,
                    isLoading: false
                });

                // Instantly redirect to the dashboard
                navigate('/dashboard', { replace: true });
            } catch (error) {
                console.error("Failed to parse OAuth user data:", error);
                navigate('/auth?error=OAuthFailed', { replace: true });
            }
        } else {
            navigate('/auth?error=NoUserData', { replace: true });
        }
    }, [searchParams, navigate]);

    return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-8 w-8 bg-blue-500 rounded-full mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-700">Completing login...</h2>
            </div>
        </div>
    );
};

export default OAuthSuccess;
