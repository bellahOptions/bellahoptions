import { Head } from "@inertiajs/react";
import PageTheme from "@/Layouts/PageTheme";

export default function New(){
    return (
        <>
            <Head title="Welcome to #yourBestOPtion" />

            <PageTheme>
                <div className="flex h-screen items-center justify-center">
                    <h1 className="text-4xl font-bold text-gray-800">
                        Welcome to #yourBestOPtion
                    </h1>
                </div>
            </PageTheme>
        </>
    );
}
