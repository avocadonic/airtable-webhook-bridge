// 📊 Debug et monitoring du bridge

import { connectedClients, pendingChanges } from './webhook.js';

export default function handler(req, res) {
    const status = {
        status: 'active',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        
        // Statistiques connexions
        connections: {
            active: connectedClients.size,
            details: connectedClients.size > 0 ? 'Clients connectés' : 'Aucun client connecté'
        },
        
        // Statistiques changements
        changes: {
            pending: pendingChanges.length,
            latest: pendingChanges.length > 0 ? pendingChanges[pendingChanges.length - 1] : null
        },
        
        // Info système
        system: {
            memory: process.memoryUsage(),
            nodeVersion: process.version,
            platform: process.platform
        },
        
        // URLs utiles
        endpoints: {
            webhook: '/api/webhook',
            stream: '/api/stream',
            status: '/api/status'
        }
    };

    // Headers pour éviter le cache
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    res.status(200).json(status);
}