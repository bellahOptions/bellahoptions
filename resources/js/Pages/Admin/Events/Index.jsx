import AdminContentManager from "@/Components/AdminContentManager";

const fields = [
    { name: "title", label: "Title", required: true, className: "md:col-span-2" },
    { name: "event_date", label: "Event Date", type: "datetime-local", summary: true },
    { name: "location", label: "Location", summary: true },
    { name: "description", label: "Description", type: "textarea", rows: 3, className: "md:col-span-2" },
    { name: "image_path", label: "Image URL or Public Path", placeholder: "/images/event.jpg" },
    { name: "registration_url", label: "Registration URL", placeholder: "https://example.com/register" },
    { name: "position", label: "Position", type: "number", defaultValue: 0 },
    { name: "is_published", label: "Published", type: "checkbox", defaultValue: true },
];

export default function EventsAdmin({ items = [] }) {
    return (
        <AdminContentManager
            title="Manage Events"
            description="Create events, workshops, launches, and sessions for the public events page."
            routeBase="admin.events"
            fields={fields}
            items={items}
            previewField="image_path"
        />
    );
}
