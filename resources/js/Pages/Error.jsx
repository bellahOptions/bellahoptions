import { Head } from "@inertiajs/react";
import ErrorCanvas from "@/Components/ErrorCanvas";

export default function Error({ status = 500, title = null, message = null }) {
    return (
        <>
            <Head title={`${status} Error`} />
            <ErrorCanvas status={status} title={title} message={message} />
        </>
    );
}
