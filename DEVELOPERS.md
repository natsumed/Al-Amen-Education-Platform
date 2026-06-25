# 👨‍💻 Guide Développeurs — Al-Amân Platform

Ce document explique comment installer, lancer et contribuer au projet selon votre rôle (frontend ou backend).

---

## 🚀 Installation (pour les deux développeurs)

```bash
# 1. Cloner le repo et aller sur votre branche
git clone https://github.com/natsumed/Al-Amen-Education-Platform.git
cd Al-Amen-Education-Platform

# Personne Frontend → branche frontend
git checkout frontend

# Personne Backend → branche backend
git checkout backend

# 2. Installer les dépendances
npm install

# 3. Générer la base de données SQLite
npx prisma generate
npx prisma db push

# 4. Peupler avec les données de test
npx tsx prisma/seed.ts

# 5. Lancer le serveur
npm run dev
```

Ouvrir http://localhost:3000

### Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | admin@edutunisia.tn | admin123 |
| Enseignant | teacher@edutunisia.tn | teacher123 |
| Élève | student@edutunisia.tn | student123 |

---

## 🎨 Développeur Frontend

Tu travailles sur la branche `frontend`. Ton rôle : **tout ce que l'utilisateur voit et touche**.

### Ce que tu peux développer

#### Priorité Haute
1. **Design responsive mobile** — La sidebar est masquée sur mobile (`hidden md:flex`). Créer un menu hamburger + sheet pour les téléphones :
   - `src/components/layout/mobile-sidebar.tsx`
   - Ajouter un bouton hamburger dans la navbar pour les écrans < 768px

2. **Page checkout / paiement** — Compléter le flux de paiement :
   - `src/app/checkout/pending/page.tsx` — Page d'attente après paiement
   - `src/app/checkout/return/page.tsx` — Page de confirmation
   - `src/app/checkout/page.tsx` — Améliorer le formulaire existant

3. **Composants réutilisables** — Extraire le code inline en composants dédiés :
   - `src/components/content/video-player.tsx` — Player YouTube réutilisable
   - `src/components/content/pdf-viewer.tsx` — Visualiseur PDF
   - `src/components/content/gif-viewer.tsx` — Visualiseur d'animation
   - `src/components/content/download-button.tsx` — Bouton de téléchargement avec vérification d'accès

4. **Système de notifications** — Au-delà des toasts sonner :
   - Page de notifications dans le dashboard
   - Badge de notifications non lues sur la navbar
   - Notifications pour : nouveau contenu, expiration d'abonnement, demande de lien parent

#### Priorité Moyenne
5. **Gamification** — Éléments de jeu pour motiver les élèves :
   - Points gagnés par cours complété
   - Badges pour les accomplissements (ex: "5 cours complétés", "1ère année terminée")
   - Barre de progression quotidienne / streak

6. **Recherche avancée** — Améliorer la recherche de contenu :
   - Suggestions de recherche (autocomplete)
   - Mise en surbrillance des termes trouvés
   - Filtres rapides (cours populaires, nouveaux, recommandés)

7. **Mode sombre** — Un vrai thème dark/night :
   - Toggle dans la navbar et les paramètres
   - Vérifier tous les composants en mode sombre
   - Palette de couleurs adaptée

8. **Page d'accueil élève** — Dashboard étudiant plus engageant :
   - "Continuer où tu t'es arrêté" — reprendre le dernier cours
   - Suggestions personnalisées par année
   - Graphique de progression hebdomadaire

9. **Animations et micro-interactions** :
   - Animation de célébration quand un cours est terminé
   - Transition fluide entre les pages
   - Squelettes de chargement (déjà présents, à améliorer)

#### Priorité Basse
10. **PWA / Mode hors-ligne** — Service worker pour accès sans internet :
    - Mise en cache des pages visitées
    - Icône d'installation sur l'écran d'accueil
    - Indicateur de connexion

11. **Accessibilité (a11y)** — Rendre la plateforme accessible :
    - Navigation au clavier
    - Labels ARIA sur tous les composants
    - Contraste des couleurs conforme WCAG

12. **Améliorations visuelles** :
    - Illustrations personnalisées (svg)
    - Page 404 créative
    - Loaders et états vides animés
    - Animations de particules sur la landing page

### Fichiers clés pour le frontend

