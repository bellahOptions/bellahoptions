import { useEffect, useMemo } from 'react';
import { useQuill } from 'react-quilljs';
import 'quill/dist/quill.snow.css';

const normalizeHtml = (value) => {
    const html = String(value || '').trim();
    return html === '<p><br></p>' ? '' : html;
};

export default function RichTextEditor({
    value = '',
    onChange,
    modules,
    formats,
    placeholder = '',
    className = '',
}) {
    const options = useMemo(() => ({
        theme: 'snow',
        modules,
        formats,
        placeholder,
    }), [formats, modules, placeholder]);

    const { quill, quillRef } = useQuill(options);

    useEffect(() => {
        if (!quill) {
            return;
        }

        const incoming = normalizeHtml(value);
        const current = normalizeHtml(quill.root.innerHTML);

        if (incoming === current) {
            return;
        }

        if (incoming === '') {
            quill.setText('');
            return;
        }

        quill.clipboard.dangerouslyPasteHTML(incoming);
    }, [quill, value]);

    useEffect(() => {
        if (!quill || typeof onChange !== 'function') {
            return;
        }

        const handler = () => {
            onChange(normalizeHtml(quill.root.innerHTML));
        };

        quill.on('text-change', handler);

        return () => {
            quill.off('text-change', handler);
        };
    }, [onChange, quill]);

    return (
        <div className={className}>
            <div ref={quillRef} />
        </div>
    );
}
