import { Head } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';

export default function Home() {
return(
    <>
    <Head title="Welcome to #yourBestOption" />
        
    <header className='bg-blue-50'>
        <nav className='p-4 flex flex-between'>
            <div className='logo'>
                <img src="{ ApplicationLogo }" className='w-25' alt="Bellah Options Logo"/>
                </div>
        </nav>
    </header>
    </>
)
}