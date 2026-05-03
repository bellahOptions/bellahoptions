import { Head, Link } from '@inertiajs/react';
import PageTheme from "@/Layouts/PageTheme";

export default function About(){
    return(
    <>
        <Head title="About Bellah Options" />

        <PageTheme>
            <div className="flex items-center justify-center h-screen">
                <h1 className="text-4xl font-bold text-gray-800">Welcome to About Us</h1>
            </div>
        </PageTheme>
    </>
    );
}