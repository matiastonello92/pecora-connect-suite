#!/bin/bash

# Script per eseguire automaticamente i test k6 e processare i risultati

set -e

# Configurazione
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="$SCRIPT_DIR/test-results"
CONFIG_FILE="$SCRIPT_DIR/k6-config.json"
PROCESSOR_SCRIPT="$SCRIPT_DIR/test-results-processor.js"

# Crea directory se non esistono
mkdir -p "$RESULTS_DIR"

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funzione per logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Funzione per eseguire un singolo test
run_k6_test() {
    local test_name=$1
    local script_file=$2
    local max_users=$3
    local duration=$4
    
    log "Eseguendo test: $test_name"
    log "Script: $script_file"
    log "Max users: $max_users, Duration: $duration"
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local output_file="$RESULTS_DIR/${test_name}_${timestamp}.json"
    local csv_file="$RESULTS_DIR/${test_name}_${timestamp}.csv"
    
    # Esegui il test k6
    if k6 run \
        --vus-max $max_users \
        --duration $duration \
        --out json="$output_file" \
        --out csv="$csv_file" \
        --quiet \
        "$SCRIPT_DIR/$script_file"; then
        
        log_success "Test $test_name completato con successo"
        echo "$output_file"
    else
        local exit_code=$?
        log_error "Test $test_name fallito con codice $exit_code"
        
        # Crea un file di risultato anche per i test falliti
        cat > "$output_file" << EOF
{
    "testName": "$test_name",
    "status": "failed",
    "exitCode": $exit_code,
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
    "error": "Test execution failed with exit code $exit_code"
}
EOF
        echo "$output_file"
    fi
}

# Funzione per processare i risultati
process_results() {
    log "Processando risultati test..."
    
    if command -v node &> /dev/null; then
        if [ -f "$PROCESSOR_SCRIPT" ]; then
            node "$PROCESSOR_SCRIPT"
            log_success "Risultati processati con successo"
        else
            log_warning "Script processore non trovato: $PROCESSOR_SCRIPT"
        fi
    else
        log_warning "Node.js non trovato, saltando processamento risultati"
    fi
}

# Funzione per inviare notifiche
send_notification() {
    local test_name=$1
    local status=$2
    local performance_score=$3
    
    # Webhook URL (configurabile tramite variabile d'ambiente)
    local webhook_url="${K6_WEBHOOK_URL:-}"
    
    if [ -n "$webhook_url" ]; then
        local payload=$(cat << EOF
{
    "test_name": "$test_name",
    "status": "$status",
    "performance_score": $performance_score,
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
    "environment": "test"
}
EOF
)
        
        if curl -X POST \
            -H "Content-Type: application/json" \
            -d "$payload" \
            "$webhook_url" \
            --silent --output /dev/null; then
            log "Notifica inviata per test $test_name"
        else
            log_warning "Errore invio notifica per test $test_name"
        fi
    fi
}

