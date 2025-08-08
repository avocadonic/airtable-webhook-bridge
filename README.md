# 🚀 Airtable Webhook Bridge - SSE pour synchronisation temps réel

## 📋 Description
Bridge entre Airtable et votre serveur local via Server-Sent Events.
Permet du temps réel (0.5 seconde) sans exposer votre serveur local.

## 🏗️ Architecture
```
Airtable → Webhook → Vercel (Bridge) → SSE → Votre serveur local
```

## 📦 Déploiement Vercel

### 1. Installer Vercel CLI
```bash
npm install -g vercel
```

### 2. Déployer
```bash
cd airtable-webhook-bridge
vercel
```

### 3. Noter l'URL obtenue
Exemple: `https://your-project-name-abc123.vercel.app`

## 🔧 Configuration Airtable

### Automation Webhook:
- **Trigger**: "When record updated" 
- **Table**: Votre table Airtable (YOUR-TABLE-ID)
- **Action**: "Send webhook"
- **URL**: `https://YOUR-VERCEL-URL.vercel.app/api/webhook`
- **Method**: POST
- **Include record data**: Yes

## 🧪 Tests

### 1. Test status Vercel
```bash
curl https://YOUR-VERCEL-URL.vercel.app/api/status
```

### 2. Test webhook (simulation)
```bash
curl -X POST https://YOUR-VERCEL-URL.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true, "recordId": "test123"}'
```

## 📊 Monitoring
- **Status**: `/api/status` - Infos connexions et changements
- **Logs**: Voir dans dashboard Vercel

## 💰 Coûts
- **Vercel gratuit**: 100,000 function calls/mois
- **Usage réel**: ~60 calls/mois (1 connexion/jour × 30 jours)
- **Limite utilisée**: 0.06% → Gratuit pour l'éternité!

## 🔧 Intégration serveur local
Voir le fichier `integration-locale.md` pour adapter votre code Node.js.