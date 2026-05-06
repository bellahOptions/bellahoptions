import { useState } from 'react';
import StaffLiveChatWorkspace from '@/Components/live-chat/StaffLiveChatWorkspace';

export default function StaffLiveChatDock() {
    const [open, setOpen] = useState(false);

    return (
        <div className="fixed bottom-5 right-5 z-[70]">
            <div
                className={`mb-3 h-[min(78vh,640px)] w-[min(95vw,980px)] ${open ? '' : 'pointer-events-none hidden'}`}
                aria-hidden={!open}
            >
                <StaffLiveChatWorkspace compact className="h-full" />
            </div>

            <button
                type="button"
                onClick={() => setOpen((previous) => !previous)}
                className="inline-flex items-center gap-2 rounded-full bg-[#000285] px-4 py-3 text-sm font-bold text-white shadow-xl shadow-blue-900/30 transition hover:bg-blue-800"
                aria-label={open ? 'Hide staff chat panel' : 'Open staff chat panel'}
            >
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${open ? 'bg-emerald-300' : 'bg-white/80'}`} />
                {open ? 'Hide Live Chat' : 'Live Chat'}
            </button>
        </div>
    );
}
