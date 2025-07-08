/**
 * Path Utilities for ESM Imports
 * Helps with cross-platform path handling in ESM modules
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { platform } from 'node:os';

/**
 * Convert a file path to a file URL that works with ESM imports
 * @param {string} filePath - Absolute file path to convert
 * @returns {string} File URL compatible with ESM imports
 */
export function pathToFileUrl(filePath) {
    // For Windows, need to ensure the path starts with a drive letter and uses proper separators
    if (platform() === 'win32') {
        // Normalize path separators to forward slashes
        const normalizedPath = filePath.replace(/\\/g, '/');
        
        // Make sure it starts with a drive letter
        if (/^[a-zA-Z]:/.test(normalizedPath)) {
            return `file:///${normalizedPath}`;
        }
    }
    
    // Handle existing file URLs
    if (filePath.startsWith('file://')) {
        return filePath;
    }
    
    // For non-Windows platforms, or if the path doesn't start with a drive letter
    return new URL(`file://${filePath}`).href;
}

/**
 * Get directory name for the current module
 * @param {string} importMetaUrl - import.meta.url from the calling module
 * @returns {string} The directory name
 */
export function getDirname(importMetaUrl) {
    const __filename = fileURLToPath(importMetaUrl);
    return path.dirname(__filename);
}

/**
 * Join paths and convert to a file URL
 * @param {string} base - Base directory path
 * @param  {...string} parts - Path parts to join
 * @returns {string} File URL for the joined path
 */
export function joinPathToFileUrl(base, ...parts) {
    const fullPath = path.join(base, ...parts);
    return pathToFileUrl(fullPath);
}

/**
 * Create a module loader function that handles path resolution
 * @param {string} baseDir - Base directory to resolve from
 * @returns {Function} A function that loads modules with proper path resolution
 */
export function createModuleLoader(baseDir) {
    return async function loadModule(relativePath) {
        const fileUrl = joinPathToFileUrl(baseDir, relativePath);
        return import(fileUrl);
    };
}

export default {
    pathToFileUrl,
    getDirname,
    joinPathToFileUrl,
    createModuleLoader
};
