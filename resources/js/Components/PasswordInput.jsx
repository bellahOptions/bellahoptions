import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

function EyeIcon({ hidden = false }) {
    if (hidden) {
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
                <path d="M3 3l18 18" />
                <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                <path d="M9.88 5.09A10.94 10.94 0 0 1 12 4c5.05 0 9.27 3.11 11 8-1.03 2.9-3 5.2-5.56 6.49" />
                <path d="M6.61 6.61C4.62 8.06 3.1 9.89 2 12c1.73 4.89 5.95 8 11 8a11 11 0 0 0 3.07-.44" />
            </svg>
        );
    }

    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
            <path d="M2 12s3.5-8 10-8 10 8 10 8-3.5 8-10 8-10-8-10-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

export default forwardRef(function PasswordInput(
    {
        className = '',
        inputClassName = '',
        showToggleLabel = true,
        ...props
    },
    ref,
) {
    const [visible, setVisible] = useState(false);
    const inputRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => inputRef.current?.focus(),
    }));

    return (
        <div className={className}>
            <div className="relative">
                <input
                    {...props}
                    ref={inputRef}
                    type={visible ? 'text' : 'password'}
                    className={`${inputClassName} pr-20`}
                />
                <button
                    type="button"
                    onClick={() => setVisible((state) => !state)}
                    className="absolute inset-y-0 right-2 inline-flex items-center gap-1 rounded-md px-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                    aria-label={visible ? 'Hide password' : 'Show password'}
                >
                    <EyeIcon hidden={visible} />
                    {showToggleLabel && <span>{visible ? 'Hide' : 'Show'}</span>}
                </button>
            </div>
        </div>
    );
});
