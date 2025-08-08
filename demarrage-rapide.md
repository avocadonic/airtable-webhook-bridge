# ⚡ Démarrage Rapide - SSE Bridge

## 🚀 Étapes simples (30 minutes)

### 1️⃣ Déployer sur Vercel (5 min)
```bash
# Installer Vercel CLI
npm install -g vercel

# Aller dans le dossier
cd airtable-webhook-bridge

# Déployer (suivre les instructions)
vercel

# Noter l'URL obtenue (ex: https://your-project-abc123.vercel.app)
```

### 2️⃣ Tester le déploiement (2 min)
```bash
# Test status
curl https://YOUR-VERCEL-URL.vercel.app/api/status

# OU utiliser le script de test
node test-webhook.js
```

### 3️⃣ Configurer Airtable (5 min)
1. **Aller dans votre base Airtable**
2. **Automations → Create Automation**
3. **Trigger**: "When record updated"  
4. **Table**: Sélectionner votre table cible
5. **Action**: "Send webhook"
6. **URL**: `https://YOUR-VERCEL-URL.vercel.app/api/webhook`
7. **Method**: POST
8. **Include record data**: ✅ Yes
9. **Save & Turn on**

### 4️⃣ Adapter votre serveur local (15 min)

#### A. Installer dépendance
```bash
cd votre-projet-principal
npm install eventsource
```

#### B. Copier le fichier SSE
Copier le contenu de `integration-locale.md` dans votre projet.

#### C. Modifier votre server.js
Ajouter ces lignes:
```javascript
const { SSEManager } = require('./lib/sync/sseSync');

// ⚠️ REMPLACER PAR VOTRE URL VERCEL
const VERCEL_URL = 'https://YOUR-VERCEL-URL.vercel.app';

const sseManager = new SSEManager(VERCEL_URL);
sseManager.start();

process.on('SIGINT', () => {
    sseManager.stop();
    process.exit(0);
});
```

### 5️⃣ Test final (3 min)
```bash
# Démarrer votre serveur
npm run dev

# Dans un autre terminal, simuler un changement
curl -X POST https://YOUR-VERCEL-URL.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true, "recordId": "test123"}'

# Ou modifier directement un record dans Airtable
```

## 🎯 Résultat attendu

### Dans vos logs serveur vous devriez voir:
```
🔌 Connexion SSE vers Vercel...
✅ SSE connecté avec succès !
🎉 SSE connecté ! 0 changements en attente
💓 Heartbeat SSE (1 clients, uptime: 45s)
🔥 Changement Airtable détecté via SSE !
⚡ Déclenchement sync...
✅ Sync terminé avec succès
```

## 🎉 C'est tout !

**De 15 minutes de latence → 30 secondes !**

## 🔧 Dépannage rapide

### ❌ "SSE connecté mais pas de messages"
- Vérifier l'automation Airtable est activée
- Tester avec le webhook manuel (curl)

### ❌ "Impossible de se connecter à Vercel"
- Vérifier l'URL Vercel
- Tester `/api/status` dans le navigateur

### ❌ "EventSource not found"
- `npm install eventsource`
- Vérifier l'import dans sseSync.js

### ❌ "Sync ne se déclenche pas"  
- Vérifier que votre fonction sync est bien importée
- Regarder les logs d'erreur détaillés

## 📱 Monitoring

### Status en temps réel:
- **Web**: `https://YOUR-VERCEL-URL.vercel.app/api/status`
- **JSON**: Infos connexions, changements, uptime

### Logs Vercel:
- Dashboard Vercel → Votre projet → Functions tab
- Voir les logs en temps réel

## 🎯 Prochaines étapes

Une fois que ça marche pour votre première table:
1. **Appliquer à d'autres tables** (même principe)
2. **Supprimer l'ancien polling** 
3. **Profiter du temps réel** ⚡