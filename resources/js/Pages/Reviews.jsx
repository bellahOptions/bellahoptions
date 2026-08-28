import { Head } from "@inertiajs/react";
import PageTheme from "@/Layouts/PageTheme";
import PublicPageHeader from "@/Components/PublicPageHeader";
import ClientReviewsSection from "@/Components/ClientReviewsSection";

export default function Reviews() {
    return (
        <>
            <Head title="Client Reviews" />

            <PageTheme>
                <main className="bg-white text-gray-950">
                    <PublicPageHeader
                        pageKey="reviews"
                        fallbackTitle="Client Reviews"
                        fallbackText="Read feedback from founders, teams, and businesses that worked with Bellah Options."
                        className="py-16 text-white sm:py-20 lg:py-24"
                    />

                    <ClientReviewsSection
                        className="bg-white py-16 sm:py-20 lg:py-24"
                        title="All Client Reviews"
                        subtitle="Published reviews from completed Bellah Options client projects."
                        maxVisible={0}
                        showEmptyState
                    />
                </main>
            </PageTheme>
        </>
    );
}
