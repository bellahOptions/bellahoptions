import InputError from '@/Components/InputError';
import PasswordInput from '@/Components/PasswordInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Display, Eyebrow } from '@/Components/PublicUI';
import { Head, useForm } from '@inertiajs/react';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Reset Password" />

            <Eyebrow>Password reset</Eyebrow>

            <Display as="h2" size="sm" className="mt-5">
                Set a new password
            </Display>
            <p className="jv-body mt-3">
                Choose a strong password to secure your account.
            </p>

            <form onSubmit={submit} className="mt-7 space-y-5">
                <div className="jv-field">
                    <label htmlFor="email" className="jv-label">
                        Email address
                    </label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="jv-input"
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />
                    <InputError message={errors.email} />
                </div>

                <div className="jv-field">
                    <label htmlFor="password" className="jv-label">
                        New password
                    </label>
                    <PasswordInput
                        id="password"
                        name="password"
                        value={data.password}
                        inputClassName="jv-input"
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />
                    <InputError message={errors.password} />
                </div>

                <div className="jv-field">
                    <label htmlFor="password_confirmation" className="jv-label">
                        Confirm new password
                    </label>
                    <PasswordInput
                        id="password_confirmation"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        inputClassName="jv-input"
                        autoComplete="new-password"
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        required
                    />
                    <InputError message={errors.password_confirmation} />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="jv-btn jv-btn--primary w-full"
                >
                    Reset Password
                </button>
            </form>
        </GuestLayout>
    );
}
