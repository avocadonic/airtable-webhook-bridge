// 🧪 Script de test pour vérifier le webhook bridge

const https = require('https');

// ⚠️ REMPLACER PAR VOTRE URL VERCEL
const VERCEL_URL = 'https://your-project.vercel.app';

async function testStatus() {
    console.log('🧪 Test 1: Vérification status...');
    
    try {
        const response = await fetch(`${VERCEL_URL}/api/status`);
        const data = await response.json();
        
        console.log('✅ Status OK:');
        console.log(`   - Clients connectés: ${data.connections.active}`);
        console.log(`   - Changements en attente: ${data.changes.pending}`);
        console.log(`   - Uptime: ${Math.floor(data.uptime)}s`);
        
        return true;
    } catch (error) {
        console.error('❌ Erreur status:', error.message);
        return false;
    }
}

async function testWebhook() {
    console.log('🧪 Test 2: Simulation webhook Airtable...');
    
    const testData = {
        recordId: 'test_' + Date.now(),
        fields: {
            name: 'Test Product',
            description: 'Test depuis script',
            price: 99.99
        },
        metadata: {
            test: true,
            timestamp: new Date().toISOString()
        }
    };
    
    try {
        const response = await fetch(`${VERCEL_URL}/api/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        
        const result = await response.json();
        
        console.log('✅ Webhook OK:');
        console.log(`   - Reçu: ${result.received}`);
        console.log(`   - Clients notifiés: ${result.clients}`);
        console.log(`   - En attente: ${result.pending}`);
        
        return true;
    } catch (error) {
        console.error('❌ Erreur webhook:', error.message);
        return false;
    }
}

async function testSSEConnection() {
    console.log('🧪 Test 3: Test connexion SSE...');
    
    return new Promise((resolve) => {
        const EventSource = require('eventsource');
        const es = new EventSource(`${VERCEL_URL}/api/stream`);
        
        let messageReceived = false;
        
        es.onopen = () => {
            console.log('✅ SSE connecté');
        };
        
        es.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log(`📨 Message reçu: ${data.type}`);
            
            if (data.type === 'connected') {
                messageReceived = true;
                console.log(`   - Changements en attente: ${data.pending}`);
            }
        };
        
        es.onerror = (error) => {
            console.error('❌ Erreur SSE');
            es.close();
            resolve(false);
        };
        
        // Fermer après 5 secondes
        setTimeout(() => {
            es.close();
            console.log('🔌 SSE fermé');
            resolve(messageReceived);
        }, 5000);
    });
}

async function runAllTests() {
    console.log('🚀 Démarrage tests du bridge Airtable...\n');
    
    // Vérifier si fetch est disponible (Node 18+)
    if (typeof fetch === 'undefined') {
        console.log('⚠️  Installation node-fetch pour les tests...');
        try {
            global.fetch = (await import('node-fetch')).default;
        } catch (error) {
            console.error('❌ Erreur: Installez node-fetch ou utilisez Node.js 18+');
            console.log('   npm install node-fetch');
            process.exit(1);
        }
    }
    
    const results = [];
    
    // Test 1: Status
    results.push(await testStatus());
    console.log('');
    
    // Test 2: Webhook
    results.push(await testWebhook());
    console.log('');
    
    // Test 3: SSE
    results.push(await testSSEConnection());
    console.log('');
    
    // Résumé
    const success = results.filter(r => r).length;
    const total = results.length;
    
    console.log('📊 Résultats des tests:');
    console.log(`   - Réussis: ${success}/${total}`);
    
    if (success === total) {
        console.log('🎉 Tous les tests sont OK ! Le bridge fonctionne parfaitement.');
        console.log('💡 Vous pouvez maintenant configurer Airtable pour envoyer des webhooks.');
    } else {
        console.log('⚠️  Certains tests ont échoué. Vérifiez:');
        console.log('   1. L\'URL Vercel est correcte');
        console.log('   2. Le déploiement Vercel est actif');
        console.log('   3. La connexion internet fonctionne');
    }
}

// Lancer les tests
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = { testStatus, testWebhook, testSSEConnection };