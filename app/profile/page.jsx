'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppContext } from '@/context/AppContext';
// import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getProfile, getUserOrders, getUserAddresses, addUserAddress, updateUserAddress, deleteUserAddress } from '@/lib/services/userService';
import CSRFToken from '@/lib/services/CSRFToken';

const ProfilePage = () => {
    const { user, onLogout, setUser, showToast } = React.useContext(AppContext);
    const [orders, setOrders] = React.useState([]);
    const router = useRouter();

    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [profile, setProfile] = useState(user?.profile || {});
    const [firstName, setFirstName] = useState(profile?.first_name || '');
    const [lastName, setLastName] = useState(profile?.last_name || '');
    const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || '');
    const [userType, setUserType] = useState(profile?.user_type || '');
    
    const [addresses, setAddresses] = useState([]);
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);

    const fetchAddresses = useCallback(async () => {
        if (user) {
            const userAddresses = await getUserAddresses(user.token);
            setAddresses(userAddresses);
        }
    }, [user]);

    useEffect(() => {
        if (!user) {
            router.push('/login?from=profile');
        } else {
            getProfile(user.token).then(data => {
                setProfile(data.profile);
                setFirstName(data.profile.first_name || '');
                setLastName(data.profile.last_name || '');
                setPhoneNumber(data.profile.phone_number || '');
                setUserType(data.profile.user_type || '');
            });
            getUserOrders(user.token).then(setOrders);
            fetchAddresses();
        }
    }, [user, router, fetchAddresses]);

    const handleInfoUpdate = async (e) => {
        e.preventDefault();
        const updatedUser = await api.updateUser(user, { first_name: firstName, last_name: lastName, phone_number: phoneNumber });
        setUser(updatedUser);
        alert("User info updated!");
        setIsEditingInfo(false);
    };

    const handleAddressFormSubmit = async (e) => {
        e.preventDefault();
        const address_1 = ['Country', editingAddress.town, editingAddress.area, editingAddress.road, editingAddress.building, editingAddress.floor, editingAddress.door_number]
            .filter(Boolean).join(', ');
        const addressPayload = {
            title: editingAddress.title,
            town: editingAddress.town,
            area: editingAddress.area,
            road: editingAddress.road,
            building: editingAddress.building,
            floor: editingAddress.floor,
            door_number: editingAddress.door_number,
            address_1,
        };
        if (editingAddress.id) {
            await updateUserAddress(user.token, { ...addressPayload, id: editingAddress.id });
            setAddresses(prev => prev.map(addr => addr.id === editingAddress.id ? { ...editingAddress, address_1 } : addr));
            showToast('Address updated!', 'success');
        } else {
            const newAddr = await addUserAddress(user.token, addressPayload);
            setAddresses(prev => [...prev, newAddr]);
            showToast('Address added!', 'success');
        }
        setIsEditingAddress(false);
        setEditingAddress(null);
    };

    const deleteAddress = async (addressId) => {
        if (window.confirm("Are you sure you want to delete this address?")) {
            await deleteUserAddress(user.token, addressId);
            fetchAddresses(); // Re-fetch addresses
        }
    };
    
    // Functions to control the address modal
    const startEditingAddress = (address) => {
        setEditingAddress({ ...address });
        setIsEditingAddress(true);
    };
    const startAddingAddress = () => {
        setEditingAddress({ id: null, title: '', town: '', area: '', road: '', building: '', floor: '', door_number: '', address_1: '' });
        setIsEditingAddress(true);
    };
    const cancelAddressEdit = () => {
        setIsEditingAddress(false);
        setEditingAddress(null);
    };

    const handleDeleteAccount = () => {
        if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            console.log("Deleting account for user:", user.id);
            alert("Account deleted successfully.");
            onLogout();
        }
    };

    if (!user) {
        return <div className="text-center py-20">Redirecting to login...</div>;
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <h2 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-6">My Profile</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
                <div className="lg:col-span-2">
                    {/* Order History */}
                    <div className="bg-white p-3 sm:p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-4">Order History</h3>
                        {orders.length > 0 ? (
                            orders.map(o => (
                                <div key={o.id} className="p-2 sm:p-4 border-b last:border-b-0">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                                        <div>
                                            <p className="font-bold text-base sm:text-lg">{o.id}</p>
                                            <p className="text-xs sm:text-sm text-gray-500">Date: {new Date(o.created_at).toLocaleDateString()}</p>
                                            <p className="text-xs sm:text-sm text-gray-500">Status: <span className="text-blue-600 font-medium">{o.status}</span></p>
                                        </div>
                                        <div className="text-left sm:text-right">
                                            <p className="font-bold text-base sm:text-lg">${parseFloat(o.total).toFixed(2)}</p>
                                            <Link href={`/orders/${o.id}`} className="text-xs sm:text-sm text-brand hover:underline mt-1">View Details</Link>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="p-3 sm:p-6 text-gray-500 text-xs sm:text-base">You have no previous orders.</p>
                        )}
                    </div>
                </div>

                <div className="space-y-4 sm:space-y-6">
                    {/* Account Details */}
                    <div className="bg-white p-3 sm:p-6 rounded-lg shadow-sm">
                        <h3 className="text-base sm:text-xl font-semibold mb-2 sm:mb-4">Account Details</h3>
                        {!isEditingInfo ? (
                            <div>
                                <p className="mb-1 sm:mb-2 text-xs sm:text-base"><span className="font-semibold">First Name:</span> {firstName}</p>
                                <p className="mb-1 sm:mb-2 text-xs sm:text-base"><span className="font-semibold">Last Name:</span> {lastName}</p>
                                <p className="mb-1 sm:mb-2 text-xs sm:text-base"><span className="font-semibold">User Type:</span> {userType}</p>
                                <p className="mb-1 sm:mb-2 text-xs sm:text-base"><span className="font-semibold">Phone Number:</span> {phoneNumber || 'Not set'}</p>
                                <p className="text-xs sm:text-base"><span className="font-semibold">Email:</span> {user.email}</p>
                                <button onClick={() => setIsEditingInfo(true)} className="mt-3 sm:mt-4 text-xs sm:text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded">
                                    Modify Information
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleInfoUpdate}>
                                <div className="mb-3 sm:mb-4">
                                    <label className="block mb-1 font-medium text-xs sm:text-base">First Name</label>
                                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full p-2 border rounded text-xs sm:text-base" />
                                </div>
                                <div className="mb-3 sm:mb-4">
                                    <label className="block mb-1 font-medium text-xs sm:text-base">Last Name</label>
                                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full p-2 border rounded text-xs sm:text-base" />
                                </div>
                                <div className="mb-3 sm:mb-4">
                                    <label className="block mb-1 font-medium text-xs sm:text-base">Phone Number</label>
                                    <input type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="w-full p-2 border rounded text-xs sm:text-base" />
                                </div>
                                <div className="flex gap-2">
                                    <button type="submit" className="text-xs sm:text-sm bg-brand text-white px-3 py-1 rounded">Save</button>
                                    <button type="button" onClick={() => setIsEditingInfo(false)} className="text-xs sm:text-sm bg-gray-200 px-3 py-1 rounded">Cancel</button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Address Book */}
                    <div className="bg-white p-3 sm:p-6 rounded-lg shadow-sm">
                        <h3 className="text-base sm:text-xl font-semibold mb-2 sm:mb-4">Address Book</h3>
                        <div className="space-y-2 sm:space-y-3">
                            {addresses.map(addr => (
                                <div key={addr.id} className="border-b last:border-b-0 pb-2 sm:pb-3">
                                    <p className="font-medium text-xs sm:text-base">
                                        {['Country', addr.town, addr.area, addr.road, addr.building, addr.floor, addr.door_number]
                                            .filter(Boolean).join(', ')}
                                    </p>
                                    <p className="text-gray-600 text-xs sm:text-base">{addr.title}</p>
                                    <div className="flex gap-2 sm:gap-4 mt-1 sm:mt-2">
                                        <button onClick={() => startEditingAddress(addr)} className="text-xs sm:text-sm text-brand hover:underline">Edit</button>
                                        <button onClick={() => deleteAddress(addr.id)} className="text-xs sm:text-sm text-red-500 hover:underline">Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={startAddingAddress} className="mt-3 sm:mt-4 text-xs sm:text-sm bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-lg w-full">
                            Add New Address
                        </button>
                        {/* Address Form Modal */}
                        {isEditingAddress && (
                            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-2 sm:p-0">
                                <form onSubmit={handleAddressFormSubmit} className="bg-white p-3 sm:p-6 rounded-lg shadow-lg w-full max-w-xs sm:max-w-md relative">
                                    <button type="button" className="absolute top-2 right-2 text-gray-400 hover:text-black text-xl sm:text-2xl" onClick={cancelAddressEdit}>&times;</button>
                                    <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">{editingAddress.id ? 'Edit Address' : 'Add New Address'}</h3>
                                    {/* CSRF Token for Add New Address */}
                                    {!editingAddress.id && <CSRFToken />}
                                    <div className="mb-3 sm:mb-4">
                                        <label className="block mb-1 font-medium text-xs sm:text-base">Title</label>
                                        <input type="text" value={editingAddress.title} onChange={e => setEditingAddress({ ...editingAddress, title: e.target.value })} className="w-full p-2 border rounded text-xs sm:text-base" required />
                                    </div>
                                    <div className="mb-3 sm:mb-4">
                                        <label className="block mb-1 font-medium text-xs sm:text-base">Town</label>
                                        <input type="text" value={editingAddress.town} onChange={e => setEditingAddress({ ...editingAddress, town: e.target.value })} className="w-full p-2 border rounded text-xs sm:text-base" required />
                                    </div>
                                    <div className="mb-3 sm:mb-4">
                                        <label className="block mb-1 font-medium text-xs sm:text-base">Area</label>
                                        <input type="text" value={editingAddress.area} onChange={e => setEditingAddress({ ...editingAddress, area: e.target.value })} className="w-full p-2 border rounded text-xs sm:text-base" required />
                                    </div>
                                    <div className="mb-3 sm:mb-4">
                                        <label className="block mb-1 font-medium text-xs sm:text-base">Road</label>
                                        <input type="text" value={editingAddress.road} onChange={e => setEditingAddress({ ...editingAddress, road: e.target.value })} className="w-full p-2 border rounded text-xs sm:text-base" required />
                                    </div>
                                    <div className="mb-3 sm:mb-4">
                                        <label className="block mb-1 font-medium text-xs sm:text-base">Building</label>
                                        <input type="text" value={editingAddress.building} onChange={e => setEditingAddress({ ...editingAddress, building: e.target.value })} className="w-full p-2 border rounded text-xs sm:text-base" required />
                                    </div>
                                    <div className="mb-3 sm:mb-4 flex gap-2">
                                        <div className="w-1/2">
                                            <label className="block mb-1 font-medium text-xs sm:text-base">Floor</label>
                                            <input type="text" value={editingAddress.floor} onChange={e => setEditingAddress({ ...editingAddress, floor: e.target.value })} className="w-full p-2 border rounded text-xs sm:text-base" required />
                                        </div>
                                        <div className="w-1/2">
                                            <label className="block mb-1 font-medium text-xs sm:text-base">Door Number</label>
                                            <input type="text" value={editingAddress.door_number} onChange={e => setEditingAddress({ ...editingAddress, door_number: e.target.value })} className="w-full p-2 border rounded text-xs sm:text-base" required />
                                        </div>
                                    </div>
                                    {/* Address Line 1 is not shown, but generated automatically */}
                                    <div className="mb-4 text-xs sm:text-sm text-gray-500">
                                        <span>Full Address Preview: </span>
                                        <span className="font-medium">
                                            {['Country', editingAddress.town, editingAddress.area, editingAddress.road, editingAddress.building, editingAddress.floor, editingAddress.door_number]
                                                .filter(Boolean).join(', ')}
                                        </span>
                                    </div>
                                    <div className="flex gap-2 mt-3 sm:mt-4">
                                        <button type="submit" className="bg-brand text-white px-3 sm:px-4 py-2 rounded text-xs sm:text-base">Save</button>
                                        <button type="button" onClick={cancelAddressEdit} className="bg-gray-200 px-3 sm:px-4 py-2 rounded text-xs sm:text-base">Cancel</button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Account Management */}
                    <div className="bg-white p-3 sm:p-6 rounded-lg shadow-sm">
                        <h3 className="text-base sm:text-xl font-semibold mb-2 sm:mb-4">Account Management</h3>
                        <button onClick={handleDeleteAccount} className="text-xs sm:text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage; 