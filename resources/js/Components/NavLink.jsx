import { Link } from '@inertiajs/react';

export default function NavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={
                'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none ' +
                (active
                    ? 'border-jv-accent text-white focus:border-jv-accent '
                    : 'border-transparent text-white/50 hover:border-jv-line-strong hover:text-white/80 focus:border-jv-line-strong focus:text-white/80 ') +
                className
            }
        >
            {children}
        </Link>
    );
}
