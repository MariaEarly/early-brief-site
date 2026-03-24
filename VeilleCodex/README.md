# Veille réglementaire automatique

Socle local de veille réglementaire pour un périmètre `LCB-FT / conformité / MiCA / DSP`.

Le système reste "exhaustif" au sens opérationnel suivant:
- il couvre un ensemble large de sources officielles et quasi-officielles configurées;
- il détecte les nouveautés, les classe par thème et produit un rapport exploitable;
- il garde un historique local pour éviter les doublons entre deux exécutions.

Il n'est pas exhaustif au sens absolu: certaines sources publient sans RSS, avec pagination dynamique ou sans dates facilement extractibles. Le périmètre est donc configurable et extensible.

## Contenu

- `monitor.py`: moteur principal
- `config/sources.json`: registre des sources surveillées
- `data/state.json`: état local des éléments déjà vus
- `reports/`: rapports générés
- `tests/test_monitor.py`: tests unitaires

## Usage

Lister les sources:

```bash
python3 monitor.py list-sources
```

Lancer une veille sur 7 jours:

```bash
python3 monitor.py run --days 7
```

Limiter le rapport aux 20 éléments les plus pertinents:

```bash
python3 monitor.py run --days 7 --max-items 20
```

Écrire le rapport dans un chemin précis:

```bash
python3 monitor.py run --days 7 --output reports/veille-custom.md
```

## Fonctionnement

Le moteur:
- charge les sources depuis `config/sources.json`;
- interroge les flux RSS/Atom et les pages HTML de listes;
- tente d'extraire `titre`, `lien`, `date`, `source`, `snippet`;
- applique un scoring par mots-clés;
- classe les résultats par thème;
- déduplique les résultats;
- conserve l'état local pour distinguer les nouveautés.

## Sources fournies par défaut

Le registre inclut un premier périmètre:
- AMLA
- EBA
- ESMA
- AMF
- ACPR
- TRACFIN
- GAFI / FATF
- Groupe Egmont
- Wolfsberg Group
- Conseil de l'Union européenne
- Commission européenne
- CNIL

## Limites connues

- `JORF / Legifrance` n'est pas inclus par défaut car les pages et indexations sont moins stables pour une extraction générique sans dépendance dédiée.
- Certaines pages HTML n'exposent pas de date normalisée. Elles peuvent être détectées comme "sans date" et exclues du rapport de période.
- Le scoring par mots-clés est explicable et simple. Il peut être renforcé plus tard par une taxonomie métier plus fine.

## Personnalisation

Tu peux enrichir `config/sources.json` avec:
- de nouvelles sources;
- des mots-clés additionnels;
- des thèmes spécifiques;
- des règles de filtrage par inclusion/exclusion.

## Tests

```bash
python3 -m unittest discover -s tests
```
