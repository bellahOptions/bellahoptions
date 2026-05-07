import { cn } from '@/lib/utils';
import { createContext, useContext, useMemo, useState } from 'react';

const TabsContext = createContext(null);

function Tabs({ value, defaultValue, onValueChange, className, children }) {
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? '');
    const activeValue = value ?? uncontrolledValue;

    const contextValue = useMemo(() => ({
        value: activeValue,
        setValue: (nextValue) => {
            if (value === undefined) {
                setUncontrolledValue(nextValue);
            }

            onValueChange?.(nextValue);
        },
    }), [activeValue, onValueChange, value]);

    return (
        <TabsContext.Provider value={contextValue}>
            <div className={cn('w-full', className)}>{children}</div>
        </TabsContext.Provider>
    );
}

function TabsList({ className, ...props }) {
    return (
        <div
            className={cn('inline-flex h-10 items-center rounded-lg border border-slate-700 bg-slate-900/80 p-1', className)}
            {...props}
        />
    );
}

function TabsTrigger({ value, className, children, ...props }) {
    const context = useContext(TabsContext);
    if (!context) {
        return null;
    }

    const isActive = context.value === value;

    return (
        <button
            type="button"
            className={cn(
                'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
                isActive ? 'bg-[#1235ff] text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                className,
            )}
            onClick={() => context.setValue(value)}
            {...props}
        >
            {children}
        </button>
    );
}

function TabsContent({ value, className, children, ...props }) {
    const context = useContext(TabsContext);
    if (!context || context.value !== value) {
        return null;
    }

    return (
        <div className={cn('mt-4', className)} {...props}>
            {children}
        </div>
    );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
