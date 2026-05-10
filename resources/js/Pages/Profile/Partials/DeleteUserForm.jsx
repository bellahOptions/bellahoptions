export default function DeleteUserForm({ className = '' }) {
    return (
        <section className={`rounded-lg border border-blue-100 bg-blue-50 p-5 ${className}`}>
            <header>
                <h2 className="text-lg font-medium text-blue-900">Account Closure</h2>
                <p className="mt-1 text-sm text-blue-800">
                    Self-service account deletion is disabled for customer accounts. Contact Bellah support if you need
                    account closure assistance.
                </p>
            </header>
        </section>
    );
}
