const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
console.log(BASE_URL)
class APIError extends Error {
    constructor(message, status, path, data) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.path = path;
        this.data = data;
    }
}

/**
 * A wrapper around the fetch API.
 * @param {string} path The path to the API endpoint.
 * @param {object} options The options for the fetch request.
 * @returns {Promise<any>} The response from the API.
 */
async function http(path, options = {}) {
    // Get the auth token from localStorage
    const userString = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    const user = userString ? JSON.parse(userString) : null;
    const token = user?.token;

    const defaultHeaders = {
        'Content-Type': 'application/json',
    };
    
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const mergedOptions = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(`${BASE_URL}${path}`, mergedOptions);
        let data = undefined;
        let parseError = false;
        if (response.status !== 204) {
            try {
                data = await response.json();
            } catch (e) {
                data = null;
                parseError = true;
            }
        }
        if (!response.ok) {
            const message = (data && data.message) || response.statusText || 'An unknown error occurred';
            console.error(`API Error: ${message} (status: ${response.status}, path: ${path})`);
            throw new APIError(message, response.status, path, data);
        }
        if (parseError) {
            // Warn if JSON parsing failed but response was ok
            console.warn(`Warning: Failed to parse JSON for ${path} (status: ${response.status})`);
        }
        return data;
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        // Network or unexpected error
        console.error(`HTTP Error: ${error.message} (path: ${path})`);
        throw new APIError(error.message, null, path, null);
    }
}

export default http; 