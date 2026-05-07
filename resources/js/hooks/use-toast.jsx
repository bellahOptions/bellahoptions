import { createContext, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const idRef = useRef(0);

    const dismiss = (id) => {
        setToasts((previous) => previous.filter((toast) => toast.id !== id));
    };

    const toast = ({ title = '', description = '', variant = 'default', duration = 3200 } = {}) => {
        const id = ++idRef.current;
        const nextToast = {
            id,
            title,
            description,
            variant,
            duration,
        };

        setToasts((previous) => [...previous, nextToast]);

        window.setTimeout(() => {
            dismiss(id);
        }, duration);

        return id;
    };

    const contextValue = useMemo(() => ({ toast, dismiss, toasts }), [toasts]);

    return <ToastContext.Provider value={contextValue}>{children}</ToastContext.Provider>;
}

function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }

    return {
        toast: context.toast,
        dismiss: context.dismiss,
    };
}

function useToastState() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error('useToastState must be used within ToastProvider');
    }

    return context;
}

export { ToastProvider, useToast, useToastState };
