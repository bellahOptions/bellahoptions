import { Head } from "@inertiajs/react";
import PageTheme from "@/Layouts/PageTheme";
import PublicPageHeader from "@/Components/PublicPageHeader";
import ClientReviewsSection from "@/Components/ClientReviewsSection";

export default function Reviews() {
    return (
        <>
            <Head title="Client Reviews" />

            <PageTheme>
                <main className="text-white">
                    <PublicPageHeader
                        pageKey="reviews"
                        fallbackTitle="Client Reviews"
                        fallbackText="Read feedback from founders, teams, and businesses that worked with Bellah Options."
                        eyebrow="Reviews"
                        className="jv-glow pt-16 pb-10 sm:pt-20 sm:pb-14 lg:pt-24 lg:pb-16"
                    />

                    <ClientReviewsSection
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
