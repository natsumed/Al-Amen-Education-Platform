# Amenallah Edition — Plateforme Éducative Tunisienne | منصة أمان الله التعليمية

Plateforme éducative pour les élèves du primaire tunisien (1ère à 6ème année).
Cours vidéo, livres PDF, séries d'exercices et animations éducatives — en arabe et en français.

## 🚀 Démarrage rapide

```bash
# Installer les dépendances
npm install

# Démarrer PostgreSQL localement, puis générer le client et appliquer le schéma
npm run db:up
npx prisma generate
npx prisma migrate deploy

# Peupler avec des données de test
npx tsx prisma/seed.ts

# Lancer le serveur de développement
npm run dev
```

Ouvrir http://localhost:3000

## 🔑 Comptes de test

| Rôle | Email | Mot de passe | N° compte |
|------|-------|-------------|-----------|
| Admin | admin@edutunisia.tn | admin123 | 10000001 |
| Enseignant | teacher@edutunisia.tn | teacher123 | 10000002 |
| Élève | student@edutunisia.tn | student123 | 10000003 |
| Parent | parent@edutunisia.tn | parent123 | 10000004 |

**Rôles :** l'enseignant accède aux ressources pédagogiques ; le parent suit la progression et paie pour l'élève (sans accès aux cours).

## Assistant (chatbot)

Agent flottant (élève / enseignant / parent) avec outils Prisma (recherche cours/livres, progression enfant, tarifs).

- **Recommandé (gratuit) :** `GEMINI_API_KEY` (Google AI Studio) + `gemini-3.5-flash-lite` (moins de 503 « high demand »). En cas de saturation, bascule auto vers d’autres modèles puis mode local DB. Redémarrez `next dev` après ajout.
- Fallback optionnel : `OPENAI_API_KEY`.
- Sans clé : **mode local intelligent** (même outils DB, pas de FAQ figée).

Logo / favicon : `public/images/logo.jpeg`.

## 📁 Structure du projet

```
platform/
├── mobile/            # App Android Expo (React Native)
├── docs/              # ANDROID.md et docs techniques
├── prisma/            # Schéma de base de données et seed
├── public/            # Assets statiques, traductions
├── src/
│   ├── app/           # Pages et API routes (App Router)
│   ├── components/    # Composants UI (shadcn)
│   ├── lib/           # Auth, access-control, media, paiements
│   └── ...
└── .env.example       # Modèle de configuration
```

## 📱 Application Android

Client natif Expo dans `/mobile` — voir [docs/ANDROID.md](docs/ANDROID.md) and [mobile/README.md](mobile/README.md).

```bash
cd mobile
npm start   # Expo Go ou émulateur Android
```

## 🤝 Contribution & CI

Voir [DEVELOPERS.md](DEVELOPERS.md) (branches `feature/…` + PR) et [docs/CICD.md](docs/CICD.md).
Les PR vers `main` doivent passer lint, typecheck, Vitest, build et typecheck mobile.

## 🛠 Stack technique

| Couche | Technologie |
|--------|------------|
| Framework | Next.js 14 (App Router) |
| Langage | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Base de données | PostgreSQL |
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
