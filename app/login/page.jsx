'use client';

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppContext } from '@/context/AppContext';
import { login as loginUser } from '@/lib/services/userService';
import CSRFToken from '@/lib/services/CSRFToken';

const AuthPage = () => {
    const { onAuthSuccess, showToast } = React.useContext(AppContext);
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    
    const searchParams = useSearchParams();
    const from = searchParams.get('from');
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const user = await loginUser(email, password);
            onAuthSuccess(user.data, `/${from || ''}`);
        } catch (err) {
            showToast(err.message || 'An error occurred.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 py-12 flex justify-center">
            <div className="w-full max-w-md">
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <h2 className="text-3xl font-bold text-center mb-6">Login</h2>
                    <form onSubmit={handleSubmit}>
                        <CSRFToken />
                        <div className="mb-4">
                            <label className="block mb-1 font-medium">Email</label>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand focus:outline-none" 
                                required 
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block mb-1 font-medium">Password</label>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand focus:outline-none" 
                                required 
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isLoading} 
                            className="w-full bg-[#333] text-white p-3 rounded-lg disabled:bg-gray-400 hover:bg-black transition-colors"
                        >
                            {isLoading ? '...' : 'Login'}
                        </button>
                    </form>
                    <p className="text-center mt-6">
                        <button onClick={() => router.push('/signup')} className="font-semibold text-brand hover:text-brand-dark">
                            Need an account? Sign Up
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthPage; 