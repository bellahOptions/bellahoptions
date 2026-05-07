import { Head } from "@inertiajs/react";
import PageTheme from "@/Layouts/PageTheme";
import PublicPageHeader from "@/Components/PublicPageHeader";
import GoogleReviewsSection from "@/Components/GoogleReviewsSection";
import ClientReviewsSection from "@/Components/ClientReviewsSection";

export default function Reviews() {
    return (
        <>
            <Head title="Client Reviews" />

            <PageTheme>
                <main className="bg-white text-gray-950">
                    <PublicPageHeader
                        pageKey="reviews"
                        fallbackTitle="Google Reviews From Real Clients"
                        fallbackText="Read public Google feedback from founders, teams, and businesses that worked with Bellah Options."
                        className="py-16 text-white sm:py-20 lg:py-24"
                    />

                    <ClientReviewsSection
                        className="bg-white py-16 sm:py-20 lg:py-24"
                        title="All Client Reviews"
                        subtitle="Published reviews from completed Bellah Options client projects."
                        maxVisible={0}
                        showEmptyState
                    />

                    <GoogleReviewsSection
                        className="bg-gray-50 py-16 sm:py-20 lg:py-24"
                        title="All Google Reviews"
                        subtitle="Every available Google review from Bellah Options in one place."
                        maxVisible={0}
                        useFeaturedSelection={false}
                    />
                </main>
            </PageTheme>
        </>
    );
}
