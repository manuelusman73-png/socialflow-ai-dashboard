import React, { useEffect, useState } from 'react';

export interface ToastMessage {
    id: string;
    message: string;
    type: 'success' | 'info' | 'error' | 'warning';
    duration?: number;
}

interface ToastProps {
    message: ToastMessage;
    onClose: (id: string) => void;
}

const MaterialIcon = ({ name }: { name: string }) => (
    <span className="material-symbols-outlined">{name}</span>
);

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const duration = message.duration || 5000;
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => onClose(message.id), 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [message, onClose]);

    const getIcon = () => {
        switch (message.type) {
            case 'success':
                return 'check_circle';
            case 'error':
                return 'error';
            case 'warning':
                return 'warning';
            case 'info':
            default:
                return 'info';
        }
    };

    const getColors = () => {
        switch (message.type) {
            case 'success':
                return 'bg-teal-500/10 border-teal-500/50 text-teal-400';
            case 'error':
                return 'bg-red-500/10 border-red-500/50 text-red-400';
            case 'warning':
                return 'bg-orange-500/10 border-orange-500/50 text-orange-400';
            case 'info':
            default:
                return 'bg-blue-500/10 border-blue-500/50 text-blue-400';
        }
    };

    return (
        <div
            className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm
        shadow-lg transition-all duration-300 min-w-[300px] max-w-[500px]
        ${getColors()}
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
        >
            <MaterialIcon name={getIcon()} />
            <p className="flex-1 text-sm font-medium text-white">{message.message}</p>
            <button
                onClick={() => {
                    setIsExiting(true);
                    setTimeout(() => onClose(message.id), 300);
                }}
                className="text-gray-400 hover:text-white transition-colors"
            >
                <MaterialIcon name="close" />
            </button>
        </div>
    );
};

interface ToastContainerProps {
    messages: ToastMessage[];
    onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ messages, onClose }) => {
    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
            {messages.map((message) => (
                <div key={message.id} className="pointer-events-auto">
                    <Toast message={message} onClose={onClose} />
                </div>
            ))}
        </div>
    );
};
