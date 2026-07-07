# Amenallah Edition — Plateforme Éducative Tunisienne | منصة أمان الله التعليمية

Plateforme éducative pour les élèves du primaire tunisien (1ère à 6ème année).
Cours vidéo, livres PDF, séries d'exercices et animations éducatives — en arabe et en français.

## 🚀 Démarrage rapide

```bash
# Installer les dépendances
npm install

# Générer la base de données SQLite (aucune configuration externe requise)
npx prisma generate
npx prisma db push

# Peupler avec des données de test
npx tsx prisma/seed.ts

# Lancer le serveur de développement
npm run dev
```

Ouvrir http://localhost:3000

## 🔑 Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | admin@edutunisia.tn | admin123 |
| Enseignant | teacher@edutunisia.tn | teacher123 |
| Élève | student@edutunisia.tn | student123 |

## 📁 Structure du projet

```
platform/
├── prisma/            # Schéma de base de données et seed
├── public/            # Assets statiques, traductions
├── src/
│   ├── app/           # Pages et API routes (App Router)
│   │   ├── (auth)/    # Login, register, forgot password
│   │   ├── (dashboard)/ # Admin, Teacher, Student, Parent
│   │   ├── content/   # Catalogue et pages de contenu
│   │   └── api/       # Routes API REST
│   ├── components/    # Composants UI réutilisables
│   ├── hooks/         # Hooks React personnalisés
│   ├── lib/           # Logique métier, auth, paiements
│   ├── providers/     # Context providers
│   └── types/         # Types TypeScript
├── .env.local         # Variables d'environnement
└── start.bat          # Lancement en un clic
```

## 🛠 Stack technique

| Couche | Technologie |
|--------|------------|
| Framework | Next.js 14 (App Router) |
| Langage | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Base de données | SQLite (dev) / PostgreSQL (prod) |
| ORM | Prisma |
| Authentification | Auth.js v5 |
| Email | Resend |
| Animations | Framer Motion |

## 🌐 Langues supportées

- 🇫🇷 Français (LTR)
- 🇹🇳 العربية (RTL)

## 📊 Fonctionnalités

### Élèves
- Parcourir les cours, livres, séries d'exercices
- Regarder les vidéos éducatives
- Suivre sa progression
- Télécharger les contenus (abonnement payant)

### Enseignants
- Accéder aux cours et ressources pédagogiques
- Télécharger les animations et graphiques
- Gérer son abonnement

### Parents
- Lier les comptes de leurs enfants
- Suivre leur progression
- Gérer les abonnements

### Admin
- Gérer les contenus (upload, modification, suppression)
- Gérer les utilisateurs
- Activation manuelle des abonnements
- Tableau de bord analytique
- Gestion des paiements

## 🏗 Branches de développement

- `main` — Branche principale stable
- `frontend` — Développement UI/UX (composants, pages, styles)
- `backend` — Développement API (routes, base de données, logique métier, paiements)

## 📄 Licence

© 2024 Amenallah Edition | أمان الله للنشر و التوزيع. Tous droits réservés.
