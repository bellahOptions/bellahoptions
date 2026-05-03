import { Head } from "@inertiajs/react";
import PageTheme from "@/Layouts/PageTheme";

export default function New(){
    
    <>
        <Head title="Welcome to #yourBestOPtion" />

        <PageTheme>
            <div className="flex items-center justify-center h-screen">
                <h1 className="text-4xl font-bold text-gray-800">Welcome to #yourBestOPtion</h1>
            </div>
        </PageTheme>
    </>
}