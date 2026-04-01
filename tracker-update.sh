#!/bin/bash

# Early Brief — Mise à jour tracker
# Double-clique sur ce fichier pour lancer le workflow complet

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Charger le token depuis scripts/.env
if [ -f "scripts/.env" ]; then
  export $(grep -v '^#' scripts/.env | xargs)
fi

if [ -z "$PLATFORM_TOKEN" ]; then
  echo "❌ PLATFORM_TOKEN manquant dans scripts/.env"
  read -p "Appuie sur Entrée pour fermer..."
  exit 1
fi

echo "🔄 Génération des candidats tracker..."
DAYS_BACK=7 node script/tracker-from-platform.cjs

if [ $? -ne 0 ]; then
  echo "❌ Erreur lors de la génération des candidats"
  read -p "Appuie sur Entrée pour fermer..."
  exit 1
fi

echo "🚀 Lancement du serveur de validation..."
node script/admin-server.cjs &
SERVER_PID=$!

sleep 2

echo "🌐 Ouverture de l'interface..."
open http://localhost:3333

echo ""
echo "✅ Interface ouverte sur http://localhost:3333"
echo "   Valide les candidats puis clique 'Publier sur le site'"
echo "   Ferme ce terminal quand tu as terminé"
echo ""

# Attendre que le serveur soit arrêté
wait $SERVER_PID
