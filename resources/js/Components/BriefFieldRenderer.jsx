import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select } from '@/Components/ui/select';
import { Textarea } from '@/Components/ui/textarea';
import { useState } from 'react';

export default function BriefFieldRenderer({ field, value, error, onChange, uploadSessionToken, disabled = false }) {
    const { key, label, type, help, placeholder, options = [], min, max, max_selections: maxSelections } = field;

    if (type === 'checkbox') {
        return (
            <div>
                <label className="flex items-start gap-2 text-sm text-gray-700">
                    <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={Boolean(value)}
                        disabled={disabled}
                        onChange={(event) => onChange(event.target.checked)}
                    />
                    <span>{label}</span>
                </label>
                {help && <p className="mt-1 text-xs text-gray-500">{help}</p>}
                {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
            </div>
        );
    }

    return (
        <div>
            <Label>{label}</Label>
            {help && <p className="mb-1 mt-0.5 text-xs text-gray-500">{help}</p>}
            <div className="mt-1">
                <FieldInput
                    fieldKey={key}
                    type={type}
                    value={value}
                    onChange={onChange}
                    options={options}
                    min={min}
                    max={max}
                    maxSelections={maxSelections}
                    placeholder={placeholder}
                    uploadSessionToken={uploadSessionToken}
                    field={field}
                    disabled={disabled}
                />
            </div>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

function FieldInput({ fieldKey, type, value, onChange, options, min, max, maxSelections, placeholder, uploadSessionToken, field, disabled }) {
    switch (type) {
        case 'textarea':
            return <Textarea value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} />;
        case 'email':
            return <Input type="email" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} />;
        case 'tel':
            return <Input type="tel" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} />;
        case 'number':
            return (
                <Input
                    type="number"
                    min={min}
                    max={max}
                    value={value ?? ''}
                    onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
                    disabled={disabled}
                />
            );
        case 'date':
            return <Input type="date" value={value || ''} onChange={(e) => onChange(e.target.value)} disabled={disabled} />;
        case 'url':
            return <Input type="url" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || 'https://'} disabled={disabled} />;
        case 'select':
            return (
                <Select value={value || ''} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
                    <option value="">Select one</option>
                    {options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </Select>
            );
        case 'radio':
            return (
                <div className="space-y-2">
                    {options.map((opt) => (
                        <label key={opt} className="flex items-center gap-2 text-sm text-gray-700">
                            <input type="radio" name={fieldKey} checked={value === opt} disabled={disabled} onChange={() => onChange(opt)} />
                            {opt}
                        </label>
                    ))}
                </div>
            );
        case 'multiselect': {
            const selected = Array.isArray(value) ? value : [];
            const atCap = Boolean(maxSelections) && selected.length >= maxSelections;

            return (
                <div className="grid gap-2 sm:grid-cols-2">
                    {options.map((opt) => {
                        const checked = selected.includes(opt);
                        const optionDisabled = disabled || (!checked && atCap);

                        return (
                            <label key={opt} className={`flex items-center gap-2 text-sm ${optionDisabled ? 'text-gray-400' : 'text-gray-700'}`}>
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={optionDisabled}
                                    onChange={() => onChange(checked ? selected.filter((o) => o !== opt) : [...selected, opt])}
                                />
                                {opt}
                            </label>
                        );
                    })}
                    {maxSelections ? (
                        <p className="col-span-full text-xs text-gray-500">{selected.length} of {maxSelections} selected</p>
                    ) : null}
                </div>
            );
        }
        case 'scale':
            return <ScaleInput value={value} onChange={onChange} min={min || 1} max={max || 5} disabled={disabled} />;
        case 'file':
            return <FileUploadInput field={field} value={value} onChange={onChange} uploadSessionToken={uploadSessionToken} disabled={disabled} />;
        default:
            return <Input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} />;
    }
}

function ScaleInput({ value, onChange, min, max, disabled }) {
    const options = [];
    for (let n = min; n <= max; n++) {
        options.push(n);
    }

    return (
        <div className="flex items-center gap-2">
            {options.map((n) => (
                <button
                    key={n}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(n)}
                    className={`h-9 w-9 rounded-full border text-sm font-semibold transition ${
                        Number(value) === n ? 'border-brand bg-brand text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    {n}
                </button>
            ))}
        </div>
    );
}

function FileUploadInput({ field, value, onChange, uploadSessionToken, disabled }) {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const ids = Array.isArray(value) ? value : [];

    const handleFileSelect = async (event) => {
        const selected = event.target.files?.[0];
        event.target.value = '';

        if (!selected || !uploadSessionToken) {
            return;
        }

        setUploading(true);
        setError('');

        const body = new FormData();
        body.append('file', selected);
        body.append('field_key', field.key);
        body.append('upload_session_token', uploadSessionToken);

        try {
            const response = await window.axios.post(route('brief-files.store'), body, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const uploaded = { id: response.data.id, filename: response.data.filename, size: response.data.size };
            setFiles((prev) => [...prev, uploaded]);
            onChange([...ids, uploaded.id]);
        } catch (err) {
            setError(err?.response?.data?.message || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const removeFile = async (fileId) => {
        try {
            await window.axios.delete(route('brief-files.destroy', fileId), {
                data: { upload_session_token: uploadSessionToken },
            });
        } catch {
            // Best effort — still remove it from the visible list either way.
        }

        setFiles((prev) => prev.filter((f) => f.id !== fileId));
        onChange(ids.filter((id) => id !== fileId));
    };

    return (
        <div>
            <input
                type="file"
                onChange={handleFileSelect}
                disabled={disabled || uploading}
                className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-brand-dark"
            />
            {uploading && <p className="mt-1 text-xs text-gray-500">Uploading...</p>}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
            {files.length > 0 && (
                <ul className="mt-2 space-y-1">
                    {files.map((file) => (
                        <li key={file.id} className="flex items-center justify-between rounded border border-gray-200 px-2 py-1 text-xs text-gray-700">
                            <span>{file.filename}</span>
                            <button type="button" onClick={() => removeFile(file.id)} className="font-semibold text-red-600 hover:text-red-700">
                                Remove
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
