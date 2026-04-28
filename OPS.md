# OPS.md — Note opérationnelle critique : MCP Tracker

> Ce document correspond au post-mortem de l'**incident #3** (auth MCP perdue)
> consigné en section 5 d'EB-GOV-001 (Gouvernance de fiabilité Early Watch).
> Il décrit l'architecture d'authentification du MCP Tracker, le piège connu
> de la configuration des connecteurs, et la procédure de rotation du secret.

---

## Architecture

Le MCP Tracker est implémenté comme une **fonction Netlify serverless** :

- **Endpoint :** `/.netlify/functions/mcp-tracker`
- **Code source :** `netlify/functions/mcp-tracker.ts`
- **Hébergement :** Netlify (site `early-brief-site`)

Les outils **en lecture** (ex. `tracker_list_entries`) sont accessibles sans
authentification. Les outils **en écriture** (ex. `tracker_add_entry`,
`tracker_delete_entry`) exigent une authentification valide — sans quoi ils
retournent `« Écriture refusée : authentification requise (secret manquant) »`
sans lever d'exception côté client.

---

## Authentification

La variable d'environnement **`MCP_SECRET`** est définie côté Netlify (dans les
paramètres du site, onglet *Environment variables*). Le client doit transmettre
cette valeur à chaque requête d'écriture via **l'une des deux méthodes** :

| Méthode | Forme | Fonctionne dans… |
|---------|-------|-----------------|
| Header HTTP | `Authorization: Bearer <MCP_SECRET>` | Clients HTTP directs, scripts |
| Query param | `?secret=<MCP_SECRET>` dans l'URL du connecteur | Claude Desktop, claude.ai |

---

## ⚠️ Piège connu — Connecteurs Claude Desktop / claude.ai

**L'interface de configuration des connecteurs Claude (claude.ai et Claude
Desktop) ne supporte pas les headers HTTP custom.**

La seule méthode fonctionnelle pour les connecteurs MCP configurés dans Claude
Desktop est le **query param dans l'URL** :

```
https://<votre-site>.netlify.app/.netlify/functions/mcp-tracker?secret=<MCP_SECRET>
```

Sans ce `?secret=` dans l'URL du connecteur, **toutes les écritures échouent
silencieusement** — le connecteur s'initialise, les lectures fonctionnent, mais
chaque tentative d'écriture retourne `« Écriture refusée : authentification
requise (secret manquant) »`. Il n'y a aucune erreur visible côté connecteur au
moment de la configuration.

> **Référence historique :** ce workaround était déjà documenté dans le message
> du commit [`2d5d0c7`](https://github.com/MariaEarly/early-brief-site/commit/2d5d0c7)
> du 06/04/2026. L'incident #3 s'est produit parce que le connecteur a été
> reconfiguré sans le query param.

---

## Procédure de rotation du MCP_SECRET

> **Attention à l'ordre des opérations.** Une rotation naïve crée une fenêtre
> de panne :
> - Mettre à jour Netlify **avant** les clients → les clients en production
>   échouent immédiatement (ancien secret rejeté).
> - Mettre à jour les clients **avant** Netlify → les clients échouent aussi
>   (nouveau secret pas encore connu du serveur).

### Rotation sans coupure (méthode recommandée)

1. **Annoncer la maintenance** aux utilisateurs actifs (ou planifier hors
   heures d'usage).
2. **Générer le nouveau secret** :
   ```bash
   python3 -c "import secrets; print(secrets.token_hex(32))"
   ```
3. **Mettre à jour Netlify en premier** :
   - Netlify Dashboard → Site `early-brief-site` → *Site configuration* →
     *Environment variables* → modifier `MCP_SECRET` → *Save*.
   - Déclencher un redéploiement : *Deploys* → *Trigger deploy* → *Deploy site*.
   - Attendre que le déploiement soit `Published`.
4. **Mettre à jour immédiatement tous les connecteurs Claude Desktop** :
   - *Claude Desktop* → Paramètres → *Connectors* → éditer le connecteur
     MCP Tracker → remplacer `?secret=<ancien>` par `?secret=<nouveau>` dans
     l'URL.
   - Répéter sur chaque poste/compte utilisant le connecteur.
5. **Vérifier** : tenter un `tracker_add_entry` de test depuis Claude Desktop
   puis supprimer l'entrée de test.

> La fenêtre de panne entre les étapes 3 et 4 est réduite au minimum (quelques
> minutes). Si plusieurs personnes utilisent le connecteur, coordonner l'étape 4
> simultanément.

---

## Checklist de vérification rapide

Avant de conclure qu'une écriture MCP fonctionne, vérifier :

- [ ] L'URL du connecteur contient bien `?secret=<MCP_SECRET>`
- [ ] La valeur du secret dans l'URL correspond à `MCP_SECRET` côté Netlify
- [ ] Le site Netlify est bien déployé (pas de build en échec)
- [ ] Un outil de lecture (ex. liste des entrées) fonctionne (connectivité OK)
- [ ] Un outil d'écriture de test (ajout + suppression) fonctionne en retour
