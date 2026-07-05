import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useProjectStore from '../store/projectStore';

const JoinProject = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { joinProject } = useProjectStore();
    const [status, setStatus] = useState('joining');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const handleJoin = async () => {
            try {
                const project = await joinProject(token);
                setStatus('success');
                // Redirect to the project board after 1.5 seconds
                setTimeout(() => {
                    navigate(`/project/${project._id}`);
                }, 1500);
            } catch (error) {
                setStatus('error');
                setErrorMsg(error.response?.data?.message || 'Invalid or expired invite link.');
            }
        };

        handleJoin();
    }, [token, joinProject, navigate]);

    return (
        <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white/5 border border-white/10 p-10 rounded-[2rem] text-center shadow-2xl backdrop-blur-md">
                
                {status === 'joining' && (
                    <>
                        <div className="w-16 h-16 border-4 border-[#3b82f6] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                        <h2 className="text-2xl font-serif text-white mb-2">Joining Project...</h2>
                        <p className="text-neutral-500 font-sans text-sm">Please wait while we verify your invite link.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-green-500/20 text-green-400 flex items-center justify-center rounded-full mx-auto mb-6 border border-green-500/30">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-serif text-white mb-2">Welcome Aboard!</h2>
                        <p className="text-neutral-500 font-sans text-sm">Successfully joined the project. Redirecting...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 bg-red-500/20 text-red-400 flex items-center justify-center rounded-full mx-auto mb-6 border border-red-500/30">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-serif text-white mb-4">Invite Failed</h2>
                        <p className="text-neutral-400 text-sm mb-8 bg-neutral-950/40 p-4 rounded-xl border border-white/5">{errorMsg}</p>
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="bg-white/5 hover:bg-white/10 text-white w-full py-4 rounded-xl font-bold font-sans text-xs uppercase tracking-widest transition-colors border border-white/10"
                        >
                            Return to Dashboard
                        </button>
                    </>
                )}

            </div>
        </div>
    );
};

export default JoinProject;
