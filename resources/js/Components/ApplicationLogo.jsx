import { usePage } from '@inertiajs/react';

export default function ApplicationLogo(props) {
    const { branding = {} } = usePage().props;
    const source = branding?.logo_path || '/logo-06.svg';

    return (
        <img
            {...props}
            src={source}
            alt="Bellah Options"
        />
    );
}
