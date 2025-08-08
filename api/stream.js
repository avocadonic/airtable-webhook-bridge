// 📡 Stream en temps réel vers votre serveur local

import { connectedClients, pendingChanges } from './webhook.js';

export default function handler(req, res) {
    console.log('🔌 Nouvelle connexion SSE');

    // Configuration SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Ajouter ce client
    connectedClients.add(res);
    console.log(`✅ Client connecté (${connectedClients.size} total)`);

    // Message de bienvenue
    const welcomeMessage = {
        type: 'connected',
        timestamp: new Date().toISOString(),
        pending: pendingChanges.length,
        message: 'SSE connecté avec succès'
    };
    
    res.write(`data: ${JSON.stringify(welcomeMessage)}\n\n`);

    // Envoyer changements en attente
    if (pendingChanges.length > 0) {
        console.log(`📤 Envoi de ${pendingChanges.length} changements en attente`);
        pendingChanges.forEach(change => {
            res.write(`data: ${JSON.stringify(change)}\n\n`);
        });
        
        // Vider les changements envoyés
        pendingChanges.length = 0;
    }

    // Heartbeat toutes les 30 secondes
    const heartbeat = setInterval(() => {
        try {
            const heartbeatMessage = {
                type: 'heartbeat',
                timestamp: new Date().toISOString(),
                clients: connectedClients.size,
                uptime: process.uptime()
            };
            res.write(`data: ${JSON.stringify(heartbeatMessage)}\n\n`);
        } catch (err) {
            console.log('💔 Erreur heartbeat, client déconnecté');
            clearInterval(heartbeat);
            connectedClients.delete(res);
        }
    }, 30000);

    // Nettoyage à la déconnexion
    req.on('close', () => {
        console.log(`📱 Client déconnecté (${connectedClients.size - 1} restants)`);
        clearInterval(heartbeat);
        connectedClients.delete(res);
    });

    req.on('error', (err) => {
        console.log('❌ Erreur connexion SSE:', err.message);
        clearInterval(heartbeat);
        connectedClients.delete(res);
    });
}