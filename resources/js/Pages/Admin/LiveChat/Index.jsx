import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StaffLiveChatWorkspace from '@/Components/live-chat/StaffLiveChatWorkspace';
import { Head } from '@inertiajs/react';

export default function AdminLiveChatIndex({ selectedThreadId = null }) {
    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-bold leading-tight text-gray-900">Live Chat</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Real-time support dashboard for staff and admin users.
                    </p>
                </div>
            }
        >
            <Head title="Admin Live Chat" />

            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="h-[min(80vh,760px)]">
                    <StaffLiveChatWorkspace initialThreadId={selectedThreadId} className="h-full" />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