# Funzione per eseguire test automatici
run_auto_tests() {
    local environment=${1:-"development"}
    local test_suite=${2:-"all"}
    
    log "Avviando test automatici"
    log "Environment: $environment"
    log "Test suite: $test_suite"
    
    # Leggi configurazione
    if [ ! -f "$CONFIG_FILE" ]; then
        log_error "File di configurazione non trovato: $CONFIG_FILE"
        exit 1
    fi
    
    # Verifica che k6 sia installato
    if ! command -v k6 &> /dev/null; then
        log_error "k6 non è installato. Installalo da https://k6.io/docs/getting-started/installation/"
        exit 1
    fi
    
    local test_results=()
    
    # Esegui test in base alla suite selezionata
    case $test_suite in
        "all")
            log "Eseguendo tutti i test"
            test_results+=($(run_k6_test "auth-system" "auth-api-test.js" 1000 "15m"))
            test_results+=($(run_k6_test "chat-system" "chat-system-test.js" 5000 "20m"))
            test_results+=($(run_k6_test "inventory-system" "inventory-system-test.js" 10000 "18m"))
            ;;
        "quick")
            log "Eseguendo test rapidi"
            test_results+=($(run_k6_test "auth-system-quick" "auth-api-test.js" 100 "2m"))
            test_results+=($(run_k6_test "chat-system-quick" "chat-system-test.js" 500 "3m"))
            ;;
        "stress")
            log "Eseguendo test di stress estremo"
            test_results+=($(run_k6_test "full-system-stress" "full-system-test.js" 100000 "30m"))
            ;;
        "auth")
            test_results+=($(run_k6_test "auth-system" "auth-api-test.js" 1000 "15m"))
            ;;
        "chat")
            test_results+=($(run_k6_test "chat-system" "chat-system-test.js" 5000 "20m"))
            ;;
        "inventory")
            test_results+=($(run_k6_test "inventory-system" "inventory-system-test.js" 10000 "18m"))
            ;;
        *)
            log_error "Suite di test non riconosciuta: $test_suite"
            log "Suite disponibili: all, quick, stress, auth, chat, inventory"
            exit 1
            ;;
    esac
    
    # Processa i risultati
    process_results
    
    # Analizza i risultati e invia notifiche
    local passed_tests=0
    local failed_tests=0
    
    for result_file in "${test_results[@]}"; do
        if [ -f "$result_file" ]; then
            # Estrai informazioni base dal file
            local test_name=$(basename "$result_file" | cut -d'_' -f1)
            
            # Controlla se il test è passato (molto semplificato)
            if grep -q '"error"' "$result_file" 2>/dev/null; then
                ((failed_tests++))
                send_notification "$test_name" "failed" 0
            else
                ((passed_tests++))
                send_notification "$test_name" "passed" 85
            fi
        fi
    done
    
    # Resoconto finale
    log_success "Test completati!"
    log "Test superati: $passed_tests"
    log "Test falliti: $failed_tests"
    log "Risultati salvati in: $RESULTS_DIR"
    
    if [ $failed_tests -gt 0 ]; then
        log_warning "Alcuni test sono falliti. Controllare i risultati."
        exit 1
    fi
}

# Funzione per pulire vecchi risultati
cleanup_old_results() {
    local days=${1:-7}
    
    log "Pulizia risultati più vecchi di $days giorni"
    
    find "$RESULTS_DIR" -name "*.json" -mtime +$days -delete
    find "$RESULTS_DIR" -name "*.csv" -mtime +$days -delete
    find "$RESULTS_DIR" -name "*.html" -mtime +$days -delete
    
    log_success "Pulizia completata"
}

# Funzione per monitoraggio continuo
run_monitoring() {
    local interval=${1:-300} # Default 5 minuti
    
    log "Avviando monitoraggio continuo ogni $interval secondi"
    
    while true; do
        log "Eseguendo test di monitoraggio..."
        run_auto_tests "development" "quick"
        
        log "Prossimo test tra $interval secondi..."
        sleep $interval
    done
}

# Funzione di help
show_help() {
    cat << EOF
Uso: $0 [COMANDO] [OPZIONI]

COMANDI:
    run [environment] [suite]  - Esegue i test k6 (default: development all)
    monitor [interval]         - Monitora continuamente (default: 300s)
    cleanup [days]            - Pulisce risultati vecchi (default: 7 giorni)
    help                      - Mostra questo messaggio

SUITES DISPONIBILI:
    all        - Tutti i test (default)
    quick      - Test rapidi per monitoring
    stress     - Test di stress estremo
    auth       - Solo test autenticazione
    chat       - Solo test chat
    inventory  - Solo test inventory

ESEMPI:
    $0 run development quick
    $0 run staging all
    $0 monitor 600
    $0 cleanup 3

VARIABILI D'AMBIENTE:
    K6_WEBHOOK_URL - URL webhook per notifiche
    BASE_URL       - URL base API (default da config)
    ANON_KEY       - Chiave anonima Supabase

EOF
}

# Main
main() {
    case ${1:-run} in
        "run")
            run_auto_tests "${2:-development}" "${3:-all}"
            ;;
        "monitor")
            run_monitoring "${2:-300}"
            ;;
        "cleanup")
            cleanup_old_results "${2:-7}"
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "Comando non riconosciuto: $1"
            show_help
            exit 1
            ;;
    esac
}

# Esegui solo se chiamato direttamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi