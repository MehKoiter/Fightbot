/**
 * Database Service - Centralized database access layer
 * Provides consistent interface for data storage
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import BaseService from './baseService.js';

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseService extends BaseService {
    constructor() {
        super();
        this.dataDir = path.join(__dirname, '..', '..', 'data');
        this.databases = new Map();
    }

    /**
     * Initialize the database service
     * @returns {Promise<void>}
     */
    async init() {
        // Ensure data directory exists
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }

        this.initialized = true;
        console.log('✅ Database service initialized');
    }

    /**
     * Get or create a database collection
     * @param {string} name - Collection name
     * @returns {Map} - Collection instance
     */
    getCollection(name) {
        if (!this.initialized) {
            throw new Error('Database service not initialized');
        }

        if (!this.databases.has(name)) {
            this.databases.set(name, this._loadCollection(name));
        }

        return this.databases.get(name);
    }

    /**
     * Load a collection from file
     * @param {string} name - Collection name
     * @returns {Map} - Collection instance
     * @private
     */
    _loadCollection(name) {
        const filePath = path.join(this.dataDir, `${name}.json`);
        let data = new Map();

        try {
            if (fs.existsSync(filePath)) {
                const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                data = new Map(Object.entries(fileData));
            }
        } catch (error) {
            console.error(`Error loading collection ${name}:`, error);
        }

        return data;
    }

    /**
     * Save a collection to file
     * @param {string} name - Collection name
     * @returns {Promise<void>}
     */
    async saveCollection(name) {
        if (!this.initialized) {
            throw new Error('Database service not initialized');
        }

        if (!this.databases.has(name)) {
            return;
        }

        const filePath = path.join(this.dataDir, `${name}.json`);
        const collection = this.databases.get(name);
        
        try {
            const data = Object.fromEntries(collection);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error(`Error saving collection ${name}:`, error);
            throw error;
        }
    }

    /**
     * Get an item from a collection
     * @param {string} collection - Collection name
     * @param {string} id - Item ID
     * @param {*} defaultValue - Default value if not found
     * @returns {*} - Item data
     */
    get(collection, id, defaultValue = null) {
        const col = this.getCollection(collection);
        return col.has(id) ? col.get(id) : defaultValue;
    }

    /**
     * Set an item in a collection
     * @param {string} collection - Collection name
     * @param {string} id - Item ID
     * @param {*} data - Item data
     * @param {boolean} save - Whether to save to disk immediately
     * @returns {Promise<void>}
     */
    async set(collection, id, data, save = true) {
        const col = this.getCollection(collection);
        col.set(id, data);

        if (save) {
            await this.saveCollection(collection);
        }
    }

    /**
     * Delete an item from a collection
     * @param {string} collection - Collection name
     * @param {string} id - Item ID
     * @param {boolean} save - Whether to save to disk immediately
     * @returns {Promise<boolean>} - Whether the item was deleted
     */
    async delete(collection, id, save = true) {
        const col = this.getCollection(collection);
        const result = col.delete(id);

        if (save && result) {
            await this.saveCollection(collection);
        }

        return result;
    }

    /**
     * Get all items in a collection
     * @param {string} collection - Collection name
     * @returns {Array} - All items
     */
    getAll(collection) {
        const col = this.getCollection(collection);
        return Array.from(col.values());
    }
}

export default DatabaseService;
