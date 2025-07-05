'use client';

const Modal = ({ show, title, children, onClose }) => {
    if(!show) return null;
    
    return (
        <div className={`modal-overlay ${show ? 'show' : ''}`} onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{title}</h3>
                    <button onClick={onClose} className="text-2xl">&times;</button>
                </div>
                {children}
            </div>
        </div>
    );
};

export default Modal; 