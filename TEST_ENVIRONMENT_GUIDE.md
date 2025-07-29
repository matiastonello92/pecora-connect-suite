# 🧪 Guida Completa Ambiente di Test - Management PN

## 📋 Panoramica

Questa guida fornisce istruzioni complete per configurare e gestire un ambiente di test separato per Management PN su `test.managementpn.services`.

## 🎯 Obiettivi dell'Ambiente di Test

- **Isolamento completo** dai dati di produzione
- **Testing sicuro** di nuove funzionalità
- **Validazione delle performance** con dati realistici
- **Automazione del testing** CI/CD
- **Monitoraggio dedicato** delle performance

## 🏗️ Architettura dell'Ambiente

```
test.managementpn.services
├── Frontend React App (Vite)
├── Supabase Test Project
│   ├── PostgreSQL Database
│   ├── Edge Functions
│   ├── Authentication
│   └── Storage
├── Nginx Reverse Proxy
├── Docker Containers
└── Monitoring Stack
    ├── Prometheus
    ├── Grafana
    └── AlertManager
```

## 🚀 Setup Rapido

### 1. Configurazione Iniziale

```bash
# Clona il repository e naviga nella directory
cd management-pn

# Esegui lo script di setup
chmod +x scripts/setup-test-environment.sh
./scripts/setup-test-environment.sh
```

### 2. Configurazione Supabase Test