| Fichier | Contenu |
|---------|---------|
| `src/app/page.tsx` | Landing page |
| `src/app/(auth)/` | Pages login, register, forgot password |
| `src/app/(dashboard)/` | Dashboards Admin, Teacher, Student, Parent |
| `src/app/content/` | Catalogue et page détail contenu |
| `src/components/layout/` | Navbar, Sidebar |
| `src/components/content/` | ContentCard, ContentGrid, ContentFilters |
| `src/components/ui/` | Composants shadcn/ui (boutons, inputs, modales...) |
| `src/app/globals.css` | Styles globaux, variables CSS, RTL |
| `tailwind.config.ts` | Configuration Tailwind (couleurs, polices, breakpoints) |
| `public/locales/ar.json` | Traductions arabes |
| `public/locales/fr.json` | Traductions françaises |

### Stack frontend
- **Next.js 14** (App Router)
- **TypeScript** strict
- **Tailwind CSS** (classes utilitaires)
- **shadcn/ui** (composants accessibles basés sur Radix UI)
- **Framer Motion** (animations)
- **Lucide React** (icônes)
- **Sonner** (toasts)

---

## ⚙️ Développeur Backend

Tu travailles sur la branche `backend`. Ton rôle : **API, base de données, logique métier, sécurité, paiements**.

### Ce que tu peux développer

#### Priorité Haute
1. **Intégration paiement Konnect** — Passer du stub à la vraie API :
   - `src/lib/payment/konnect.ts` — Implémenter l'API REST Konnect
   - Gérer les webhooks de confirmation
   - Créer `src/app/api/payments/webhook/konnect/route.ts`

2. **Intégration paiement Flouci** — Paiement par wallet mobile :
   - `src/lib/payment/flouci.ts` — API Flouci (QR code, callback)
   - Créer `src/app/api/payments/webhook/flouci/route.ts`

3. **Vérification email** — Valider les emails à l'inscription :
   - Créer `src/app/api/auth/verify-email/route.ts`
   - Modifier `src/app/api/auth/register/route.ts` pour envoyer le lien de vérification
   - Bloquer l'accès aux comptes non vérifiés

4. **Upload de fichiers** — Permettre à l'admin d'uploader des PDFs, GIFs, miniatures :
   - Intégrer Supabase Storage (ou un stockage local temporaire)
   - `src/lib/storage.ts` — Déjà créé, à connecter
   - Ajouter l'upload dans `src/app/(dashboard)/admin/content/new/page.tsx`
   - Barre de progression d'upload

5. **Gestion des abonnements** — Automatiser le cycle de vie :
   - Tâche cron pour expirer les abonnements (vérifier `endDate < now`)
   - Notifications email avant expiration (Resend)
   - Renouvellement automatique

#### Priorité Moyenne
6. **Sécurité** — Renforcer la plateforme :
   - Rate limiting sur les routes API sensibles (login, register)
   - Validation CSRF sur toutes les mutations
   - Headers de sécurité (CSP, HSTS, X-Frame-Options)
   - Logs d'audit pour les actions admin

7. **Tests automatisés** :
   - Tests unitaires avec Vitest pour la logique métier
   - Tests d'intégration pour les routes API
   - Tests E2E avec Playwright pour les flux critiques (login, achat, upload)

8. **Optimisation base de données** :
   - Index manquants sur les requêtes fréquentes
   - Migration vers PostgreSQL pour la production
   - Mise en cache avec Redis (Upstash)

9. **Système de permissions avancé** :
   - Permissions granulaires (ex: un enseignant peut créer du contenu ?)
   - Rôles personnalisés
   - Logs de toutes les actions sensibles

10. **API externe / Headless** :
    - Documenter l'API avec OpenAPI/Swagger
    - Clés API pour les intégrations tierces
    - Rate limiting par clé API

#### Priorité Basse
11. **Recherche full-text** — Au-delà du `contains` SQLite :
    - Intégrer un moteur de recherche (Meilisearch, Typesense)
    - Indexation du contenu en arabe et français

12. **Système de recommandation** — Suggérer du contenu pertinent :
    - Basé sur l'historique de l'utilisateur
    - Basé sur l'année scolaire et les matières consultées

13. **Analytiques avancées** — Dashboard admin plus riche :
    - Graphiques de rétention
    - Taux de complétion par cours
    - Revenus par période

14. **Export de données** :
    - Export CSV/Excel des utilisateurs, paiements, contenus
    - Rapports PDF automatiques

15. **CI/CD** :
    - GitHub Actions pour lint + test + build
    - Déploiement automatique sur Vercel

### Fichiers clés pour le backend

