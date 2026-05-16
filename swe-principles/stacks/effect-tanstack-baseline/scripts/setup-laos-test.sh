#!/bin/bash
/**
 * LAOS Stack Setup and Sentry Integration Test
 * 
 * Purpose: Clone, start, and verify LAOS stack with Sentry + OTEL integration.
 * 
 * Prerequisites:
 * - Docker and docker compose installed
 * - Git available
 * - Ports 3010, 3100, 3200, 4040, 9000 available
 */

set -e

LAOS_DIR="${LAOS_DIR:-../laos}"
APP_DIR="$(pwd)"

info() {
  echo "[INFO] $1"
}

error() {
  echo "[ERROR] $1" >&2
  exit 1
}

# Check prerequisites
check_prereqs() {
  info "Checking prerequisites..."
  
  command -v docker >/dev/null 2>&1 || error "Docker not found. Install from https://docs.docker.com/get-docker/"
  command -v git >/dev/null 2>&1 || error "Git not found."
  
  # Check ports
  for port in 3010 3100 3200 4040 9000; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
      error "Port $port is already in use. Stop existing services or change ports."
    fi
  done
  
  info "Prerequisites OK"
}

# Clone LAOS if not present
clone_laos() {
  if [ ! -d "$LAOS_DIR" ]; then
    info "Cloning LAOS stack to $LAOS_DIR..."
    git clone https://github.com/dtechvision/laos.git "$LAOS_DIR"
  else
    info "LAOS already cloned at $LAOS_DIR"
  fi
}

# Start LAOS stack
start_laos() {
  info "Starting LAOS stack..."
  cd "$LAOS_DIR"
  
  # Pull latest if already cloned
  if [ -d ".git" ]; then
    git pull origin main 2>/dev/null || info "Could not pull latest, using current version"
  fi
  
  # Start services
  docker compose up -d
  
  cd "$APP_DIR"
  info "LAOS services starting..."
}

# Wait for services to be ready
wait_for_services() {
  info "Waiting for services to be ready (this may take 2-3 minutes)..."
  
  local retries=30
  local delay=5
  
  # Wait for Loki
  info "Checking Loki..."
  for i in $(seq 1 $retries); do
    if curl -s http://localhost:3100/ready >/dev/null 2>&1; then
      info "Loki is ready"
      break
    fi
    if [ $i -eq $retries ]; then
      error "Loki failed to start"
    fi
    sleep $delay
  done
  
  # Wait for Tempo
  info "Checking Tempo..."
  for i in $(seq 1 $retries); do
    if curl -s http://localhost:3200/ready >/dev/null 2>&1; then
      info "Tempo is ready"
      break
    fi
    if [ $i -eq $retries ]; then
      error "Tempo failed to start"
    fi
    sleep $delay
  done
  
  # Wait for Grafana
  info "Checking Grafana..."
  for i in $(seq 1 $retries); do
    if curl -s http://localhost:3010/api/health | grep -q "ok" >/dev/null 2>&1; then
      info "Grafana is ready"
      break
    fi
    if [ $i -eq $retries ]; then
      error "Grafana failed to start"
    fi
    sleep $delay
  done
  
  # Wait for Pyroscope
  info "Checking Pyroscope..."
  for i in $(seq 1 $retries); do
    if curl -s http://localhost:4040/ready >/dev/null 2>&1; then
      info "Pyroscope is ready"
      break
    fi
    if [ $i -eq $retries ]; then
      error "Pyroscope failed to start"
    fi
    sleep $delay
  done
  
  # Wait for Sentry
  info "Checking Sentry..."
  for i in $(seq 1 $retries); do
    if curl -s http://localhost:9000/_health/ >/dev/null 2>&1; then
      info "Sentry is ready"
      break
    fi
    if [ $i -eq $retries ]; then
      error "Sentry failed to start"
    fi
    sleep $delay
  done
  
  info "All services are ready!"
}

# Initialize Sentry
init_sentry() {
  info "Initializing Sentry..."
  cd "$LAOS_DIR"
  
  # Run migrations and create superuser
  docker compose exec -T sentry-web sentry upgrade --noinput 2>/dev/null || true
  docker compose exec -T sentry-web sentry createuser \
    --email admin@localhost --password admin123 --superuser --no-input 2>/dev/null || \
    info "Sentry user may already exist"
  
  cd "$APP_DIR"
  info "Sentry initialized (login: admin@localhost / admin123)"
}

# Configure app environment
configure_app() {
  info "Configuring application environment..."
  
  if [ -f ".env.laos" ]; then
    info "Found .env.laos — using existing configuration"
    cat .env.laos > .env
  else
    info "Creating .env from .env.example with LAOS defaults..."
    cat > .env << 'EOF'
SENTRY_DSN=http://ec6dd66bd505682235c3bba04bdcdadc@localhost:9000/2
VITE_SENTRY_DSN=http://ec6dd66bd505682235c3bba04bdcdadc@localhost:9000/2
LOKI_ENDPOINT=http://localhost:3100/loki/api/v1/push
OTLP_ENDPOINT=http://localhost:4318/v1/traces
PYROSCOPE_SERVER_ADDRESS=http://localhost:4040
SERVICE_NAME=effect-tanstack-start-master
NODE_ENV=development
EOF
  fi
  
  info "Environment configured"
}

# Print status
print_status() {
  echo ""
  echo "==================================="
  echo "LAOS Stack Status"
  echo "==================================="
  echo ""
  echo "Services:"
  echo "  Grafana:    http://localhost:3010 (admin/admin)"
  echo "  Loki:       http://localhost:3100"
  echo "  Tempo:      http://localhost:3200"
  echo "  Pyroscope:  http://localhost:4040"
  echo "  Sentry:     http://localhost:9000 (admin@localhost/admin123)"
  echo ""
  echo "Application:"
  echo "  Start with: bun run dev"
  echo "  API:        http://localhost:3000"
  echo ""
  echo "Verification:"
  echo "  Logs:   curl -G http://localhost:3100/loki/api/v1/query \\"
  echo "            --data-urlencode 'query={service_name=\"effect-tanstack-start-master\"}'"
  echo "  Traces: http://localhost:3010 → Explore → Tempo"
  echo "  Errors: http://localhost:9000 → Projects → effect-tanstack-start"
  echo ""
  echo "==================================="
}

# Main execution
main() {
  info "Setting up LAOS stack for Sentry + OTEL integration testing..."
  
  check_prereqs
  clone_laos
  start_laos
  wait_for_services
  init_sentry
  configure_app
  print_status
  
  info "Setup complete! Start the app with: bun run dev"
}

# Allow sourcing or execution
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  main "$@"
fi