1. **Crea un nuovo progetto Supabase** per l'ambiente test:
   - Vai su [supabase.com](https://supabase.com)
   - Crea un nuovo progetto con nome "management-pn-test"
   - Salva il Project ID e l'anon key

2. **Aggiorna le configurazioni**:
   ```bash
   # Modifica .env.test
   nano .env.test
   
   # Sostituisci:
   VITE_SUPABASE_URL=https://YOUR_TEST_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_TEST_ANON_KEY
   ```

3. **Migra il database**:
   ```bash
   # Copia le migrazioni dal progetto produzione
   npx supabase link --project-ref YOUR_TEST_PROJECT_ID
   npx supabase db push
   ```

### 3. Configurazione DNS

Aggiungi questi record DNS al tuo provider:

```
Type: A
Name: test
Value: YOUR_SERVER_IP
TTL: 300

Type: CNAME
Name: *.test
Value: test.managementpn.services
TTL: 300
```

### 4. Configurazione SSL

```bash
# Installa Certbot se non presente
sudo apt install certbot python3-certbot-nginx

# Genera certificato SSL
sudo certbot --nginx -d test.managementpn.services

# Verifica auto-renewal
sudo certbot renew --dry-run
```

## 🛠️ Configurazione Dettagliata

### Configurazione Nginx

```nginx
# /etc/nginx/sites-available/test.managementpn.services
server {
    listen 80;
    server_name test.managementpn.services;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name test.managementpn.services;

    ssl_certificate /etc/letsencrypt/live/test.managementpn.services/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/test.managementpn.services/privkey.pem;

    # Headers di sicurezza
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Environment "test" always;

    location / {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Abilita il sito
sudo ln -s /etc/nginx/sites-available/test.managementpn.services /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Configurazione Database Test

1. **Seed dei dati di test**:
   ```bash
   # Popola con dati base
   node scripts/seed-test-data.js
   
   # Oppure usa l'edge function per popolamento automatico
   curl -X POST https://YOUR_TEST_PROJECT_ID.supabase.co/functions/v1/test-data-seeder \
     -H "apikey: YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"type": "all", "count": 1000, "clear": true}'
   ```

2. **Dati di performance testing**:
   ```bash
   # Genera 10,000 località per test di carico
   curl -X POST https://YOUR_TEST_PROJECT_ID.supabase.co/functions/v1/test-data-seeder \
     -H "apikey: YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"type": "performance", "clear": true}'
   ```

### Configurazione Servizi Esterni

#### Resend (Email Service)

1. Crea un account separato per test su [resend.com](https://resend.com)
2. Configura il dominio `test.managementpn.services`
3. Genera API key per l'ambiente test
4. Aggiungi la chiave in Supabase Edge Functions secrets

#### Monitoring e Alerting

1. **Prometheus**:
   ```bash
   docker-compose -f monitoring/test-monitoring.yml up -d prometheus-test
   ```

2. **Grafana**:
   ```bash
   docker-compose -f monitoring/test-monitoring.yml up -d grafana-test
   # Accesso: http://localhost:3001 (admin/test_admin_password)
   ```

## 🧪 Testing e QA

### Testing Automatizzato

1. **Unit Tests**:
   ```bash
   npm run test
   ```

2. **Integration Tests**:
   ```bash
   npm run test:integration
   ```

3. **End-to-End Tests**:
   ```bash
   npm run test:e2e
   ```

### Load Testing con K6

```bash
# Test di carico leggero
k6 run k6-load-test.js --env ENVIRONMENT=test

# Test di carico pesante (100k utenti)
k6 run k6-load-test.js \
  --vus 100000 \
  --duration 10m \
  --env ENVIRONMENT=test \
  --env API_BASE_URL=https://test.managementpn.services
```

### Performance Testing

```bash
# Test delle query di località (target: <200ms)
k6 run k6-load-test.js --env TEST_TYPE=locations

# Test del cambio località (target: <100ms)  
k6 run k6-load-test.js --env TEST_TYPE=location_switch

# Test dashboard (target: <300ms)
k6 run k6-load-test.js --env TEST_TYPE=dashboard

# Test chat WebSocket (target: <150ms latency)
k6 run k6-load-test.js --env TEST_TYPE=chat
```

## 🚀 Deployment

### Build e Deploy

```bash
# Build per l'ambiente test
npm run build:test

# Deploy automatico
npm run deploy:test

# Deploy manuale con Docker
docker-compose -f docker-compose.test.yml up -d --build
```

### Pipeline CI/CD

Il deployment automatico si attiva su:
- Push al branch `test`
- Pull request verso `main`
- Schedule notturno per test di regressione

```yaml
# .github/workflows/test-deployment.yml
name: Test Environment Deployment

on:
  push:
    branches: [ test ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * *'  # Ogni notte alle 2:00

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test
      
      - name: Build for test
        run: npm run build:test
      
      - name: Deploy to test
        run: npm run deploy:test
      
      - name: Run smoke tests
        run: npm run test:smoke
```

## 📊 Monitoraggio

### Metriche Chiave

1. **Performance**:
   - Tempo risposta API < 200ms
   - Cambio località < 100ms
   - Caricamento dashboard < 300ms
   - Latenza chat < 150ms

2. **Disponibilità**:
   - Uptime > 99.9%
   - Success rate > 99.9%
   - Error rate < 0.1%

3. **Risorse**:
   - CPU usage < 80%
   - Memory usage < 85%
   - Disk usage < 90%

### Dashboard Grafana

Accedi a Grafana: http://localhost:3001

Dashboard disponibili:
- **Application Performance**: Metriche applicazione
- **Infrastructure**: Risorse server
- **Database**: Performance database
- **User Experience**: Metriche UX

### Alerting

Configurazione alert in `monitoring/alertmanager.test.yml`:

```yaml
route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'test-alerts'

receivers:
- name: 'test-alerts'
  webhook_configs:
  - url: 'https://test.managementpn.services/api/alerts'
    send_resolved: true
```

## 🔒 Sicurezza

### Isolamento Dati

- **Database separato**: Progetto Supabase dedicato
- **API Keys separate**: Chiavi API diverse per ogni servizio
- **Autenticazione isolata**: JWT e sessioni separate
- **Storage separato**: Bucket S3 dedicati

### Accesso Limitato

```sql
-- Policy esempio per limitare accesso ai dati test
CREATE POLICY "test_data_access" ON public.profiles
FOR ALL USING (
  auth.jwt() ->> 'email' LIKE '%@managementpn.services'
  AND (
    location = ANY(get_user_locations())
    OR location LIKE 'test_%'
  )
);
```

### Backup e Recovery

```bash
# Backup automatico database test
npx supabase db dump --file backup-test-$(date +%Y%m%d).sql

# Restore da backup
npx supabase db reset
npx supabase db push
```

## 🔧 Troubleshooting

### Problemi Comuni

1. **SSL Certificate Error**:
   ```bash
   sudo certbot renew
   sudo systemctl reload nginx
   ```

2. **Database Connection Issues**:
   ```bash
   # Verifica connessione Supabase
   curl -H "apikey: YOUR_ANON_KEY" \
        https://YOUR_PROJECT_ID.supabase.co/rest/v1/profiles?select=*&limit=1
   ```

3. **Performance Issues**:
   ```bash
   # Analizza performance database
   echo "SELECT * FROM pg_stat_activity;" | npx supabase db remote-ssh
   
   # Controlla log applicazione
   docker-compose -f docker-compose.test.yml logs app-test
   ```

4. **DNS Issues**:
   ```bash
   # Verifica risoluzione DNS
   nslookup test.managementpn.services
   dig test.managementpn.services
   ```

### Log Analysis

```bash
# Log applicazione
tail -f /var/log/managementpn-test/app.log

# Log Nginx
tail -f /var/log/nginx/test.managementpn.services.access.log

# Log Docker
docker-compose -f docker-compose.test.yml logs -f
```

## 📞 Supporto

### Contatti

- **Email**: test-support@managementpn.services
- **Slack**: #test-environment
- **Documentazione**: https://docs.managementpn.services/test

### Status Page

Monitora lo stato dell'ambiente: https://status.managementpn.services

### Escalation

1. **Livello 1**: Developer → Self-service tramite dashboard
2. **Livello 2**: Team Lead → Investigazione avanzata
3. **Livello 3**: DevOps → Intervention infrastruttura

## 📈 Roadmap

### Q1 2024
- [ ] Implementazione testing automatizzato completo
- [ ] Ottimizzazione performance database
- [ ] Integrazione con tool di monitoring avanzati

### Q2 2024
- [ ] Blue-green deployment
- [ ] Testing di sicurezza automatizzato
- [ ] Disaster recovery testing

### Q3 2024
- [ ] AI-powered testing
- [ ] Chaos engineering
- [ ] Advanced performance profiling

---

## 📝 Note Aggiuntive

- Tutti i dati nell'ambiente test vengono resettati ogni settimana
- I backup sono mantenuti per 30 giorni
- L'accesso è limitato al team di sviluppo
- Monitoraggio 24/7 con alert automatici

**Ultimo aggiornamento**: Gennaio 2024  
**Versione documento**: 1.0  
**Maintainer**: DevOps Team