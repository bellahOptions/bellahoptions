import AdminContentManager from "@/Components/AdminContentManager";

const fields = [
    { name: "title", label: "Title", required: true, className: "md:col-span-2" },
    { name: "slug", label: "Slug", placeholder: "leave blank to auto-generate", summary: true },
    { name: "category", label: "Category", summary: true },
    { name: "excerpt", label: "Excerpt", type: "textarea", rows: 2, className: "md:col-span-2" },
    { name: "body", label: "Post Body", type: "textarea", rows: 8, className: "md:col-span-2" },
    { name: "cover_image", label: "Cover Image URL or Public Path", placeholder: "/images/blog-cover.jpg" },
    { name: "author_name", label: "Author Name", defaultValue: "Bellah Options", summary: true },
    { name: "published_at", label: "Published At", type: "datetime-local" },
    { name: "position", label: "Position", type: "number", defaultValue: 0 },
    { name: "is_published", label: "Published", type: "checkbox", defaultValue: true },
];

export default function BlogAdmin({ items = [] }) {
    return (
        <AdminContentManager
            title="Manage Blog"
            description="Publish insights and announcements to the public blog."
            routeBase="admin.blog"
            fields={fields}
            items={items}
            previewField="cover_image"
        />
    );
}
