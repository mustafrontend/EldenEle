'use client';

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';

export default function Providers({ children }) {
    return (
        <>
            {children}
            <ProgressBar
                height="4px"
                color="#4f46e5"
                options={{ showSpinner: false }}
                shallowRouting
            />
        </>
    );
}
