// 📥 Reçoit les webhooks d'Airtable et les diffuse via SSE

let connectedClients = new Set();
let pendingChanges = [];

export default function handler(req, res) {
    // CORS pour Airtable
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        console.log('📥 Webhook reçu d\'Airtable:', JSON.stringify(req.body, null, 2));
        
        const change = {
            id: Date.now() + Math.random(), // ID unique
            timestamp: new Date().toISOString(),
            source: 'airtable',
            table: 'generic-table',
            data: req.body
        };

        // Diffuser immédiatement aux clients connectés
        broadcastToClients(change);
        
        // Stocker pour clients non connectés
        pendingChanges.push(change);
        
        // Garder seulement les 100 derniers changements
        if (pendingChanges.length > 100) {
            pendingChanges = pendingChanges.slice(-100);
        }

        console.log(`📊 Diffusé à ${connectedClients.size} clients, ${pendingChanges.length} en attente`);

        res.status(200).json({ 
            received: true, 
            clients: connectedClients.size,
            pending: pendingChanges.length,
            timestamp: change.timestamp
        });
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}

function broadcastToClients(change) {
    connectedClients.forEach(client => {
        try {
            client.write(`data: ${JSON.stringify(change)}\n\n`);
            console.log('📡 Message envoyé à un client');
        } catch (err) {
            console.log('📱 Client déconnecté lors de l\'envoi');
            connectedClients.delete(client);
        }
    });
}

// Export pour utilisation dans stream.js
export { connectedClients, pendingChanges, broadcastToClients };