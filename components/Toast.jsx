'use client';

const Toast = ({ message, show, type = 'note' }) => {
    let bgColor = 'bg-gray-800';
    if (type === 'success') bgColor = 'bg-green-600';
    else if (type === 'error') bgColor = 'bg-red-600';
    else if (type === 'note') bgColor = 'bg-blue-600';
    return (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 ${bgColor} text-white py-2 px-5 rounded-full shadow-lg transition-all ${show ? 'opacity-100' : 'opacity-0'}`}>
            {message}
        </div>
    );
};

export default Toast; 