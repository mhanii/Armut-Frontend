'use client';

import { useState, useEffect } from 'react';

function useLocalStorageState(key, defaultValue) {
    const getInitial = () => {
        if (typeof window === 'undefined') return defaultValue;
        const item = window.localStorage.getItem(key);
        if (item !== null) {
            try {
                return JSON.parse(item);
            } catch {
                return defaultValue;
            }
        }
        return defaultValue;
    };
    const [state, setState] = useState(getInitial);

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(state));
    }, [key, state]);

    return [state, setState];
}

export default useLocalStorageState; 