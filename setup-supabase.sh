#!/bin/bash

# Script de configuration Supabase pour "A Tour de Role"

echo "🚀 Configuration Supabase"
echo "========================"
echo ""

# Demander l'URL de connexion
read -p "📝 Entrez votre DATABASE_URL de Supabase: " DATABASE_URL

# Vérifier si l'URL est valide
if [[ ! $DATABASE_URL =~ ^postgresql:// ]]; then
    echo "❌ URL invalide! Elle doit commencer par 'postgresql://'"
    exit 1
fi

echo ""
echo "✅ URL reçue!"
echo ""

# Mettre à jour le .env
echo "📝 Mise à jour du fichier .env..."

# Créer une sauvegarde
cp .env .env.backup
echo "💾 Sauvegarde créée: .env.backup"

# Mettre à jour l'URL
sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|g" .env
sed -i '' "s|DIRECT_URL=.*|DIRECT_URL=\"$DATABASE_URL\"|g" .env

echo "✅ .env mis à jour!"
echo ""

# Afficher le contenu
echo "📄 Contenu de .env:"
cat .env
echo ""

# Initialiser la base de données
read -p "🗄️  Voulez-vous initialiser la base de données maintenant? (o/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Oo]$ ]]; then
    echo "⏳ Initialisation de la base de données..."
    npm run db:push
    echo "✅ Base de données initialisée!"
else
    echo "⏭️  Vous pouvez lancer 'npm run db:push' plus tard"
fi

echo ""
echo "🎉 Configuration terminée!"
