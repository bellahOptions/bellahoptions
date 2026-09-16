import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Eyebrow } from '@/Components/PublicUI';
import { Card } from '@/Components/ui/card';
import { Head } from '@inertiajs/react';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-white">
                    Profile
                </h2>
            }
        >
            <Head title="Profile" />

            <div className="py-8 sm:py-12">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <Card className="p-5 sm:p-6">
                        <Eyebrow>Account</Eyebrow>
                        <h1 className="jv-display jv-display--md mt-5">Profile Settings</h1>
                        <p className="jv-lead mt-4 max-w-2xl">
                            Keep your personal details, company KYC information, and password up to date.
                        </p>
                    </Card>

                    <Card className="p-5 sm:p-8">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </Card>

                    <Card className="p-5 sm:p-8">
                        <UpdatePasswordForm className="max-w-xl" />
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
