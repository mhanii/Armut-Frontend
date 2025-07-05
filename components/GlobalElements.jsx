'use client';

import React from 'react';
import { AppContext } from '@/context/AppContext';
import Toast from '@/components/Toast';
import Modal from '@/components/Modal';
import { useRouter } from 'next/navigation';

const GlobalElements = () => {
    const { toast, modal, setModal } = React.useContext(AppContext);
    const router = useRouter();

    const closeModal = () => {
        setModal({ show: false, order: null, type: '' });
    };

    const closeModalAndNavigate = (path) => {
        closeModal();
        router.push(path);
    };

    const renderModalContent = () => {
        if (modal.type === 'orderSuccess' && modal.order) {
            return (
                <div>
                    <h3 className="text-xl font-bold text-center">Order Placed Successfully!</h3>
                    <p className="text-center my-4">Your order ID is <strong>{modal.order.id}</strong>.</p>
                    <div className="flex justify-center gap-4">
                         <button onClick={() => closeModalAndNavigate(`/orders/${modal.order.id}`)} className="bg-brand text-white font-bold py-2 px-6 rounded-lg">
                            View Order Details
                        </button>
                        <button onClick={() => closeModalAndNavigate('/')} className="bg-gray-200 py-2 px-6 rounded-lg">
                            Continue Shopping
                        </button>
                    </div>
                </div>
            )
        }
        // Future modal types can go here
        return null;
    }

    return (
        <>
            <Toast message={toast.message} show={toast.show} type={toast.type} />
            <Modal 
                show={modal.show} 
                onClose={closeModal}
            >
                {renderModalContent()}
            </Modal>
        </>
    );
};

export default GlobalElements; 