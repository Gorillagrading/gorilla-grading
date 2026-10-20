#!/usr/bin/env bash
# Guarda y sube la rama actual después de comprobar que el proyecto compila.
# Uso: bash scripts/publicar.sh "feat(home): descripción del cambio"
set -e

MSG="$1"
if [ -z "$MSG" ]; then
  echo "Falta el mensaje del commit."
  echo 'Uso: bash scripts/publicar.sh "feat(home): descripción del cambio"'
  exit 1
fi

BRANCH=$(git branch --show-current)
if [ "$BRANCH" = "main" ]; then
  echo "Estás en main. Trabaja en una rama: git switch -c feat/nombre"
  exit 1
fi

echo "==> Comprobando tipos"
npm run typecheck

echo "==> Compilando"
npm run build

echo "==> Guardando cambios"
git add -A
if git diff --cached --quiet; then
  echo "No hay cambios que guardar."
  exit 0
fi
git commit -m "$MSG" -m "Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>"

echo "==> Subiendo $BRANCH"
git push -u origin "$BRANCH"

echo ""
echo "Revisa el preview de Vercel de esta rama y abre el PR:"
echo "https://github.com/Gorillagrading/gorilla-grading/compare/main...$BRANCH"
