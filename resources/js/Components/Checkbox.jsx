export default function Checkbox({ className = '', ...props }) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'h-4 w-4 rounded border-jv-line-strong bg-white/[0.06] text-jv-accent accent-jv-accent focus:ring-2 focus:ring-jv-accent/40 focus:ring-offset-0 ' +
                className
            }
        />
    );
}