| Fichier | Contenu |
|---------|---------|
| `prisma/schema.prisma` | Modèle de données (10 modèles, relations, index) |
| `prisma/seed.ts` | Données de test (3 utilisateurs, 10 contenus) |
| `src/app/api/` | Toutes les routes API (18 endpoints) |
| `src/lib/auth.ts` | Configuration Auth.js v5 (credentials + Google) |
| `src/lib/auth-utils.ts` | Fonctions d'authentification (getSession, requireAdmin...) |
| `src/lib/access-control.ts` | Contrôle d'accès au contenu (free/paid/subscription) |
| `src/lib/validations.ts` | Schémas Zod pour toutes les entrées |
| `src/lib/payment/` | Abstraction paiement (Konnect, Flouci, Manuel) |
| `src/lib/email.ts` | Emails transactionnels (Resend) |
| `src/lib/storage.ts` | Upload de fichiers (Supabase Storage) |
| `src/lib/prisma.ts` | Client Prisma singleton |
| `src/middleware.ts` | Protection des routes par rôle |
| `src/types/index.ts` | Types TypeScript partagés |

### Stack backend
- **Next.js API Routes** (même serveur que le frontend)
- **Prisma ORM** (SQLite en dev, PostgreSQL en prod)
- **Auth.js v5** (JWT sessions, credentials + OAuth)
- **Zod** (validation des entrées)
- **bcryptjs** (hashage des mots de passe)
- **Resend** (emails transactionnels)
- **Supabase** (stockage de fichiers)

### Structure de l'API

```
/api/auth/[...nextauth]    — Auth.js (login, logout, session)
/api/auth/register         — Création de compte
/api/auth/forgot-password  — Demande de reset
/api/auth/reset-password   — Réinitialisation

/api/users                 — Liste (admin) / Profil
/api/users/me              — Utilisateur courant + abonnement
/api/users/[id]            — Modification/suppression utilisateur

/api/content               — CRUD contenu + filtres
/api/content/[id]          — Détail contenu
/api/content/[id]/access   — Vérification d'accès

/api/subscriptions/me      — Abonnement utilisateur courant

/api/payments              — Historique paiements
/api/payments/create       — Initier un paiement
/api/payments/webhook      — Callback paiement

/api/admin/dashboard       — Statistiques admin
/api/admin/manual-activation — Activation manuelle abonnement

/api/parents/link          — Lier un enfant
/api/parents/children      — Enfants liés

/api/progress              — Suivi de progression
/api/reviews               — Avis sur le contenu
```

---

## 🔄 Workflow Git

```bash
# 1. Toujours partir de main à jour
git checkout main
git pull

# 2. Mettre à jour votre branche
git checkout frontend   # ou backend
git merge main

# 3. Travailler, commit, push
git add .
git commit -m "feat: description de ce que vous avez fait"
git push

# 4. Quand une fonctionnalité est prête, créer une PR sur GitHub
# Aller sur https://github.com/natsumed/Al-Amen-Education-Platform/pulls
# Base: main  ←  Compare: frontend (ou backend)
```

### Conventions de commits

```
feat: nouvelle fonctionnalité
fix: correction de bug
style: changements visuels uniquement
refactor: restructuration du code
docs: documentation
test: ajout de tests
chore: maintenance, dépendances
```

Exemples :
```
feat: add mobile responsive sidebar with hamburger menu
fix: login redirect not working for admin users
style: enhance content card hover animations
refactor: extract video player into reusable component
```

---

## 📞 Communication entre développeurs

- **Avant de modifier un fichier** : vérifier que l'autre développeur ne travaille pas dessus
- **Frontend dépend du Backend** : quand le backend ajoute une nouvelle route API, documenter l'entrée et la sortie attendue
- **Backend dépend du Frontend** : quand le frontend a besoin d'une nouvelle API, créer l'issue avec le contrat attendu
- **Fichiers partagés** (à coordonner) :
  - `src/types/index.ts`
  - `src/lib/validations.ts`
  - `prisma/schema.prisma`
  - `src/middleware.ts`

---

## 📋 Roadmap simplifiée

| Phase | Frontend | Backend |
|-------|----------|---------|
| **Actuelle** | ✅ Landing, auth, browse, content detail | ✅ Auth, CRUD content, access control, seed |
| **Phase 2** | Mobile responsive, checkout UI, reusable components | Paiements réels (Konnect/Flouci), upload fichiers |
| **Phase 3** | Gamification, recherche avancée, mode sombre | Tests, sécurité, migration PostgreSQL |
| **Phase 4** | PWA, accessibilité, animations | Recherche full-text, analytiques, CI/CD |
