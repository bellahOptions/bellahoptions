import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const AUTOSAVE_DEBOUNCE_MS = 650;
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
            address: user.address || '',
            company_name: user.company_name || '',
            social_media_info: user.social_media_info || '',
            business_number: user.business_number || '',
            business_official_email: user.business_official_email || '',
            business_address: user.business_address || '',
            profile_photo: null,
            company_logo: null,
        });

    const [profilePhotoPreview, setProfilePhotoPreview] = useState(user.profile_photo_url || null);
    const [companyLogoPreview, setCompanyLogoPreview] = useState(user.company_logo_url || null);
    const autosaveTimeoutRef = useRef(null);
    const hasMountedFieldAutosaveRef = useRef(false);
    const hasMountedProfilePhotoAutosaveRef = useRef(false);
    const hasMountedCompanyLogoAutosaveRef = useRef(false);

    const submitProfileUpdate = useCallback((options = {}) => {
        patch(route('profile.update'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                if (options.clearProfilePhoto) {
                    setData('profile_photo', null);
                }

                if (options.clearCompanyLogo) {
                    setData('company_logo', null);
                }
            },
        });
    }, [patch, setData]);

    useEffect(() => {
        if (!(data.profile_photo instanceof File)) {
            setProfilePhotoPreview(user.profile_photo_url || null);

            return undefined;
        }

        const objectUrl = URL.createObjectURL(data.profile_photo);
        setProfilePhotoPreview(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [data.profile_photo, user.profile_photo_url]);

    useEffect(() => {
        if (!(data.company_logo instanceof File)) {
            setCompanyLogoPreview(user.company_logo_url || null);

            return undefined;
        }

        const objectUrl = URL.createObjectURL(data.company_logo);
        setCompanyLogoPreview(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [data.company_logo, user.company_logo_url]);

    useEffect(() => {
        if (!hasMountedFieldAutosaveRef.current) {
            hasMountedFieldAutosaveRef.current = true;

            return undefined;
        }

        if (autosaveTimeoutRef.current) {
            clearTimeout(autosaveTimeoutRef.current);
        }

        autosaveTimeoutRef.current = setTimeout(() => {
            autosaveTimeoutRef.current = null;
            submitProfileUpdate();
        }, AUTOSAVE_DEBOUNCE_MS);

        return () => {
            if (autosaveTimeoutRef.current) {
                clearTimeout(autosaveTimeoutRef.current);
                autosaveTimeoutRef.current = null;
            }
        };
    }, [
        AUTOSAVE_DEBOUNCE_MS,
        data.address,
        data.business_address,
        data.business_number,
        data.business_official_email,
        data.company_name,
        data.name,
        data.social_media_info,
        submitProfileUpdate,
    ]);

    useEffect(() => {
        if (!hasMountedProfilePhotoAutosaveRef.current) {
            hasMountedProfilePhotoAutosaveRef.current = true;

            return;
        }

        if (!(data.profile_photo instanceof File)) {
            return;
        }

        if (autosaveTimeoutRef.current) {
            clearTimeout(autosaveTimeoutRef.current);
            autosaveTimeoutRef.current = null;
        }

        submitProfileUpdate({ clearProfilePhoto: true });
    }, [data.profile_photo, submitProfileUpdate]);

    useEffect(() => {
        if (!hasMountedCompanyLogoAutosaveRef.current) {
            hasMountedCompanyLogoAutosaveRef.current = true;

            return;
        }

        if (!(data.company_logo instanceof File)) {
            return;
        }

        if (autosaveTimeoutRef.current) {
            clearTimeout(autosaveTimeoutRef.current);
            autosaveTimeoutRef.current = null;
        }

        submitProfileUpdate({ clearCompanyLogo: true });
    }, [data.company_logo, submitProfileUpdate]);

    const submit = (e) => {
        e.preventDefault();
        if (autosaveTimeoutRef.current) {
            clearTimeout(autosaveTimeoutRef.current);
            autosaveTimeoutRef.current = null;
        }
        submitProfileUpdate();
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Profile Information
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Update your account profile information.
                </p>
                <p className="mt-1 text-xs text-gray-500">
                    Changes save automatically as you type or upload files.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="name" value="Name" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="profile_photo" value="Profile Photo" />

                    <div className="mt-2 flex items-center gap-4">
                        <div className="h-14 w-14 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                            {profilePhotoPreview ? (
                                <img src={profilePhotoPreview} alt="Profile preview" className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-500">
                                    N/A
                                </div>
                            )}
                        </div>
                        <input
                            id="profile_photo"
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp"
                            onChange={(e) => setData('profile_photo', e.target.files?.[0] || null)}
                            className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-[#000285] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-800"
                        />
                    </div>

                    <InputError className="mt-2" message={errors.profile_photo} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        readOnly
                        disabled
                        required
                        autoComplete="username"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Registered email address cannot be changed here.
                    </p>

                    <InputError className="mt-2" message={errors.email} />
                </div>

                <div>
                    <InputLabel htmlFor="address" value="Residential Address" />

                    <textarea
                        id="address"
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        value={data.address}
                        onChange={(e) => setData('address', e.target.value)}
                    />

                    <InputError className="mt-2" message={errors.address} />
                </div>

                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                    <h3 className="text-sm font-semibold text-blue-900">Company KYC Details</h3>
                    <p className="mt-1 text-xs text-blue-700">
                        Add your company details for verification and smoother onboarding.
                    </p>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="company_name" value="Company Name" />
                            <TextInput
                                id="company_name"
                                className="mt-1 block w-full"
                                value={data.company_name}
                                onChange={(e) => setData('company_name', e.target.value)}
                            />
                            <InputError className="mt-2" message={errors.company_name} />
                        </div>

                        <div>
                            <InputLabel htmlFor="business_number" value="Business Number" />
                            <TextInput
                                id="business_number"
                                className="mt-1 block w-full"
                                value={data.business_number}
                                onChange={(e) => setData('business_number', e.target.value)}
                            />
                            <InputError className="mt-2" message={errors.business_number} />
                        </div>

                        <div className="md:col-span-2">
                            <InputLabel htmlFor="company_logo" value="Company Logo" />
                            <div className="mt-2 flex items-center gap-4">
                                <div className="h-16 w-16 overflow-hidden rounded-lg border border-gray-200 bg-white">
                                    {companyLogoPreview ? (
                                        <img src={companyLogoPreview} alt="Company logo preview" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-gray-500">
                                            No Logo
                                        </div>
                                    )}
                                </div>
                                <input
                                    id="company_logo"
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.webp"
                                    onChange={(e) => setData('company_logo', e.target.files?.[0] || null)}
                                    className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-[#000285] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-800"
                                />
                            </div>
                            <InputError className="mt-2" message={errors.company_logo} />
                        </div>

                        <div>
                            <InputLabel htmlFor="business_official_email" value="Business Official Email" />
                            <TextInput
                                id="business_official_email"
                                type="email"
                                className="mt-1 block w-full"
                                value={data.business_official_email}
                                onChange={(e) => setData('business_official_email', e.target.value)}
                            />
                            <InputError className="mt-2" message={errors.business_official_email} />
                        </div>

                        <div>
                            <InputLabel htmlFor="social_media_info" value="Social Media Information" />
                            <TextInput
                                id="social_media_info"
                                className="mt-1 block w-full"
                                value={data.social_media_info}
                                onChange={(e) => setData('social_media_info', e.target.value)}
                                placeholder="@brandname, facebook.com/brandname"
                            />
                            <InputError className="mt-2" message={errors.social_media_info} />
                        </div>
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="business_address" value="Business Address" />
                        <textarea
                            id="business_address"
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            value={data.business_address}
                            onChange={(e) => setData('business_address', e.target.value)}
                        />
                        <InputError className="mt-2" message={errors.business_address} />
                    </div>
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800">
                            Your email address is unverified.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Click here to re-send the verification email.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600">
                                A new verification link has been sent to your
                                email address.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Save</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">
                            Saved.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
