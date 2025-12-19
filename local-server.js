import express from 'express';
import fetch from 'node-fetch';
import proxyHandler from './api/proxy.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Polyfill fetch
global.fetch = fetch;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Mount the proxy handler
app.get('/api/proxy', async (req, res) => {
    try {
        await proxyHandler(req, res);
    } catch (error) {
        console.error('Local Proxy Wrapper Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

app.listen(PORT, () => {
    console.log(`Local Development Server running at http://localhost:${PORT}/`);
    console.log(`Proxy endpoint: http://localhost:${PORT}/api/proxy`);
});
