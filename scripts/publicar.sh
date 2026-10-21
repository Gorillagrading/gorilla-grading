#!/usr/bin/env bash
# Guarda TODO y lo publica directamente en main (producción) tras comprobar que el proyecto compila.
# Uso: bash scripts/publicar.sh "feat(home): descripción del cambio"
set -e

MSG="$1"
if [ -z "$MSG" ]; then
  echo "Falta el mensaje del commit."
  echo 'Uso: bash scripts/publicar.sh "feat(home): descripción del cambio"'
  exit 1
fi

BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
  echo "Estás en '$BRANCH' y este script publica en main."
  echo "Cambia con: git switch main"
  exit 1
fi

echo "==> Trayendo lo último de GitHub"
git pull --rebase --autostash -q origin main

echo "==> Comprobando tipos"
npm run typecheck

echo "==> Compilando"
npm run build

echo "==> Guardando cambios"
git add -A
if git diff --cached --quiet; then
  echo "No hay cambios nuevos que guardar."
else
  git commit -m "$MSG" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
fi

echo "==> Publicando en main"
git push origin main

echo ""
echo "Listo. Vercel desplegará main en unos minutos."
