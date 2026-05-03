import AdminContentManager from "@/Components/AdminContentManager";

const fields = [
    { name: "title", label: "Title", required: true, className: "md:col-span-2" },
    { name: "category", label: "Category", summary: true },
    { name: "position", label: "Position", type: "number", defaultValue: 0, summary: true },
    { name: "description", label: "Description", type: "textarea", rows: 3, className: "md:col-span-2" },
    { name: "image_path", label: "Image URL or Public Path", required: true, placeholder: "/images/sample.jpg", summary: true },
    { name: "project_url", label: "Project URL", placeholder: "https://example.com" },
    { name: "is_published", label: "Published", type: "checkbox", defaultValue: true },
];

export default function GalleryAdmin({ items = [] }) {
    return (
        <AdminContentManager
            title="Manage Gallery"
            description="Upload portfolio samples and choose which ones appear on the public gallery."
            routeBase="admin.gallery"
            fields={fields}
            items={items}
            previewField="image_path"
        />
    );
}
