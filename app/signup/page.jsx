'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppContext } from '@/context/AppContext';
import { signup as signupUser } from '@/lib/services/userService';
import CSRFToken from '@/lib/services/CSRFToken';

const SignupPage = () => {
    const { showToast } = React.useContext(AppContext);
    const [firstName, setFirstName] = React.useState('');
    const [lastName, setLastName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [userType, setUserType] = React.useState('customer');
    const [isLoading, setIsLoading] = React.useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await signupUser(firstName, lastName, email, password, userType);
            if (res && (res.status === 201 || res.status === 200)) {
                showToast('Signup successful! Please log in.', 'success');
                router.push('/login');
            } else {
                showToast('Signup failed. Please try again.', 'error');
            }
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
                    <h2 className="text-3xl font-bold text-center mb-6">Sign Up</h2>
                    <form onSubmit={handleSubmit}>
                        <CSRFToken />
                        <div className="mb-4">
                            <label className="block mb-1 font-medium">First Name</label>
                            <input 
                                type="text" 
                                value={firstName} 
                                onChange={e => setFirstName(e.target.value)} 
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand focus:outline-none" 
                                required 
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block mb-1 font-medium">Last Name</label>
                            <input 
                                type="text" 
                                value={lastName} 
                                onChange={e => setLastName(e.target.value)} 
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand focus:outline-none" 
                                required 
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block mb-1 font-medium">Account Type</label>
                            <select value={userType} onChange={e => setUserType(e.target.value)} className="w-full p-3 border rounded-lg">
                                <option value="customer">Customer</option>
                                <option value="vendor">Vendor</option>
                            </select>
                        </div>
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
                            {isLoading ? '...' : 'Create Account'}
                        </button>
                    </form>
                    <p className="text-center mt-6">
                        <button onClick={() => router.push('/login')} className="font-semibold text-brand hover:text-brand-dark">
                            Have an account? Login
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignupPage; 