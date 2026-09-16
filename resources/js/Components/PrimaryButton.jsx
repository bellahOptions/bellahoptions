export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `jv-btn jv-btn--primary ${disabled && 'opacity-60'} ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
