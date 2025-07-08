/**
 * URL Utilities for ESM imports
 */

import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Convert a filepath to a file URL that works with Windows paths
 * @param {string} filepath - Path to convert to a URL
 * @returns {string} URL string that can be used with import()
 */
export function toFileUrl(filepath) {
    // Windows paths need special handling
    if (process.platform === 'win32') {
        // Convert to forward slashes
        let pathWithForwardSlashes = filepath.replace(/\\/g, '/');
        
        // Ensure it has the correct format
        if (!pathWithForwardSlashes.startsWith('/')) {
            pathWithForwardSlashes = '/' + pathWithForwardSlashes;
        }
        
        return `file://${pathWithForwardSlashes}`;
    }
    
    // For other platforms
    return `file://${filepath}`;
}

/**
 * Get the directory name from a module's import.meta.url
 * @param {string} importMetaUrl - The import.meta.url value from a module
 * @returns {string} The directory path
 */
export function getDirname(importMetaUrl) {
    const __filename = fileURLToPath(importMetaUrl);
    return path.dirname(__filename);
}
