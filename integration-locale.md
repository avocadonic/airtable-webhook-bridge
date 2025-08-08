# 🔧 Intégration avec votre serveur local

## 📦 Installation dépendance
```bash
cd votre-projet-principal
npm install eventsource
```

## 📝 Créer `lib/sync/sseSync.js`

```javascript
const EventSource = require('eventsource');
const { syncYourTable } = require('./yourTableSync'); // Remplacer par votre logique

class SSEManager {
    constructor(vercelUrl) {
        this.vercelUrl = vercelUrl;
        this.eventSource = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Commence à 1 seconde
    }

    start() {
        console.log('🔌 Connexion SSE vers Vercel...');
        
        this.eventSource = new EventSource(`${this.vercelUrl}/api/stream`);

        this.eventSource.onopen = () => {
            console.log('✅ SSE connecté avec succès !');
            this.reconnectAttempts = 0;
            this.reconnectDelay = 1000; // Reset delay
        };

        this.eventSource.onmessage = async (event) => {
            try {
                const data = JSON.parse(event.data);
                await this.handleMessage(data);
            } catch (error) {
                console.error('❌ Erreur traitement message SSE:', error);
            }
        };

        this.eventSource.onerror = (error) => {
            console.log('⚠️ Erreur SSE, tentative de reconnexion...');
            this.reconnect();
        };
    }

    async handleMessage(data) {
        switch (data.type) {
            case 'connected':
                console.log(`🎉 SSE connecté ! ${data.pending} changements en attente`);
                break;

            case 'heartbeat':
                console.log(`💓 Heartbeat SSE (${data.clients} clients, uptime: ${Math.floor(data.uptime)}s)`);
                break;

            default:
                // Changement Airtable
                if (data.source === 'airtable' && data.table === 'generic-table') {
                    console.log('🔥 Changement Airtable détecté via SSE !');
                    console.log('📋 Données:', JSON.stringify(data.data, null, 2));
                    await this.processTableChange(data);
                }
                break;
        }
    }

    async processTableChange(changeData) {
        try {
            console.log('⚡ Déclenchement sync...');
            
            // Option 1: Sync complet rapide (recommandé pour commencer)
            await syncYourTable('incremental', 10, 'sse-webhook');
            
            // Option 2: Sync spécifique si vous voulez optimiser plus tard
            // const recordId = changeData.data?.recordId;
            // if (recordId) {
            //     await syncYourTable('incremental', null, 'sse-webhook', null, recordId);
            // }
            
            console.log('✅ Sync terminé avec succès');
            
        } catch (error) {
            console.error('❌ Erreur sync:', error);
        }
    }

    reconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            
            console.log(`🔄 Reconnexion SSE dans ${this.reconnectDelay/1000}s (tentative ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            setTimeout(() => {
                this.stop();
                this.start();
            }, this.reconnectDelay);
            
            // Augmenter le délai pour la prochaine fois (backoff exponentiel)
            this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Max 30 secondes
            
        } else {
            console.error('❌ Échec reconnexion SSE après 5 tentatives');
            console.log('💡 Redémarrez le serveur pour réessayer');
        }
    }

    stop() {
        if (this.eventSource) {
            console.log('🛑 Fermeture connexion SSE');
            this.eventSource.close();
            this.eventSource = null;
        }
    }

    // Méthode utilitaire pour tester la connexion
    async testConnection() {
        try {
            const response = await fetch(`${this.vercelUrl}/api/status`);
            const status = await response.json();
            console.log('🧪 Test connexion Vercel:', status);
            return true;
        } catch (error) {
            console.error('❌ Test connexion échoué:', error.message);
            return false;
        }
    }
}

module.exports = { SSEManager };
```

## 🔧 Modifier votre `server.js`

Ajouter après vos imports existants:
```javascript
const { SSEManager } = require('./lib/sync/sseSync');
```

Ajouter après le démarrage de votre serveur:
```javascript
// 🚀 Configuration SSE pour votre table
const VERCEL_URL = 'https://YOUR-VERCEL-URL.vercel.app'; // ⚠️ REMPLACER PAR VOTRE URL

// Initialiser et démarrer SSE
console.log('🚀 Initialisation SSE...');
const sseManager = new SSEManager(VERCEL_URL);

// Test de connexion d'abord
sseManager.testConnection().then(success => {
    if (success) {
        console.log('✅ Test Vercel OK, démarrage SSE...');
        sseManager.start();
    } else {
        console.error('❌ Impossible de joindre Vercel, vérifiez l\'URL');
    }
});

// Arrêt propre du SSE
process.on('SIGINT', () => {
    console.log('🛑 Arrêt du serveur...');
    sseManager.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 Arrêt du serveur (TERM)...');
    sseManager.stop();
    process.exit(0);
});
```

## 🧪 Test rapide

Pour tester si tout fonctionne:
```javascript
// Test webhook manuel (dans votre terminal)
curl -X POST https://YOUR-VERCEL-URL.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true, "recordId": "test123", "fields": {"name": "Test"}}'

// Vous devriez voir dans vos logs serveur:
// 🔥 Changement Airtable détecté via SSE !
// ⚡ Déclenchement sync...
```

## ⚙️ Configuration avancée (optionnel)

Si vous voulez plus de contrôle, vous pouvez créer un fichier de config:
```javascript
// config/sse.js
module.exports = {
    vercelUrl: process.env.VERCEL_URL || 'https://your-url.vercel.app',
    reconnectAttempts: 5,
    syncOnConnect: true,
    syncLimit: 10, // Limite records pour sync rapide
    logLevel: 'info' // debug, info, warn, error
};
```