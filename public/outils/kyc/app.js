    // ========================================
    // PAYS DATA (loaded from liste-pays/data.json)
    // ========================================
    let PAYS_DATA = null;

    // ========================================
    // CONFIG
    // ========================================
    const CONFIG = {
      version: "7.4",
      schemaVersion: 3, // Increment when localStorage structure changes
      scope: "Socle CMF L.561-5 / Lignes directrices ACPR-TRACFIN",

      sources: {
        // =========================================================
        // IDENTIFICATION DU CLIENT / DES INTERVENANTS
        // =========================================================

        // Personnes physiques — noyau d'identification
        "Nom(s)": {
          ref: "CMF R.561-5, I, 1°",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041592220"
        },
        "Prénom(s)": {
          ref: "CMF R.561-5, I, 1°",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041592220"
        },
        "Date de naissance": {
          ref: "CMF R.561-5, I, 1°",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041592220"
        },
        "Lieu de naissance": {
          ref: "CMF R.561-5, I, 1°",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041592220"
        },

        // Personnes physiques — éléments de connaissance / profil
        "Nationalité(s)": {
          ref: "CMF L.561-5-1 + R.561-12 + Arrêté du 2 septembre 2009",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000033512858"
        },
        "Adresse du domicile": {
          ref: "CMF L.561-5-1 + R.561-12 + Arrêté du 2 septembre 2009",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000033512858"
        },
        "Profession / activité": {
          ref: "CMF R.561-12 + Arrêté du 2 septembre 2009",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041592285"
        },
        "Revenus / patrimoine estimé": {
          ref: "CMF R.561-12 + Arrêté du 2 septembre 2009",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041592285"
        },

        // Personnes morales — identification
        "Forme juridique": {
          ref: "CMF R.561-5, II, 1°",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041592220"
        },
        "Dénomination / raison sociale": {
          ref: "CMF R.561-5, II, 1°",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041592220"
        },
        "Numéro d'immatriculation": {
          ref: "CMF R.561-5, II, 1°",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041592220"
        },
        "Adresse du siège social": {
          ref: "CMF R.561-5, II, 1°",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041592220"
        },
        "Identité des représentants légaux": {
          ref: "CMF R.561-5, II + R.561-5-4",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041577234"
        },

        // Bénéficiaire effectif
        "Identité des bénéficiaires effectifs (>25% du capital ou des droits de vote, ou contrôle par tout autre moyen — L.561-2-2 CMF)": {
          ref: "CMF L.561-2-2 + R.561-1",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000033517537"
        },
        "Chaîne de contrôle / détention": {
          ref: "CMF L.561-2-2 + R.561-1 + R.561-7",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000036824564"
        },

        // =========================================================
        // VERIFICATION DE L'IDENTITE / DES POUVOIRS
        // =========================================================

        "Pièce d'identité en cours de validité": {
          ref: "CMF R.561-5-1, 1°",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043332956"
        },
        "Justificatif de domicile récent (selon procédure interne et approche par les risques — non obligatoire au sens strict du CMF)": {
          ref: "Lignes directrices ACPR 2025 — bonne pratique / approche par les risques",
          url: "https://acpr.banque-france.fr/fr/publications-et-statistiques/publications/lignes-directrices-relatives-lidentification-la-verification-de-lidentite-et-la-connaissance-de-la"
        },
        "Second justificatif ou mesure complémentaire (entrée à distance)": {
          ref: "CMF R.561-5-2 + Lignes directrices ACPR 2025",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041577229/"
        },

        "Extrait Kbis récent (souvent < 3 mois selon politique interne)": {
          ref: "CMF R.561-5-1, 4°",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043332956"
        },
        "Statuts certifiés conformes": {
          ref: "CMF R.561-5-1, 4° + Lignes directrices ACPR 2025",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043332956"
        },
        "PI du représentant légal": {
          ref: "CMF R.561-5-4 + R.561-5-1",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041577234"
        },
        "Certificat de validité juridique ou équivalent (enregistrement registre officiel)": {
          ref: "CMF R.561-5-1, 4° + Lignes directrices ACPR 2025",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043332956"
        },

        // =========================================================
        // CONNAISSANCE DU CLIENT / DE LA RELATION D'AFFAIRES
        // =========================================================

        "Objet de la relation d'affaires": {
          ref: "CMF L.561-5-1 + R.561-12 + Arrêté du 2 septembre 2009",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000033512858"
        },
        "Nature de la relation d'affaires": {
          ref: "CMF L.561-5-1 + R.561-12 + Arrêté du 2 septembre 2009",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000033512858"
        },
        "Origine des fonds (déclaratif)": {
          ref: "CMF R.561-12-1 + R.561-12 + selon le risque",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041592280"
        },

        // =========================================================
        // SCREENING / GEL DES AVOIRS / PEP / PAYS A RISQUE
        // =========================================================

        "Screening sanctions (UE, ONU — OFAC si nexus US)": {
          ref: "CMF L.562-4 + L.562-4-1 (OFAC : politique interne / nexus US, non obligation CMF générale)",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000045250683"
        },
        "Screening PEP": {
          ref: "CMF L.561-10, 1° + R.561-18 + R.561-20-2",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000053153188"
        },
        "Vérification pays à risque": {
          ref: "CMF L.561-10, 3°",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000053153188"
        },
        "Identification et vérification des BE (chaîne de contrôle)": {
          ref: "CMF L.561-5 + L.561-2-2 + R.561-1 + R.561-7",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000033517742"
        },

        // =========================================================
        // VIGILANCE RENFORCEE — PPE / PEP
        // =========================================================

        "Fonction/mandat exercé(e)": {
          ref: "CMF R.561-18",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043970417"
        },
        "Déclaration d'origine de patrimoine": {
          ref: "CMF L.561-10, 1° + R.561-20-2 + Lignes directrices ACPR 2025",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041592332"
        },
        "Screening PEP renforcé (bases dédiées)": {
          ref: "CMF R.561-20-2",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041592332"
        },
        "Validation hiérarchique documentée": {
          ref: "CMF R.561-20-2, II",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041592332"
        },

        // =========================================================
        // CONSERVATION / PREUVES / JUSTIFICATION
        // =========================================================

        "Rapport / log de screening (sanctions, PEP)": {
          ref: "CMF L.561-12 + L.562-4-1",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041577784"
        },
        "Preuve validation hiérarchique (email/PV)": {
          ref: "CMF R.561-20-2 + L.561-12",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041592332"
        },

        // =========================================================
        // COMPLEMENTS — CONNAISSANCE RELATION / SCREENING
        // =========================================================

        "Nature des opérations bancaires envisagées": {
          ref: "CMF L.561-5-1 + R.561-12 — connaissance de la relation d'affaires",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000033512858"
        },
        "Objet et nature des services de paiement": {
          ref: "CMF L.561-5-1 + R.561-12 — connaissance de la relation d'affaires",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000033512858"
        },
        "Usage prévu de la monnaie électronique": {
          ref: "CMF L.561-5-1 + R.561-12 — connaissance de la relation d'affaires",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000033512858"
        },
        "Stratégie crypto et provenance des actifs numériques": {
          ref: "CMF L.561-5-1 + R.561-12 — connaissance de la relation d'affaires",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000033512858"
        },
        "Cohérence économique": {
          ref: "CMF L.561-6 — vigilance constante sur les opérations",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041577798"
        },

        // =========================================================
        // TRUST / FIDUCIE
        // =========================================================

        // Identification
        "Nature juridique du dispositif": {
          ref: "CMF L.561-5 II + AMLR Art. 62 + LD ACPR Identification 2025",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041592220"
        },
        "Identité du constituant": {
          ref: "CMF L.561-5 II + AMLR Art. 62(1)a + LD ACPR Identification 2025",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041592220"
        },
        "Identité du(des) trustee(s)": {
          ref: "CMF R.561-5-4 + AMLR Art. 62(1)b + LD ACPR Identification 2025",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041577234"
        },
        "Identité des bénéficiaires": {
          ref: "CMF L.561-2-2 + AMLR Art. 62(1)c + LD ACPR Identification 2025",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000033517537"
        },
        "Identité du protecteur (si applicable)": {
          ref: "CMF L.561-5 II + AMLR Art. 62(1)d + LD ACPR Identification 2025",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041592220"
        },
        "Objet et finalité du trust": {
          ref: "CMF R.561-12 + AMLR Art. 62(2) + LD ACPR Identification 2025",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041592285"
        },
        "Loi applicable et juridiction": {
          ref: "CMF L.561-5 II + AMLR Art. 62 + LD ACPR Identification 2025",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041592220"
        },

        // Documents
        "Acte constitutif du trust": {
          ref: "CMF R.561-5-1 + AMLR Art. 62 + LD ACPR Identification 2025",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043332956"
        },
        "Pièce d'identité du trustee": {
          ref: "CMF R.561-5-1, 1° + AMLR Art. 62(1)b + LD ACPR Identification 2025",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043332956"
        },
        "Pièce d'identité du constituant": {
          ref: "CMF R.561-5-1, 1° + AMLR Art. 62(1)a + LD ACPR Identification 2025",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043332956"
        },
        "Justificatif d'identité des bénéficiaires": {
          ref: "CMF L.561-2-2 + AMLR Art. 62(1)c + LD ACPR Identification 2025",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000033517537"
        },
        "Pièce d'identité du protecteur (si désigné)": {
          ref: "CMF R.561-5-1 + AMLR Art. 62(1)d + LD ACPR Identification 2025",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043332956"
        },
        "Justificatif d'origine des fonds apportés au trust": {
          ref: "CMF R.561-12 + AMLR Art. 29(1)c + LD ACPR Identification 2025",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041592285"
        },
        "Organigramme du dispositif (constituant → trustee(s) → bénéficiaires)": {
          ref: "CMF L.561-2-2 + AMLR Art. 62 + LD ACPR Identification 2025",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000033517537"
        },

        // Vérifications
        "Vérification des parties prenantes au trust": {
          ref: "CMF L.561-5 II + AMLR Art. 62 + LD ACPR Identification 2025",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041592220"
        },

        // Évidences
        "Acte constitutif du trust conservé au dossier": {
          ref: "CMF L.561-12 + AMLR Art. 62 + LD ACPR Identification 2025",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041577784"
        },
        "Preuves d'identification des parties": {
          ref: "CMF L.561-12 + AMLR Art. 62 + LD ACPR Identification 2025",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041577784"
        },
        "Justification économique documentée": {
          ref: "CMF R.561-12 + AMLR Art. 62(2) + LD ACPR Identification 2025",
          url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041592285"
        },
      },

      // Formulaires / Webhooks (à configurer)
      emailWebhook: null,
      webhookTimeout: 8000,
      
      coteeApplicableFamilies: ['commerciale', 'civile', 'sel'],
      detentionApplicableFamilies: ['commerciale', 'civile', 'sel', 'gie'],
      assoFondationFamilies: ['association', 'fondation'],
      noBEFamilies: ['ei', 'publique'],

      legalFormOptions: {
        FR: [
          { group: 'Commerciales', options: [
            { value: 'SA', label: 'SA' }, { value: 'SAS', label: 'SAS' }, { value: 'SASU', label: 'SASU' },
            { value: 'SARL', label: 'SARL' }, { value: 'EURL', label: 'EURL' }, { value: 'SNC', label: 'SNC' },
            { value: 'SCS', label: 'SCS' }, { value: 'SCA', label: 'SCA' }, { value: 'SEM', label: 'SEM' }
          ]},
          { group: 'Civiles', options: [
            { value: 'SCI', label: 'SCI' }, { value: 'SC', label: 'SC (autre)' },
            { value: 'SCM', label: 'SCM' }, { value: 'SCP', label: 'SCP' }
          ]},
          { group: 'SEL', options: [
            { value: 'SELARL', label: 'SELARL' }, { value: 'SELAS', label: 'SELAS' },
            { value: 'SELAFA', label: 'SELAFA' }, { value: 'SELCA', label: 'SELCA' }
          ]},
          { group: 'Associations / Fondations', options: [
            { value: 'ASSOCIATION', label: 'Association' }, { value: 'FONDATION', label: 'Fondation' },
            { value: 'GIE', label: 'GIE' }
          ]},
          { group: 'Publiques', options: [
            { value: 'ETAT_COLLECTIVITE', label: 'État / Collectivité' },
            { value: 'ETABLISSEMENT_PUBLIC', label: 'Établissement public' }
          ]},
          { group: 'Individuelles', options: [
            { value: 'EI', label: 'EI' }, { value: 'MICRO', label: 'Micro-entrepreneur' }
          ]}
        ],
        UE: [{ group: 'Formes UE', options: [
          { value: 'COMMERCIALE_UE', label: 'Société commerciale' },
          { value: 'CIVILE_UE', label: 'Société civile' },
          { value: 'ASSOCIATION_UE', label: 'Association / ONG' },
          { value: 'FONDATION_UE', label: 'Fondation' },
          { value: 'PUBLIQUE_UE', label: 'Entité publique' },
          { value: 'EI_UE', label: 'Entrepreneur individuel' },
          { value: 'AUTRE_UE', label: 'Autre' }
        ]}],
        HORSUE: [{ group: 'Formes Hors UE', options: [
          { value: 'COMMERCIALE_HORSUE', label: 'Société commerciale' },
          { value: 'CIVILE_HORSUE', label: 'Société civile' },
          { value: 'ASSOCIATION_HORSUE', label: 'Association / ONG' },
          { value: 'FONDATION_HORSUE', label: 'Fondation' },
          { value: 'PUBLIQUE_HORSUE', label: 'Entité publique' },
          { value: 'EI_HORSUE', label: 'Entrepreneur individuel' },
          { value: 'AUTRE_HORSUE', label: 'Autre' }
        ]}]
      },

      legalFormToFamily: {
        'SA': 'commerciale', 'SAS': 'commerciale', 'SASU': 'commerciale', 'SARL': 'commerciale',
        'EURL': 'commerciale', 'SNC': 'commerciale', 'SCS': 'commerciale', 'SCA': 'commerciale', 'SEM': 'commerciale',
        'SCI': 'civile', 'SC': 'civile', 'SCM': 'civile', 'SCP': 'civile',
        'SELARL': 'sel', 'SELAS': 'sel', 'SELAFA': 'sel', 'SELCA': 'sel',
        'ASSOCIATION': 'association', 'FONDATION': 'fondation', 'GIE': 'gie',
        'ETAT_COLLECTIVITE': 'publique', 'ETABLISSEMENT_PUBLIC': 'publique',
        'EI': 'ei', 'MICRO': 'ei',
        'COMMERCIALE_UE': 'commerciale', 'CIVILE_UE': 'civile', 'ASSOCIATION_UE': 'association',
        'FONDATION_UE': 'fondation', 'PUBLIQUE_UE': 'publique', 'EI_UE': 'ei', 'AUTRE_UE': 'autre',
        'COMMERCIALE_HORSUE': 'commerciale', 'CIVILE_HORSUE': 'civile', 'ASSOCIATION_HORSUE': 'association',
        'FONDATION_HORSUE': 'fondation', 'PUBLIQUE_HORSUE': 'publique', 'EI_HORSUE': 'ei', 'AUTRE_HORSUE': 'autre'
      },

      organisationComplements: {
        BANQUE: { purposeNature: "Nature des opérations bancaires envisagées" },
        PSP: { purposeNature: "Objet et nature des services de paiement" },
        EME: { purposeNature: "Usage prévu de la monnaie électronique" },
        CASP: { purposeNature: "Stratégie crypto et provenance des actifs numériques" }
      },

      infosCMF: {
        PF: {
          socle: ["Nom(s)", "Prénom(s)", "Date de naissance", "Lieu de naissance", "Nationalité(s)", "Adresse du domicile"],
          complements: ["Profession / activité", "Revenus / patrimoine estimé"]
        },
        PM: {
          socle: ["Forme juridique", "Dénomination / raison sociale", "Numéro d'immatriculation", "Adresse du siège social", "Identité des représentants légaux"],
          complementsBE: ["Identité des bénéficiaires effectifs (>25% du capital ou des droits de vote, ou contrôle par tout autre moyen — L.561-2-2 CMF)", "Chaîne de contrôle / détention"],
          complementsCotee: ["Identification des principaux actionnaires"],
          complementsGouvernance: ["Identité des dirigeants", "Membres du bureau / conseil", "Pouvoirs de signature"],
          directionEffective: "Adresse de direction effective (si différente du siège)"
        },
        TRUST: {
          socle: ["Nature juridique du dispositif", "Identité du constituant", "Identité du(des) trustee(s)", "Identité des bénéficiaires", "Identité du protecteur (si applicable)"],
          complements: ["Objet et finalité du trust", "Loi applicable et juridiction"]
        },
        purposeNatureBase: ["Objet de la relation d'affaires", "Nature de la relation d'affaires", "Origine des fonds (déclaratif)"]
      },

      documents: {
        PF: {
          base: ["Pièce d'identité en cours de validité", "Justificatif de domicile récent (selon procédure interne et approche par les risques — non obligatoire au sens strict du CMF)"],
          distance: ["Second justificatif ou mesure complémentaire (entrée à distance)"]
        },
        PM: {
          FR: {
            commerciale: ["Extrait Kbis récent (souvent < 3 mois selon politique interne)", "Statuts certifiés conformes", "PI du représentant légal", "Justificatif siège (si non visible Kbis)"],
            civile: ["Extrait Kbis ou RCS", "Statuts certifiés conformes", "PI du gérant"],
            sel: ["Extrait Kbis récent", "Statuts certifiés conformes", "PI du représentant légal", "Justificatif inscription Ordre"],
            association: ["Statuts à jour", "Récépissé préfecture (RNA) / JOAFE", "Liste membres du bureau", "PV désignation dirigeants", "PI du représentant", "Pouvoirs / délégation"],
            fondation: ["Statuts ou acte constitutif", "Décret / décision de création", "Liste administrateurs", "PV nomination dirigeants", "PI du représentant", "Pouvoirs / délégation"],
            gie: ["Extrait Kbis récent", "Contrat constitutif / statuts", "Liste des membres", "PI du représentant", "Pouvoirs / délégation"],
            publique: ["Acte de nomination", "Délégation de pouvoirs", "PI du représentant"],
            ei: ["Avis INSEE / SIRENE", "PI de l'entrepreneur", "Justificatif domiciliation"],
            creation: ["Projet de statuts", "Attestation de dépôt des fonds", "PI du fondateur", "Récépissé de dépôt CFE"],
            succursale: ["Extrait immatriculation succursale", "Statuts société mère", "Extrait registre société mère"]
          },
          UE: {
            base: ["Extrait registre local récent", "Statuts (traduits)", "PI du représentant", "Justificatif siège"],
            succursale: ["Extrait immatriculation succursale", "Extrait registre société mère", "Statuts société mère"]
          },
          HORSUE: {
            base: ["Extrait registre (apostille/légalisé)", "Statuts (traduits, certifiés)", "PI du représentant", "Justificatif siège", "Certificat de validité juridique ou équivalent (enregistrement registre officiel)"],
            succursale: ["Extrait immatriculation succursale FR", "Documents société mère"]
          },
          common: { beCotee: "Justificatif de cotation", pouvoirs: "Justificatif des pouvoirs (PV, délégation)" }
        },
        TRUST: ["Acte constitutif du trust", "Pièce d'identité du trustee", "Pièce d'identité du constituant", "Justificatif d'identité des bénéficiaires", "Pièce d'identité du protecteur (si désigné)", "Justificatif d'origine des fonds apportés au trust", "Organigramme du dispositif (constituant → trustee(s) → bénéficiaires)"]
      },

      verifications: {
        base: ["Screening sanctions (UE, ONU — OFAC si nexus US)", "Screening PEP", "Vérification pays à risque", "Cohérence économique"],
        BE: "Identification et vérification des BE (chaîne de contrôle)",
        BECotee: "Vérification marché réglementé (cotation)",
        TRUST: "Vérification des parties prenantes au trust",
      },

      evidences: {
        screening: "Rapport / log de screening (sanctions, PEP)",
        OFAC: "Preuve screening OFAC",
        distance: ["Preuves vérification à distance", "Trace facteurs authentification"],
        BE: ["Justificatifs identification BE", "Trace vérification chaîne de contrôle", "Documentation si structure complexe"],
        BECotee: "Justification traitement BE (cotation) + preuve",
        gouvernance: ["Justificatifs identification dirigeants", "Trace vérification pouvoirs", "Documentation fonctionnement statutaire"],
        TRUST: ["Acte constitutif du trust conservé au dossier", "Preuves d'identification des parties", "Justification économique documentée"],
        PPE: ["Preuve validation hiérarchique", "Rapport screening PEP détaillé", "Justification entrée/maintien de la relation"],
        mandataire: "Trace vérification pouvoirs du mandataire + lien avec l'entité"
      },

      // v7.4: PPE - Documents et vérifications supplémentaires
      PPE: {
        infos: ["Fonction/mandat exercé(e)", "Période d'exercice du mandat", "Lien avec le client (si proche/associé)"],
        documents: ["Déclaration d'origine de patrimoine", "Justificatifs des sources de revenus/patrimoine"],
        verifications: ["Screening PEP renforcé (bases dédiées)", "Validation hiérarchique documentée", "Revue du profil de risque"],
        evidences: ["Preuve validation hiérarchique (email/PV)", "Rapport screening PEP détaillé", "Note de synthèse risque PPE"]
      },

      // v7.4: Mandataire - KYC complet
      mandataire: {
        infos: ["Identité complète du mandataire", "Fonction au sein de l'entité", "Périmètre des pouvoirs délégués"],
        documents: ["PI du mandataire en cours de validité", "Pouvoir/délégation spécifique signé", "Justificatif du lien avec l'entité (contrat, organigramme)"],
        verifications: ["Screening sanctions/PEP du mandataire", "Vérification authenticité du pouvoir", "Cohérence avec les statuts/Kbis"],
        evidences: ["Copie pouvoir daté et signé", "Rapport screening mandataire", "Trace vérification du lien"]
      },

      // v7.4: Mode révision périodique - Éléments à actualiser
      revision: {
        infosPF: ["Vérifier adresse actuelle", "Confirmer situation professionnelle", "Actualiser revenus/patrimoine si significatif"],
        infosPM: ["Vérifier dirigeants actuels", "Confirmer actionnariat/BE", "Actualiser activité si évolution"],
        documentsPF: ["PI si expirée ou bientôt expirée", "Actualisation justificatif de domicile"],
        documentsPM: ["Kbis/extrait registre récent (< 3 mois — pratique de place, non imposé par les textes)", "PI si expirée ou bientôt expirée", "Actualisation justificatif de siège"],
        documentsTRUST: ["PI du trustee si expirée", "Acte constitutif actualisé (si modification)", "Actualisation identité des bénéficiaires"],
        verifications: ["Re-screening sanctions/PEP (tous)", "Vérifier évolution pays à risque", "Contrôle cohérence activité/opérations"],
        evidences: ["Rapport screening actualisé", "Note de revue périodique", "Historique des changements identifiés"]
      },

      pointsACPR: [
        "Distinguer identification et vérification",
        "Documenter les mesures prises",
        "Conserver copies et preuves (5 ans)",
        "Adapter l'intensité au risque (L.561-4-1 CMF)",
        "PPE : maintenir la vigilance renforcée au moins 12 mois après la fin du mandat (L.561-46 CMF)",
        "En cas de doute : ne pas entrer en relation"
      ],
      pointACPROccasionnel: "Occasionnel : appliquer seuils procédure interne",
      noteAssoFondation: "Association/Fondation : pas d'actionnariat. Documenter dirigeants, pouvoirs de signature et contrôle effectif.",

      // TIPS PAR SECTION (générés selon contexte)
      helpTips: {
        A1: {
          base: "Si une info est manquante, documenter le motif et la source alternative utilisée.",
          foreign: "Pour entité UE/Hors UE : adapter les libellés au contexte local (company number, registration ID...).",
          creation: "Société en création : collecter projet de statuts, attestation de dépôt de capital, identité des fondateurs."
        },
        A2: {
          base: "L'origine des fonds doit être cohérente avec le profil (activité, revenus, patrimoine).",
          complex: "Structure complexe : documenter chaque niveau de détention avec justificatifs.",
          trust: "Trust/Fiducie : identifier constituant, trustees, bénéficiaires, protecteur le cas échéant."
        },
        B: {
          base: "Privilégier les documents récents (&lt;3 mois) et les sources officielles.",
          foreign: "Hors UE : vérifier si apostille ou légalisation requise. Traduction assermentée si nécessaire.",
          remote: "À distance : le justificatif de domicile ne constitue pas une mesure de confirmation d'identité au sens des LD ACPR (pp. 12-15). Privilégier les mesures listées à l'article R.561-20.",
          creation: "En création : attestation de dépôt des fonds, projet de statuts, récépissé d'immatriculation."
        },
        C: {
          base: "Cribler toutes les personnes : représentants légaux, BE, signataires, mandataires.",
          ofac: "Nexus US (OFAC) : screening complémentaire sur listes US (SDN, OFAC, BIS).",
          foreign: "Entité étrangère : vérifier registre BE local si disponible + sources internationales."
        },
        D: {
          base: "Conserver : date de vérification, source, capture/rapport, identité du vérificateur.",
          foreign: "Entité étrangère : URL du registre consulté + capture écran horodatée.",
          remote: "À distance : preuve de la vérification d'identité (rapport provider, IBAN validé)."
        }
      }
    };

    // ========================================
    // STATE
    // ========================================
    let currentResults = null;
    let lastLegalFormCountry = null;
    let lastClientType = null;
    let lastFamily = null;
    let lastCanGenerate = false;
    let checkedItems = new Set();
    let restoredCheckedItems = null; // Pour restaurer les items cochés après génération

    const STORAGE_KEY = 'documentCollector';

    // Génère un ID stable basé sur le texte (hash simple)
    function generateStableId(sectionId, text) {
      // Créer un hash court du texte pour un ID stable
      let hash = 0;
      const str = text.toLowerCase().replace(/\s+/g, '');
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return `${sectionId}-${Math.abs(hash).toString(36)}`;
    }

    // ========================================
    // NEWSLETTER
    // ========================================
    let isSubmittingNewsletter = false; // Prevent double submission
    
    async function sendEmailToWebhook(email) {
      if (!CONFIG.emailWebhook) {
        // Dev mode only - no email logging in prod
        if (typeof console !== 'undefined' && !CONFIG.emailWebhook) {
          console.log('📧 Newsletter (dev mode, webhook not configured)');
        }
        return { success: true, dev: true };
      }
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.webhookTimeout);
      
      try {
        const response = await fetch(CONFIG.emailWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            newsletter: true,
            source: 'document-collector',
            version: CONFIG.version,
            timestamp: new Date().toISOString()
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        return { success: response.ok };
      } catch (err) {
        clearTimeout(timeoutId);
        return { success: false, error: err.name === 'AbortError' ? 'timeout' : 'network' };
      }
    }

    async function subscribeNewsletter() {
      if (isSubmittingNewsletter) return; // Prevent double submit
      
      const input = document.getElementById('newsletterEmail');
      const btn = document.querySelector('.newsletter-cta-btn');
      const email = input.value.trim();
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        input.style.borderColor = 'var(--warning)';
        return;
      }
      
      // Disable button during submission
      isSubmittingNewsletter = true;
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Envoi...';
      }
      
      const result = await sendEmailToWebhook(email);
      
      // Update CTA based on result
      const cta = document.getElementById('newsletterCta');
      if (result.success) {
        cta.classList.add('subscribed');
        cta.innerHTML = `
          <h3 class="newsletter-cta-title">✅ Vous êtes inscrit(e) !</h3>
          <p class="newsletter-cta-text">Vous recevrez la veille réglementaire chaque semaine.</p>
        `;
      } else {
        // Show error but allow retry
        isSubmittingNewsletter = false;
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Réessayer';
        }
        input.style.borderColor = 'var(--danger)';
        // Add error message if not exists
        let errorMsg = cta.querySelector('.newsletter-error');
        if (!errorMsg) {
          errorMsg = document.createElement('p');
          errorMsg.className = 'newsletter-error';
          errorMsg.style.cssText = 'color:var(--danger);font-size:12px;margin-top:8px;';
          cta.appendChild(errorMsg);
        }
        errorMsg.textContent = result.error === 'timeout' ? 'Délai dépassé. Réessayez.' : 'Erreur réseau. Réessayez.';
      }
    }

    // ========================================
    // UTILITY FUNCTIONS
    // ========================================
    function mapLegalFormToFamily(legalForm) {
      return CONFIG.legalFormToFamily[legalForm] || 'autre';
    }

    function getEffectiveFamily(family) {
      return family === 'autre' ? 'commerciale' : family;
    }

    function isCoteeApplicable(family, statut) {
      return CONFIG.coteeApplicableFamilies.includes(getEffectiveFamily(family)) && statut !== 'creation';
    }

    function isDetentionApplicable(family) {
      return CONFIG.detentionApplicableFamilies.includes(getEffectiveFamily(family));
    }

    function isAssoFondation(family) {
      return CONFIG.assoFondationFamilies.includes(family);
    }

    function isNoBEFamily(family) {
      return CONFIG.noBEFamilies.includes(family);
    }

    function isDirDiffRequired(pays, statut, detention) {
      return pays === 'HORSUE' || (detention === 'complexe' && statut !== 'creation');
    }

    // ========================================
    // FORM
    // ========================================
    function getFormValues() {
      const legalForm = document.getElementById('legalForm').value;
      const family = mapLegalFormToFamily(legalForm);
      const clientTypeEl = document.querySelector('input[name="clientType"]:checked');

      return {
        organisation: document.getElementById('organisation').value,
        canal: document.getElementById('canal').value,
        relation: (document.getElementById('relation') || {}).value || 'affaires',
        expositionUS: document.getElementById('expositionUS').value,
        clientType: clientTypeEl ? clientTypeEl.value : null,
        pays: document.getElementById('pays').value,
        statut: document.getElementById('statut').value,
        legalForm,
        family,
        effectiveFamily: getEffectiveFamily(family),
        cotee: document.getElementById('cotee').value,
        detention: document.getElementById('detention').value,
        dirDiff: document.getElementById('dirDiff').value,
        signataireDifferent: document.getElementById('signataireDifferent').value,
        // v7.4: Nouveaux champs
        ppeStatus: document.getElementById('ppeStatus')?.value || '',
        revisionMode: document.getElementById('toggleRevisionMode')?.checked || false,
        // v7.5: Pays détaillé (code ISO2 si HORSUE)
        paysDetail: document.getElementById('pays-detail')?.value || ''
      };
    }

    function populateLegalFormOptions(pays, forceReset) {
      if (pays === lastLegalFormCountry && !forceReset) return;

      const select = document.getElementById('legalForm');
      const label = document.getElementById('legalFormLabel');
      
      select.innerHTML = '<option value="">Sélectionner</option>';
      const options = CONFIG.legalFormOptions[pays] || CONFIG.legalFormOptions.FR;

      label.textContent = pays === 'FR' ? 'Forme juridique' : pays === 'UE' ? 'Forme juridique (UE)' : 'Forme juridique (Hors UE)';

      options.forEach(group => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = group.group;
        group.options.forEach(opt => {
          const option = document.createElement('option');
          option.value = opt.value;
          option.textContent = opt.label;
          optgroup.appendChild(option);
        });
        select.appendChild(optgroup);
      });

      lastLegalFormCountry = pays;
    }

    function onPaysChange() {
      const pays = document.getElementById('pays').value;
      if (pays) populateLegalFormOptions(pays);

      // Afficher/masquer le sélecteur pays détaillé
      const detailWrap = document.getElementById('pays-detail-wrap');
      if (detailWrap) {
        if (pays === 'HORSUE') {
          detailWrap.style.display = 'block';
        } else {
          detailWrap.style.display = 'none';
          document.getElementById('pays-detail').value = '';
        }
      }

      updateForeignToggleVisibility();
      updateForm();
    }

    function resetConditionalValues() {
      document.getElementById('cotee').value = '';
      document.getElementById('detention').value = '';
      document.getElementById('dirDiff').value = '';
    }

    function updateForm() {
      const v = getFormValues();
      const isPM = v.clientType === 'PM';

      if (lastClientType !== v.clientType) {
        resetConditionalValues();
        document.getElementById('pays').value = '';
        document.getElementById('legalForm').value = '';
        document.getElementById('statut').value = '';
        document.getElementById('signataireDifferent').value = '';
        lastFamily = null;
      }
      lastClientType = v.clientType;

      document.getElementById('kybDetails').classList.toggle('hidden', !isPM);

      if (!isPM) {
        ['coteeGroup', 'detentionGroup', 'dirDiffGroup', 'signataireGroup'].forEach(id => 
          document.getElementById(id).classList.add('hidden')
        );
        updateProgressBar();
        tryAutoGenerate();
        return;
      }

      if (v.pays) populateLegalFormOptions(v.pays);

      if (lastFamily !== null && lastFamily !== v.family) resetConditionalValues();
      lastFamily = v.family;

      const updatedV = getFormValues();
      const hasLegalForm = !!updatedV.legalForm;

      document.getElementById('structureSection').classList.toggle('hidden', !hasLegalForm);
      document.getElementById('representationSection').classList.toggle('hidden', !hasLegalForm);
      document.getElementById('signataireGroup').classList.toggle('hidden', !hasLegalForm);

      const showCotee = hasLegalForm && isCoteeApplicable(updatedV.family, updatedV.statut);
      document.getElementById('coteeGroup').classList.toggle('hidden', !showCotee);
      if (!showCotee) document.getElementById('cotee').value = '';

      const showDetention = hasLegalForm && isDetentionApplicable(updatedV.family);
      document.getElementById('detentionGroup').classList.toggle('hidden', !showDetention);
      if (!showDetention) document.getElementById('detention').value = '';

      document.getElementById('dirDiffGroup').classList.toggle('hidden', !hasLegalForm);
      document.getElementById('dirDiffLabel').classList.toggle('required', 
        isDirDiffRequired(updatedV.pays, updatedV.statut, updatedV.detention));

      updateProgressBar();
      tryAutoGenerate();
    }

    // ========================================
    // PROGRESS & NAVIGATION
    // ========================================
    function updateProgressBar() {
      const v = getFormValues();
      const steps = document.querySelectorAll('.progress-step');

      const step1Complete = v.organisation && v.canal && v.relation && v.expositionUS;
      steps[0].classList.toggle('completed', step1Complete);
      steps[0].classList.toggle('active', !step1Complete);

      const step2Complete = !!v.clientType;
      steps[1].classList.toggle('completed', step2Complete);
      steps[1].classList.toggle('active', step1Complete && !step2Complete);

      let step3Complete = false;
      if (v.clientType === 'PM') {
        step3Complete = v.pays && v.legalForm && v.statut;
      } else if (v.clientType) {
        step3Complete = true;
      }
      steps[2].classList.toggle('completed', step3Complete);
      steps[2].classList.toggle('active', step2Complete && !step3Complete && v.clientType === 'PM');

      document.getElementById('card1').classList.toggle('highlight', !step1Complete);
      document.getElementById('card2').classList.toggle('highlight', step1Complete && !step2Complete);
      const kybCard = document.getElementById('kybDetails');
      if (!kybCard.classList.contains('hidden')) {
        kybCard.classList.toggle('highlight', step2Complete && !step3Complete);
      }
    }

    function goToStep(step) {
      const targets = ['card1', 'card2', 'kybDetails'];
      const el = document.getElementById(targets[step - 1]);
      if (el && !el.classList.contains('hidden')) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    // ========================================
    // ACCORDIONS
    // ========================================
    function toggleAccordion(header) {
      const accordion = header.parentElement;
      const isOpen = accordion.classList.toggle('open');
      header.setAttribute('aria-expanded', isOpen);
    }

    function handleAccordionKey(event, header) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleAccordion(header);
      }
    }

    // ========================================
    // DROPDOWN
    // ========================================
    function toggleDropdown() {
      document.getElementById('exportDropdown').classList.toggle('open');
    }

    document.addEventListener('click', e => {
      const dropdown = document.getElementById('exportDropdown');
      if (!dropdown.contains(e.target)) dropdown.classList.remove('open');
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        document.getElementById('exportDropdown').classList.remove('open');
        document.querySelectorAll('.modal-overlay.open').forEach(m => {
          m.classList.remove('open');
          document.body.style.overflow = '';
        });
      }
    });

    // ========================================
    // CHECKLIST
    // ========================================
    function toggleCheckItem(li) {
      const itemId = li.dataset.itemId;
      const isChecked = li.classList.toggle('checked');
      li.setAttribute('aria-checked', isChecked);
      
      if (isChecked) checkedItems.add(itemId);
      else checkedItems.delete(itemId);
      
      updateChecklistProgress();
      saveFormOnChange();
    }

    function toggleAllInSection(checklistId, check) {
      const checklist = document.getElementById(checklistId);
      if (!checklist) return;
      
      checklist.querySelectorAll('li[data-item-id]').forEach(li => {
        const itemId = li.dataset.itemId;
        if (check) {
          li.classList.add('checked');
          li.setAttribute('aria-checked', 'true');
          checkedItems.add(itemId);
        } else {
          li.classList.remove('checked');
          li.setAttribute('aria-checked', 'false');
          checkedItems.delete(itemId);
        }
      });
      
      updateChecklistProgress();
      saveFormOnChange();
    }

    function updateChecklistProgress() {
      const total = document.querySelectorAll('.checklist li[data-item-id]').length;
      const checked = checkedItems.size;
      const percent = total > 0 ? Math.round((checked / total) * 100) : 0;
      
      document.getElementById('checkedCount').textContent = checked;
      document.getElementById('totalCount').textContent = total;
      document.getElementById('progressPercent').textContent = percent + '%';
      
      // Update SVG circle (circumference = 100)
      const circle = document.getElementById('progressCircle');
      if (circle) {
        const offset = 100 - percent;
        circle.style.strokeDashoffset = offset;
      }
    }

    // ========================================
    // PERSONAS
    // ========================================
    function selectPersona(type) {
      // Update visual state
      document.querySelectorAll('.persona-card').forEach(card => {
        card.classList.toggle('active', card.dataset.persona === type);
      });
      
      // Pre-fill organisation
      const orgSelect = document.getElementById('organisation');
      if (orgSelect) {
        orgSelect.value = type;
        updateForm();
      }
      
      // Scroll to form
      document.getElementById('card1').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ========================================
    // AUTO-GENERATION
    // ========================================
    function canGenerate() {
      const v = getFormValues();
      if (!v.organisation || !v.canal || !v.relation || !v.expositionUS || !v.clientType) return false;
      if (v.clientType === 'PF' || v.clientType === 'TRUST') return true;
      if (v.clientType === 'PM') {
        if (!v.pays || !v.statut || !v.legalForm || !v.signataireDifferent) return false;
        if (isCoteeApplicable(v.family, v.statut) && !v.cotee) return false;
        if (isDetentionApplicable(v.family) && !v.detention) return false;
        if (isDirDiffRequired(v.pays, v.statut, v.detention) && !v.dirDiff) return false;
        return true;
      }
      return false;
    }

    function tryAutoGenerate() {
      const nowCanGenerate = canGenerate();
      const resultsHidden = document.getElementById('results').classList.contains('hidden');
      const v = getFormValues();
      
      const shouldScroll = (!lastCanGenerate && nowCanGenerate) || resultsHidden;

      if (nowCanGenerate) {
        setTimeout(() => {
          if (canGenerate()) generateResultsAuto(shouldScroll);
        }, 150);
      }
      lastCanGenerate = nowCanGenerate;
    }

    function generateResultsAuto(shouldScroll) {
      const v = getFormValues();
      
      // Sauvegarder les items cochés avant de clear (pour migration d'anciens IDs)
      const previousCheckedItems = new Set(checkedItems);
      checkedItems.clear();
      
      // Si on a des items restaurés, les réappliquer
      if (restoredCheckedItems) {
        restoredCheckedItems.forEach(id => checkedItems.add(id));
      }

      const infos = buildInfosList(v);
      const docs = buildDocsList(v);
      const verifs = buildVerificationsList(v);
      const evs = buildEvidencesList(v);
      const acpr = buildACPRPoints(v);
      const showNote = v.clientType === 'PM' && isAssoFondation(v.family);

      currentResults = {
        context: v,
        socle: infos.socle,
        complements: infos.complements,
        documents: docs,
        verifications: verifs,
        evidences: evs,
        acprPoints: acpr,
        showAssoFondationNote: showNote,
        timestamp: new Date().toISOString()
      };

      renderChecklist('socleChecklist', infos.socle, 'countA1');
      renderChecklist('complementsChecklist', infos.complements, 'countA2');
      renderChecklist('docsChecklist', docs, 'countB');
      renderChecklist('verificationsChecklist', verifs, 'countC');
      renderChecklist('evidencesChecklist', evs, 'countD');
      renderACPRPoints(acpr);

      document.getElementById('noteAssoFondation').classList.toggle('hidden', !showNote);
      document.getElementById('results').classList.remove('hidden');

      updateChecklistProgress();
      updateProgressBar();
      
      // v7.3: Mettre à jour les nouveaux éléments (avec protection)
      try {
        updateNextActions(v);
        updateTipsContent(v);
        updateEmailTemplates();
      } catch (e) {
        console.warn('v7.3 features error:', e);
      }

      // v7.4: Mettre à jour scoring risque et alertes
      try {
        updateRiskScore(v);
        updatePPEAlert(v);
        updateRevisionModeAlert(v);
        checkPaysAlerte(v.paysDetail);
        checkNexusUSAlerte(v);
      } catch (e) {
        console.warn('v7.4 features error:', e);
      }
      
      // Reset restoredCheckedItems après première application
      restoredCheckedItems = null;

      if (shouldScroll) {
        document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      // Mettre à jour le label du bouton après première génération
      const btnGenerate = document.getElementById('btnGenerate');
      if (btnGenerate) btnGenerate.textContent = 'Régénérer';
    }

    function generateResults() {
      if (!canGenerate()) {
        alert('Veuillez compléter tous les champs requis.');
        return;
      }
      generateResultsAuto(true);
    }

    // ========================================
    // BUILD LISTS
    // ========================================
    function buildInfosList(v) {
      const r = { socle: [], complements: [] };
      const isRevision = v.revisionMode;

      if (v.clientType === 'PF') {
        r.socle = isRevision ? [...CONFIG.revision.infosPF] : [...CONFIG.infosCMF.PF.socle];
        r.complements = [...CONFIG.infosCMF.PF.complements];
      } else if (v.clientType === 'PM') {
        r.socle = isRevision ? [...CONFIG.revision.infosPM] : [...CONFIG.infosCMF.PM.socle];
        const family = v.effectiveFamily;

        if (isAssoFondation(v.family)) {
          r.complements = [...CONFIG.infosCMF.PM.complementsGouvernance];
        } else if (isCoteeApplicable(v.family, v.statut) && v.cotee === 'oui') {
          r.complements = [...CONFIG.infosCMF.PM.complementsCotee];
        } else if (!isNoBEFamily(family)) {
          r.complements = [...CONFIG.infosCMF.PM.complementsBE];
        }

        if (v.dirDiff === 'non') {
          r.complements.push(CONFIG.infosCMF.PM.directionEffective);
        }

        // v7.4: Mandataire - infos complémentaires
        if (v.signataireDifferent === 'different') {
          r.complements = [...r.complements, ...CONFIG.mandataire.infos];
        }
      } else if (v.clientType === 'TRUST') {
        r.socle = [...CONFIG.infosCMF.TRUST.socle];
        r.complements = [...CONFIG.infosCMF.TRUST.complements];
      }

      // v7.4: PPE - infos complémentaires
      if (v.ppeStatus && v.ppeStatus !== '') {
        r.complements = [...r.complements, ...CONFIG.PPE.infos];
      }

      r.complements = [...r.complements, ...CONFIG.infosCMF.purposeNatureBase];
      if (v.organisation && CONFIG.organisationComplements[v.organisation]) {
        r.complements.push(CONFIG.organisationComplements[v.organisation].purposeNature);
      }

      return r;
    }

    function buildDocsList(v) {
      let docs = [];
      const isRevision = v.revisionMode;

      if (v.clientType === 'PF') {
        docs = [...CONFIG.documents.PF.base];
        if (v.canal === 'distance') docs = [...docs, ...CONFIG.documents.PF.distance];
      } else if (v.clientType === 'PM') {
        const region = v.pays;
        const family = v.effectiveFamily;

        if (region === 'FR') {
          const regionDocs = CONFIG.documents.PM.FR;
          if (v.statut === 'creation') docs = [...regionDocs.creation];
          else if (v.statut === 'succursale') docs = [...regionDocs.succursale];
          else docs = [...(regionDocs[family] || regionDocs.commerciale)];
        } else if (region === 'UE') {
          docs = v.statut === 'succursale' ? [...CONFIG.documents.PM.UE.succursale] : [...CONFIG.documents.PM.UE.base];
        } else {
          docs = v.statut === 'succursale' ? [...CONFIG.documents.PM.HORSUE.succursale] : [...CONFIG.documents.PM.HORSUE.base];
        }

        if (isCoteeApplicable(v.family, v.statut) && v.cotee === 'oui') {
          docs.push(CONFIG.documents.PM.common.beCotee);
        }
        if (v.signataireDifferent === 'different') {
          docs.push(CONFIG.documents.PM.common.pouvoirs);
          // v7.4: Mandataire - documents complémentaires
          docs = [...docs, ...CONFIG.mandataire.documents];
        }
      } else if (v.clientType === 'TRUST') {
        docs = [...CONFIG.documents.TRUST];
      }

      // v7.4: PPE - documents complémentaires
      if (v.ppeStatus && v.ppeStatus !== '') {
        docs = [...docs, ...CONFIG.PPE.documents];
      }

      // v7.4: Mode révision - documents à actualiser (par type de client)
      if (isRevision) {
        if (v.clientType === 'PF') docs = [...docs, ...CONFIG.revision.documentsPF];
        else if (v.clientType === 'TRUST') docs = [...docs, ...CONFIG.revision.documentsTRUST];
        else docs = [...docs, ...CONFIG.revision.documentsPM];
      }

      return docs;
    }

    function buildVerificationsList(v) {
      const verifs = [...CONFIG.verifications.base];
      const isRevision = v.revisionMode;

      if (v.expositionUS === 'oui') verifs.push('Vérification OFAC renforcée');

      if (v.clientType === 'PM') {
        const family = v.effectiveFamily;
        if (!isNoBEFamily(family)) {
          if (isCoteeApplicable(v.family, v.statut) && v.cotee === 'oui') {
            verifs.push(CONFIG.verifications.BECotee);
          } else if (!isAssoFondation(v.family)) {
            verifs.push(CONFIG.verifications.BE);
          }
        }
        // v7.4: Mandataire - vérifications
        if (v.signataireDifferent === 'different') {
          verifs.push(...CONFIG.mandataire.verifications);
        }
      } else if (v.clientType === 'TRUST') {
        verifs.push(CONFIG.verifications.TRUST);
      }

      // v7.4: PPE - vérifications renforcées
      if (v.ppeStatus && v.ppeStatus !== '') {
        verifs.push(...CONFIG.PPE.verifications);
      }

      // v7.4: Mode révision - vérifications à renouveler
      if (isRevision) {
        verifs.push(...CONFIG.revision.verifications);
      }

      return verifs;
    }

    function buildEvidencesList(v) {
      let evs = [CONFIG.evidences.screening];
      const isRevision = v.revisionMode;

      if (v.expositionUS === 'oui') evs.push(CONFIG.evidences.OFAC);
      if (v.canal === 'distance') evs = [...evs, ...CONFIG.evidences.distance];

      if (v.clientType === 'PM') {
        const family = v.effectiveFamily;
        if (isAssoFondation(v.family)) {
          evs = [...evs, ...CONFIG.evidences.gouvernance];
        } else if (!isNoBEFamily(family)) {
          if (isCoteeApplicable(v.family, v.statut) && v.cotee === 'oui') {
            evs.push(CONFIG.evidences.BECotee);
          } else {
            evs = [...evs, ...CONFIG.evidences.BE];
          }
        }
        // v7.4: Mandataire - preuves
        if (v.signataireDifferent === 'different') {
          evs.push(...CONFIG.mandataire.evidences);
        }
      } else if (v.clientType === 'TRUST') {
        evs = [...evs, ...CONFIG.evidences.TRUST];
      }

      // v7.4: PPE - preuves
      if (v.ppeStatus && v.ppeStatus !== '') {
        evs.push(...CONFIG.PPE.evidences);
      }

      // v7.4: Mode révision - preuves
      if (isRevision) {
        evs.push(...CONFIG.revision.evidences);
      }

      return evs;
    }

    function buildACPRPoints(v) {
      const points = [...CONFIG.pointsACPR];
      if (v.relation === 'occasionnelle') points.push(CONFIG.pointACPROccasionnel);
      return points;
    }

    // ========================================
    // RENDER
    // ========================================
    function renderChecklist(id, items, countId) {
      const el = document.getElementById(id);
      el.innerHTML = '';

      if (!items || items.length === 0) {
        el.innerHTML = '<li style="color:var(--text-muted);font-style:italic;cursor:default;">Aucun élément</li>';
        document.getElementById(countId).textContent = '0';
        return;
      }

      items.forEach((item) => {
        const li = document.createElement('li');
        const itemId = generateStableId(id, item);
        li.dataset.itemId = itemId;
        li.setAttribute('role', 'checkbox');
        li.setAttribute('tabindex', '0');
        li.setAttribute('aria-checked', 'false');

        li.addEventListener('click', (e) => {
          if (e.target.closest('.source-icon')) return; // Ne pas toggle si clic sur ⓘ
          toggleCheckItem(li);
        });
        li.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleCheckItem(li);
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const next = li.nextElementSibling;
            if (next && next.hasAttribute('data-item-id')) next.focus();
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = li.previousElementSibling;
            if (prev && prev.hasAttribute('data-item-id')) prev.focus();
          }
        });

        if (checkedItems.has(itemId)) {
          li.classList.add('checked');
          li.setAttribute('aria-checked', 'true');
        }

        const source = CONFIG.sources && CONFIG.sources[item];
    const sourceIcon = source
      ? `<a href="${source.url}" target="_blank" rel="noopener" class="source-icon" title="${source.ref}" aria-label="Source : ${source.ref}">ⓘ</a>`
      : '';
    li.innerHTML = `<span class="check-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></span><span class="check-text">${item}</span>${sourceIcon}`;
        el.appendChild(li);
      });

      document.getElementById(countId).textContent = items.length;
    }

    function renderACPRPoints(pts) {
      const el = document.getElementById('acprPoints');
      el.innerHTML = '';
      pts.forEach(p => {
        const li = document.createElement('li');
        li.textContent = p;
        el.appendChild(li);
      });
    }

    // ========================================
    // EXPORTS
    // ========================================
    function download(fn, content, mime) {
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fn;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function exportJSON() {
      const excludeContext = document.getElementById('toggleExportNoContext')?.checked;
      const dossierRef = document.getElementById('dossierRef')?.value?.trim() || '';
      const dossierNotes = document.getElementById('dossierNotes')?.value?.trim() || '';
      
      // Foreign entity info only if toggle is enabled
      const foreignEnabled = isForeignEntityEnabled();
      const registryUrl = foreignEnabled ? (document.getElementById('registryUrl')?.value?.trim() || '') : '';
      const verificationDate = foreignEnabled ? (document.getElementById('verificationDate')?.value || '') : '';
      
      // Helper to remove null/undefined/empty values from object
      const cleanObject = (obj) => {
        const cleaned = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value !== null && value !== undefined && value !== '') {
            if (Array.isArray(value) && value.length === 0) continue;
            cleaned[key] = value;
          }
        }
        return cleaned;
      };
      
      const meta = cleanObject({ 
        tool: 'Document Collector', 
        version: CONFIG.version, 
        scope: CONFIG.scope, 
        exportDate: new Date().toISOString(),
        dossierRef: dossierRef
      });
      
      const data = {
        meta,
        checklistSocle: currentResults.socle,
        checklistComplements: currentResults.complements,
        checklistDocuments: currentResults.documents,
        checklistVerifications: currentResults.verifications,
        checklistEvidences: currentResults.evidences,
        pointsACPR: currentResults.acprPoints
      };
      
      // Add notes (asso/fondation + user notes)
      const allNotes = [];
      if (currentResults.showAssoFondationNote) allNotes.push(CONFIG.noteAssoFondation);
      if (dossierNotes) allNotes.push(dossierNotes);
      if (allNotes.length) data.notes = allNotes;
      
      // Add foreign registry proof if enabled and present
      if (foreignEnabled && (registryUrl || verificationDate)) {
        data.foreignRegistryProof = cleanObject({
          registryUrl: registryUrl,
          verificationDate: verificationDate
        });
      }
      
      // Add context only if not excluded and clean it
      if (!excludeContext && currentResults.context) {
        data.context = cleanObject(currentResults.context);
      }
      
      const filename = dossierRef ? `checklist-${slugify(dossierRef)}.json` : `checklist-kyc-${new Date().toISOString().slice(0,10)}.json`;
      download(filename, JSON.stringify(data, null, 2), 'application/json');
    }

    function slugify(text) {
      return text.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50);
    }

    function sanitizeCSV(value) {
      if (typeof value !== 'string') return value;
      let safe = value.replace(/"/g, '""');
      if (/^[=+\-@]/.test(safe)) safe = "'" + safe;
      return safe;
    }

    function exportCSV() {
      const excludeContext = document.getElementById('toggleExportNoContext')?.checked;
      const dossierRef = document.getElementById('dossierRef')?.value?.trim() || '';
      const dossierNotes = document.getElementById('dossierNotes')?.value?.trim() || '';
      
      // Foreign entity info only if toggle is enabled
      const foreignEnabled = isForeignEntityEnabled();
      const registryUrl = foreignEnabled ? (document.getElementById('registryUrl')?.value?.trim() || '') : '';
      const verificationDate = foreignEnabled ? (document.getElementById('verificationDate')?.value || '') : '';
      
      let csv = 'Section,Element\n';
      csv += `Meta,"Document Collector v${CONFIG.version}"\n`;
      csv += `Meta,"${new Date().toISOString()}"\n`;
      if (dossierRef) csv += `Meta,"Dossier: ${sanitizeCSV(dossierRef)}"\n`;

      if (!excludeContext) {
        Object.entries(currentResults.context).forEach(([k, val]) => {
          if (val) csv += `Contexte,"${sanitizeCSV(k + ': ' + val)}"\n`;
        });
        // Foreign registry proof (only if enabled)
        if (foreignEnabled && registryUrl) csv += `Contexte,"Registre vérifié: ${sanitizeCSV(registryUrl)}"\n`;
        if (foreignEnabled && verificationDate) csv += `Contexte,"Date vérification: ${sanitizeCSV(verificationDate)}"\n`;
      }

      currentResults.socle.forEach(i => csv += `A1-Socle,"${sanitizeCSV(i)}"\n`);
      currentResults.complements.forEach(i => csv += `A2-Complements,"${sanitizeCSV(i)}"\n`);
      if (currentResults.showAssoFondationNote) csv += `A2-Note,"${sanitizeCSV(CONFIG.noteAssoFondation)}"\n`;
      currentResults.documents.forEach(i => csv += `B-Documents,"${sanitizeCSV(i)}"\n`);
      currentResults.verifications.forEach(i => csv += `C-Verifications,"${sanitizeCSV(i)}"\n`);
      currentResults.evidences.forEach(i => csv += `D-Evidences,"${sanitizeCSV(i)}"\n`);
      currentResults.acprPoints.forEach(i => csv += `ACPR,"${sanitizeCSV(i)}"\n`);
      
      // Notes utilisateur
      if (dossierNotes) csv += `Notes,"${sanitizeCSV(dossierNotes)}"\n`;

      const filename = dossierRef ? `checklist-${slugify(dossierRef)}.csv` : `checklist-kyc-${new Date().toISOString().slice(0,10)}.csv`;
      download(filename, csv, 'text/csv');
    }

    function exportPDF() {
      // For a real PDF with references, you'd use a library like jsPDF
      // Here we'll do a print-optimized version
      alert('📄 Export PDF avec références réglementaires\n\nCette fonctionnalité génère un PDF brandé avec les articles CMF correspondants.\n\nPour cette démo, utilisez "Imprimer" > "Enregistrer en PDF".');
      printPage();
    }

    function printPage() {
      if (!currentResults) { alert('Générez d\'abord la checklist.'); return; }
      document.getElementById('exportDropdown').classList.remove('open');
      window.print();
    }

    // ========================================
    // RESET
    // ========================================
    function resetForm() {
      document.querySelectorAll('select').forEach(s => s.value = '');
      document.querySelectorAll('input[name="clientType"]').forEach(r => r.checked = false);

      lastLegalFormCountry = null;
      lastClientType = null;
      lastFamily = null;
      lastCanGenerate = false;
      currentResults = null;
      checkedItems.clear();

      ['kybDetails', 'coteeGroup', 'detentionGroup', 'dirDiffGroup', 'signataireGroup', 'results', 'noteAssoFondation'].forEach(id => 
        document.getElementById(id).classList.add('hidden')
      );

      populateLegalFormOptions('FR', true);
      updateProgressBar();
    }

    // ========================================
    // MODALS
    // ========================================
    function openModal(id) {
      const modal = document.getElementById(id);
      if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    }

    function closeModal(id) {
      const modal = document.getElementById(id);
      if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
      }
    }

    // ========================================
    // LOCAL STORAGE (with version migration)
    // ========================================
    function isLocalStorageEnabled() {
      return document.getElementById('toggleLocalStorage')?.checked || false;
    }

    function isLocalStorageAvailable() {
      try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch (e) {
        return false;
      }
    }

    function toggleLocalStorage() {
      const enabled = isLocalStorageEnabled();
      document.getElementById('btnClearStorage').style.display = enabled ? 'inline-flex' : 'none';
      if (enabled) saveToLocalStorage();
      try {
        if (isLocalStorageAvailable()) {
          localStorage.setItem(STORAGE_KEY + '_enabled', enabled ? '1' : '0');
        }
      } catch (e) {
        // Silently fail - user will need to re-enable next time
      }
    }

    function saveToLocalStorage() {
      if (!isLocalStorageEnabled() || !isLocalStorageAvailable()) return;
      try {
        const clientTypeEl = document.querySelector('input[name="clientType"]:checked');
        const data = {
          schemaVersion: CONFIG.schemaVersion, // For future migrations
          formValues: {
            organisation: document.getElementById('organisation')?.value || '',
            canal: document.getElementById('canal')?.value || '',
            relation: document.getElementById('relation')?.value || 'affaires',
            expositionUS: document.getElementById('expositionUS')?.value || '',
            clientType: clientTypeEl ? clientTypeEl.value : null,
            pays: document.getElementById('pays')?.value || '',
            statut: document.getElementById('statut')?.value || '',
            legalForm: document.getElementById('legalForm')?.value || '',
            cotee: document.getElementById('cotee')?.value || '',
            detention: document.getElementById('detention')?.value || '',
            signataireDifferent: document.getElementById('signataireDifferent')?.value || '',
            dirDiff: document.getElementById('dirDiff')?.value || '',
            dossierRef: document.getElementById('dossierRef')?.value || '',
            // v7.3: Nouveaux champs
            dossierNotes: document.getElementById('dossierNotes')?.value || '',
            foreignEntityEnabled: document.getElementById('toggleForeignEntity')?.checked || false,
            registryUrl: document.getElementById('registryUrl')?.value || '',
            verificationDate: document.getElementById('verificationDate')?.value || '',
            // v7.4: Nouveaux champs
            ppeStatus: document.getElementById('ppeStatus')?.value || '',
            revisionMode: document.getElementById('toggleRevisionMode')?.checked || false,
            // v7.5: Pays détaillé
            paysDetail: document.getElementById('pays-detail')?.value || ''
          },
          checkedItems: Array.from(checkedItems),
          timestamp: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        // Storage full or other error - silently fail
      }
    }

    function loadFromLocalStorage() {
      if (!isLocalStorageAvailable()) return false;
      try {
        if (localStorage.getItem(STORAGE_KEY + '_enabled') !== '1') return false;

        document.getElementById('toggleLocalStorage').checked = true;
        document.getElementById('btnClearStorage').style.display = 'inline-flex';

        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return false;

        const data = JSON.parse(stored);
        
        // Schema migration: ignore incompatible versions gracefully
        // For now, we just load what we can and ignore unknown fields
        if (!data.formValues) return false;

        const fv = data.formValues;
        // Safe field restoration - only set if element exists
        const safeSet = (id, value) => {
          const el = document.getElementById(id);
          if (el && value) el.value = value;
        };
        
        safeSet('organisation', fv.organisation);
        safeSet('canal', fv.canal);
        if (document.getElementById('relation')) safeSet('relation', fv.relation);
        safeSet('expositionUS', fv.expositionUS);

        if (fv.clientType) {
          const radio = document.querySelector(`input[name="clientType"][value="${fv.clientType}"]`);
          if (radio) radio.checked = true;
        }

        if (fv.pays) {
          document.getElementById('pays').value = fv.pays;
          populateLegalFormOptions(fv.pays, true);
          // v7.5: Restaurer pays détaillé
          if (fv.pays === 'HORSUE') {
            const detailWrap = document.getElementById('pays-detail-wrap');
            if (detailWrap) detailWrap.style.display = 'block';
            if (fv.paysDetail) document.getElementById('pays-detail').value = fv.paysDetail;
          }
        }

        safeSet('legalForm', fv.legalForm);
        safeSet('statut', fv.statut);
        safeSet('cotee', fv.cotee);
        safeSet('detention', fv.detention);
        safeSet('signataireDifferent', fv.signataireDifferent);
        safeSet('dirDiff', fv.dirDiff);
        safeSet('dossierRef', fv.dossierRef);
        
        // v7.3: Nouveaux champs
        safeSet('dossierNotes', fv.dossierNotes);
        
        // Afficher le toggle entité étrangère si nécessaire
        if (fv.pays && fv.pays !== 'FR') {
          updateForeignToggleVisibility();

          // Restaurer le toggle et les champs si activé
          const foreignToggle = document.getElementById('toggleForeignEntity');
          if (foreignToggle && fv.foreignEntityEnabled) {
            foreignToggle.checked = true;
            onForeignToggleChange();
            safeSet('registryUrl', fv.registryUrl);
            safeSet('verificationDate', fv.verificationDate);
          }
        }

        // v7.4: Restaurer PPE et mode révision
        safeSet('ppeStatus', fv.ppeStatus);
        const revisionToggle = document.getElementById('toggleRevisionMode');
        if (revisionToggle && fv.revisionMode) {
          revisionToggle.checked = true;
        }

        if (data.checkedItems && Array.isArray(data.checkedItems)) {
          // Stocker dans restoredCheckedItems pour réapplication après génération
          restoredCheckedItems = new Set(data.checkedItems);
        }
        return true;
      } catch (e) { 
        // Corrupted data - clear and start fresh
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (clearErr) {}
        return false; 
      }
    }

    function clearLocalStorage() {
      if (!confirm('Effacer toutes les données locales ?')) return;
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_KEY + '_enabled');
        document.getElementById('toggleLocalStorage').checked = false;
        document.getElementById('btnClearStorage').style.display = 'none';
        checkedItems.clear();
        updateChecklistProgress();
      } catch (e) {
        // Silently fail
      }
    }

    // ========================================
    // NOUVELLES FONCTIONS v7.3
    // ========================================

    // Afficher/masquer le toggle entité étrangère (seulement si pays ≠ FR)
    function updateForeignToggleVisibility() {
      const pays = document.getElementById('pays')?.value;
      const toggleContainer = document.getElementById('foreignToggleContainer');
      const toggle = document.getElementById('toggleForeignEntity');
      
      if (toggleContainer) {
        // Afficher le toggle seulement si pays est UE ou HORSUE (pas FR, pas vide)
        const showToggle = pays && pays !== 'FR';
        toggleContainer.classList.toggle('hidden', !showToggle);
        
        // Si on cache le toggle, réinitialiser
        if (!showToggle && toggle) {
          toggle.checked = false;
          onForeignToggleChange();
        }
      }
    }

    // Gérer le changement du toggle entité étrangère
    function onForeignToggleChange() {
      const toggle = document.getElementById('toggleForeignEntity');
      const proofSection = document.getElementById('foreignProofSection');
      
      if (proofSection) {
        proofSection.classList.toggle('hidden', !toggle?.checked);
        
        // Si on désactive, vider les champs
        if (!toggle?.checked) {
          const registryUrl = document.getElementById('registryUrl');
          const verificationDate = document.getElementById('verificationDate');
          if (registryUrl) registryUrl.value = '';
          if (verificationDate) verificationDate.value = '';
        }
      }
      
      saveFormOnChange();
    }

    // Helper : est-ce que l'entité étrangère est activée ?
    function isForeignEntityEnabled() {
      const pays = document.getElementById('pays')?.value;
      const toggle = document.getElementById('toggleForeignEntity');
      return pays && pays !== 'FR' && toggle?.checked;
    }

    // Générer les prochaines étapes
    function buildNextActions(v) {
      const actions = [];
      
      // Étape 1 : Identification
      if (v.clientType === 'PF') {
        actions.push("Collecter pièce d'identité + justificatif de domicile");
      } else if (v.clientType === 'PM') {
        if (v.pays === 'FR') {
          actions.push("Obtenir Kbis récent + statuts + pièce d'identité du représentant");
        } else {
          actions.push("Obtenir équivalent Kbis (certificate of incorporation) + traduction si nécessaire");
        }
      } else if (v.clientType === 'TRUST') {
        actions.push("Obtenir acte de trust + identifier toutes les parties prenantes");
      }
      
      // Étape 2 : Vérifications
      actions.push("Cribler sanctions/PEP (client + représentant + BE)");
      
      // Étape 3 : BE si applicable
      if (v.clientType === 'PM' && !isNoBEFamily(v.effectiveFamily) && !isAssoFondation(v.family)) {
        if (v.detention === 'complexe') {
          actions.push("Documenter chaîne de détention complète + identifier BE à chaque niveau");
        } else {
          actions.push("Identifier les bénéficiaires effectifs (>25% du capital/droits de vote, ou contrôle par tout autre moyen — L.561-2-2 CMF)");
        }
      }
      
      // Étape 4 : Spécifiques
      if (v.canal === 'distance') {
        actions.push("Appliquer mesures distance (2nd doc, source indépendante, vérif IBAN)");
      }
      if (v.expositionUS === 'oui') {
        actions.push("Screening OFAC/SDN complémentaire (nexus US)");
      }
      
      // Étape 5 : Finalisation
      actions.push("Tracer les preuves (captures, rapports, dates) et valider l'entrée en relation");
      
      return actions.slice(0, 5); // Max 5 actions
    }

    // Mettre à jour la card Next Actions
    function updateNextActions(v) {
      const actions = buildNextActions(v);
      const container = document.getElementById('nextActionsList');
      if (!container) return;
      
      container.innerHTML = actions.map((action, i) => `
        <div class="next-action-item">
          <span class="next-action-number">${i + 1}</span>
          <span>${action}</span>
        </div>
      `).join('');
    }

    // Mettre à jour le contenu des tips selon le contexte
    function updateTipsContent(v) {
      const tips = CONFIG.helpTips;
      
      // Tips A1 (INFOS 1)
      let tipsA1 = [tips.A1.base];
      if (v.pays !== 'FR') tipsA1.push(tips.A1.foreign);
      if (v.statut === 'creation') tipsA1.push(tips.A1.creation);
      document.getElementById('tipsContentA1').innerHTML = '<ul>' + tipsA1.map(t => `<li>${t}</li>`).join('') + '</ul>';
      
      // Tips A2 (INFOS 2)
      let tipsA2 = [tips.A2.base];
      if (v.detention === 'complexe') tipsA2.push(tips.A2.complex);
      if (v.clientType === 'TRUST') tipsA2.push(tips.A2.trust);
      document.getElementById('tipsContentA2').innerHTML = '<ul>' + tipsA2.map(t => `<li>${t}</li>`).join('') + '</ul>';
      
      // Tips B (DOCS)
      let tipsB = [tips.B.base];
      if (v.pays !== 'FR') tipsB.push(tips.B.foreign);
      if (v.canal === 'distance') tipsB.push(tips.B.remote);
      if (v.statut === 'creation') tipsB.push(tips.B.creation);
      document.getElementById('tipsContentB').innerHTML = '<ul>' + tipsB.map(t => `<li>${t}</li>`).join('') + '</ul>';
      
      // Tips C (CONTRÔLES)
      let tipsC = [tips.C.base];
      if (v.expositionUS === 'oui') tipsC.push(tips.C.ofac);
      if (v.pays !== 'FR') tipsC.push(tips.C.foreign);
      document.getElementById('tipsContentC').innerHTML = '<ul>' + tipsC.map(t => `<li>${t}</li>`).join('') + '</ul>';
      
      // Tips D (PREUVES)
      let tipsD = [tips.D.base];
      if (v.pays !== 'FR') tipsD.push(tips.D.foreign);
      if (v.canal === 'distance') tipsD.push(tips.D.remote);
      document.getElementById('tipsContentD').innerHTML = '<ul>' + tipsD.map(t => `<li>${t}</li>`).join('') + '</ul>';
    }

    // Traduction simplifiée des items doc (basique)
    function translateDocItem(item) {
      const translations = {
        'Pièce d\'identité en cours de validité': 'Valid ID document',
        'Justificatif de domicile': 'Proof of address',
        'Kbis ou extrait registre': 'Company registration certificate',
        'Statuts signés/certifiés': 'Signed/certified articles of association',
        'Procès-verbal de nomination': 'Minutes of appointment',
        'Délégation de pouvoir': 'Power of attorney',
        'Organigramme': 'Organization chart',
        'Déclaration BE': 'UBO declaration'
      };
      for (const [fr, en] of Object.entries(translations)) {
        if (item.includes(fr)) return item.replace(fr, en);
      }
      return item; // Fallback
    }

    // Mettre à jour les templates email dans la modal
    function updateEmailTemplates() {
      if (!currentResults) return;
      const v = currentResults.context || getFormValues();
      const templates = buildEmailTemplates(v);
      document.getElementById('emailTemplateFR').textContent = templates.fr;
      document.getElementById('emailTemplateEN').textContent = templates.en;
    }

    // Copier dans le presse-papier
    async function copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        // Fallback pour navigateurs plus anciens
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return true;
      }
    }

    // Copier le template email actif
    async function copyEmailTemplate() {
      const frVisible = document.getElementById('emailTemplateFR').style.display !== 'none';
      const text = frVisible 
        ? document.getElementById('emailTemplateFR').textContent 
        : document.getElementById('emailTemplateEN').textContent;
      
      const btn = document.getElementById('btnCopyEmail');
      if (await copyToClipboard(text)) {
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><polyline points="20 6 9 17 4 12"/></svg> Copié !';
        setTimeout(() => {
          btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copier le message';
        }, 2000);
      }
    }

    // Générer le résumé interne
    function buildInternalSummary() {
      if (!currentResults) return '';
      const v = currentResults.context || {};
      const dossierRef = document.getElementById('dossierRef')?.value?.trim() || '';
      const notes = document.getElementById('dossierNotes')?.value?.trim() || '';
      
      // Foreign entity info only if enabled
      const foreignEnabled = isForeignEntityEnabled();
      const registryUrl = foreignEnabled ? (document.getElementById('registryUrl')?.value?.trim() || '') : '';
      const verificationDate = foreignEnabled ? (document.getElementById('verificationDate')?.value || '') : '';
      
      let summary = `=== RÉSUMÉ DOSSIER KYC ===\n`;
      if (dossierRef) summary += `Référence : ${dossierRef}\n`;
      summary += `Date : ${new Date().toLocaleDateString('fr-FR')}\n\n`;
      
      // Contexte
      const excludeContext = document.getElementById('toggleExportNoContext')?.checked;
      if (!excludeContext) {
        summary += `--- CONTEXTE ---\n`;
        summary += `Type : ${v.clientType || '-'}\n`;
        if (v.clientType === 'PM') {
          summary += `Pays : ${v.pays || '-'}\n`;
          summary += `Forme : ${v.legalForm || '-'}\n`;
          summary += `Statut : ${v.statut || '-'}\n`;
          if (foreignEnabled && registryUrl) summary += `Registre vérifié : ${registryUrl}\n`;
          if (foreignEnabled && verificationDate) summary += `Vérifié le : ${verificationDate}\n`;
        }
        summary += `Canal : ${v.canal || '-'}\n`;
        summary += `Relation : ${v.relation || '-'}\n`;
        if (v.expositionUS === 'oui') summary += `⚠️ NEXUS US/OFAC\n`;
        summary += `\n`;
      }
      
      // Docs demandés
      summary += `--- DOCUMENTS À OBTENIR ---\n`;
      currentResults.documents.forEach(d => summary += `□ ${d}\n`);
      summary += `\n`;
      
      // Contrôles
      summary += `--- CONTRÔLES À EFFECTUER ---\n`;
      currentResults.verifications.forEach(c => summary += `□ ${c}\n`);
      summary += `\n`;
      
      // Preuves
      summary += `--- PREUVES À CONSERVER ---\n`;
      currentResults.evidences.forEach(e => summary += `□ ${e}\n`);
      summary += `\n`;
      
      // Points ACPR
      if (currentResults.acprPoints?.length) {
        summary += `--- POINTS ACPR ---\n`;
        currentResults.acprPoints.forEach(p => summary += `• ${p}\n`);
        summary += `\n`;
      }
      
      // Notes
      if (notes) {
        summary += `--- NOTES / JUSTIFICATIONS ---\n`;
        summary += `${notes}\n`;
      }
      
      return summary;
    }

    // Copier le résumé interne
    async function copyInternalSummary() {
      const summary = buildInternalSummary();
      const btn = document.getElementById('btnCopyInternal');
      if (await copyToClipboard(summary)) {
        btn.classList.add('copied');
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copié !';
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copier résumé interne';
        }, 2000);
      }
    }

    // Switcher les onglets de la modal aide
    function switchHelpTab(btn, contentId) {
      document.querySelectorAll('.help-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.help-content').forEach(c => c.style.display = 'none');
      document.getElementById(contentId).style.display = 'block';
    }

    // Switcher les onglets email
    function switchEmailTab(btn, lang) {
      document.querySelectorAll('.email-template-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('emailTemplateFR').style.display = lang === 'fr' ? 'block' : 'none';
      document.getElementById('emailTemplateEN').style.display = lang === 'en' ? 'block' : 'none';
    }

    function saveFormOnChange() {
      if (isLocalStorageEnabled()) saveToLocalStorage();
    }

    // ========================================
    // v7.4: SCORING RISQUE
    // ========================================
    function calculateRiskScore(v) {
      let score = 0;
      const factors = [];

      // Facteur 1: Pays
      if (v.pays === 'HORSUE') {
        score += 2;
        factors.push({ label: 'Pays Hors UE', level: 'high' });
      } else if (v.pays === 'UE' && v.pays !== 'FR') {
        score += 1;
        factors.push({ label: 'Pays UE', level: 'medium' });
      }

      // Facteur 2: Structure complexe
      if (v.detention === 'complexe') {
        score += 2;
        factors.push({ label: 'Structure complexe', level: 'high' });
      }

      // Facteur 3: PPE
      if (v.ppeStatus === 'ppe_direct') {
        score += 3;
        factors.push({ label: 'PPE direct', level: 'high' });
      } else if (v.ppeStatus === 'ppe_proche' || v.ppeStatus === 'ppe_associe') {
        score += 2;
        factors.push({ label: 'Proche/Associé PPE', level: 'high' });
      }

      // Facteur 4: Exposition US
      if (v.expositionUS === 'oui') {
        score += 1;
        factors.push({ label: 'Nexus US', level: 'medium' });
      }

      // Facteur 5: Entrée à distance
      if (v.canal === 'distance') {
        score += 1;
        factors.push({ label: 'À distance', level: 'medium' });
      }

      // Facteur 6: Entité en création
      if (v.statut === 'creation') {
        score += 1;
        factors.push({ label: 'En création', level: 'medium' });
      }

      // Facteur 7: Trust
      if (v.clientType === 'TRUST') {
        score += 2;
        factors.push({ label: 'Trust/Fiducie', level: 'high' });
      }

      // Déterminer le niveau
      let level, label;
      if (score >= 4) {
        level = 'high';
        label = 'RENFORCÉ';
      } else if (score >= 2) {
        level = 'medium';
        label = 'VIGILANCE';
      } else {
        level = 'low';
        label = 'STANDARD';
      }

      return { score, level, label, factors };
    }

    function updateRiskScore(v) {
      const risk = calculateRiskScore(v);
      const container = document.getElementById('riskScoreContainer');
      const gaugeFill = document.getElementById('riskGaugeFill');
      const levelBadge = document.getElementById('riskScoreLevel');
      const factorsContainer = document.getElementById('riskFactors');

      if (!container) return;

      // Mettre à jour la jauge
      gaugeFill.className = 'risk-gauge-fill ' + risk.level;

      // Mettre à jour le badge
      levelBadge.className = 'risk-score-level ' + risk.level;
      levelBadge.textContent = risk.label;

      // Afficher les facteurs
      if (risk.factors.length > 0) {
        factorsContainer.innerHTML = risk.factors.map(f =>
          `<span class="risk-factor-item active ${f.level === 'high' ? 'high' : ''}">${f.label}</span>`
        ).join('');
      } else {
        factorsContainer.innerHTML = '<span class="risk-factor-item">Aucun facteur aggravant</span>';
      }

      // Stocker dans les résultats pour export
      if (currentResults) {
        currentResults.riskScore = risk;
      }
    }

    // ========================================
    // v7.4: PPE ALERT
    // ========================================
    function updatePPEAlert(v) {
      const alert = document.getElementById('ppeAlert');
      const alertText = document.getElementById('ppeAlertText');
      if (!alert) return;

      const isPPE = v.ppeStatus && v.ppeStatus !== '';
      alert.classList.toggle('hidden', !isPPE);

      if (isPPE) {
        const ppeMessages = {
          'ppe_direct': 'Ce client est une Personne Politiquement Exposée directe. Appliquez les mesures de vigilance renforcée et obtenez une validation hiérarchique avant entrée en relation.',
          'ppe_proche': 'Ce client est un proche de Personne Politiquement Exposée. Les mêmes mesures de vigilance renforcée s\'appliquent.',
          'ppe_associe': 'Ce client est un associé connu d\'une Personne Politiquement Exposée. Vigilance renforcée requise.'
        };
        alertText.textContent = ppeMessages[v.ppeStatus] || ppeMessages['ppe_direct'];
      }
    }

    // ========================================
    // v7.5: PAYS GAFI/SANCTIONS ALERT
    // ========================================
    function populatePaysDetail() {
      const select = document.getElementById('pays-detail');
      if (!select || !PAYS_DATA) return;

      // Garder la première option "Sélectionner..."
      select.innerHTML = '<option value="">Sélectionner...</option>';

      // Trier les pays alphabétiquement et les ajouter
      const sorted = PAYS_DATA.countries.slice().sort((a, b) => a.n.localeCompare(b.n, 'fr'));
      sorted.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.a2;
        // Ajouter un indicateur visuel pour les pays à risque
        let label = c.n;
        if (c.fatf === 'black') label += ' — GAFI liste noire';
        else if (c.fatf === 'grey') label += ' — GAFI liste grise';
        else if (c.fatf === 'susp') label += ' — GAFI suspendu';
        if (c.sUE === 'Complet' || c.ofac === 'Complet') label += ' — Sanctions complètes';
        opt.textContent = label;
        select.appendChild(opt);
      });
    }

    function checkPaysAlerte(paysCode) {
      const alertEl = document.getElementById('paysAlert');
      if (!alertEl) return;

      if (!paysCode || !PAYS_DATA) {
        alertEl.classList.add('hidden');
        return;
      }

      const country = PAYS_DATA.countries.find(c => c.a2 === paysCode);
      if (!country) {
        alertEl.classList.add('hidden');
        return;
      }

      const alerts = [];

      // GAFI black list
      if (country.fatf === 'black') {
        alerts.push({
          level: 'red',
          title: 'Liste noire GAFI — ' + country.n,
          text: 'Ce pays figure sur la liste noire GAFI (appel à contre-mesures) — vigilance renforcée obligatoire (art. L.561-10-1 CMF). Contre-mesures possibles selon art. L.561-10-3 CMF.'
        });
      } else if (country.fatf === 'grey') {
        alerts.push({
          level: 'orange',
          title: 'Liste grise GAFI — ' + country.n,
          text: 'Ce pays figure sur la liste grise GAFI (surveillance renforcée) — prise en compte requise dans votre approche par les risques.'
        });
      } else if (country.fatf === 'susp') {
        alerts.push({
          level: 'orange',
          title: 'Vigilance GAFI — ' + country.n,
          text: 'Ce pays fait l\'objet d\'un appel à la vigilance GAFI (membre suspendu).'
        });
      }

      // Sanctions complètes UE ou OFAC
      const hasCompleteSanctions = country.sUE === 'Complet' || country.ofac === 'Complet';
      if (hasCompleteSanctions) {
        const sources = [];
        if (country.sUE === 'Complet') sources.push('UE');
        if (country.ofac === 'Complet') sources.push('OFAC');
        alerts.push({
          level: 'red',
          title: 'Sanctions complètes (' + sources.join(' + ') + ') — ' + country.n,
          text: 'Ce pays est soumis à des sanctions complètes — vérifiez vos obligations de gel des avoirs et restrictions sectorielles.'
        });
      }
      // Sanctions UE non complètes (ciblé, sectoriel, embargo) — y compris si OFAC est Complet
      if (country.sUE && country.sUE !== '' && country.sUE !== 'Complet') {
        alerts.push({
          level: 'orange',
          title: 'Sanctions UE (' + country.sUE.toLowerCase() + ') — ' + country.n,
          text: country.sUED ? 'Sanctions UE : ' + country.sUED + '.' : 'Ce pays fait l\'objet de sanctions UE ciblées.'
        });
      }

      // PTHR UE (pays tiers à haut risque)
      if (country.eu === 1 && alerts.length === 0) {
        alerts.push({
          level: 'orange',
          title: 'Pays tiers à haut risque UE — ' + country.n,
          text: 'Ce pays figure sur la liste UE des pays tiers à haut risque (PTHR) — vigilance renforcée obligatoire (art. L.561-10-1 CMF).'
        });
      }

      if (alerts.length === 0) {
        alertEl.classList.add('hidden');
        return;
      }

      // Trier : rouge d'abord, puis orange
      alerts.sort((a, b) => (a.level === 'red' ? 0 : 1) - (b.level === 'red' ? 0 : 1));

      const hasRed = alerts[0].level === 'red';
      const icon = document.getElementById('paysAlertIcon');
      const title = document.getElementById('paysAlertTitle');
      const text = document.getElementById('paysAlertText');

      alertEl.classList.remove('hidden');
      alertEl.style.borderLeftColor = hasRed ? '#9E3D1B' : '#b8860b';
      icon.textContent = hasRed ? '⚠️' : 'ℹ️';
      title.textContent = alerts[0].title;
      text.innerHTML = alerts.map(a => a.text).join('<br><br>');
    }

    // ========================================
    // v7.5: NEXUS US ALERT
    // ========================================
    function checkNexusUSAlerte(v) {
      const el = document.getElementById('nexusUSAlert');
      if (!el) return;

      if (v.expositionUS === 'oui') {
        el.classList.remove('hidden');
        document.getElementById('nexusUSAlertText').textContent =
          'Une exposition aux États-Unis peut déclencher des obligations de screening OFAC (SDN list) indépendamment du droit français. Vérifiez le nexus US de votre client et consultez votre politique interne sanctions.';
      } else {
        el.classList.add('hidden');
      }
    }

    // ========================================
    // v7.4: REVISION MODE ALERT
    // ========================================
    function updateRevisionModeAlert(v) {
      const alert = document.getElementById('revisionModeAlert');
      if (!alert) return;
      alert.classList.toggle('hidden', !v.revisionMode);
    }

    // ========================================
    // v7.4: MESSAGES CLIENT PERSONNALISÉS
    // ========================================
    function buildEmailTemplates(v) {
      const dossierRef = document.getElementById('dossierRef')?.value?.trim() || 'votre dossier';
      const docs = currentResults?.documents || [];
      const isPM = v.clientType === 'PM';
      const isForeign = v.pays && v.pays !== 'FR';
      const isPPE = v.ppeStatus && v.ppeStatus !== '';

      // Sélectionner les docs les plus pertinents
      const docsText = docs.slice(0, 8).map(d => `• ${d}`).join('\n');

      // Message personnalisé selon le type
      let introFR, introEN;

      if (isPM) {
        if (isForeign) {
          introFR = `Dans le cadre de l'entrée en relation de ${dossierRef}, nous avons besoin des documents suivants pour compléter votre dossier KYB.\n\n⚠️ Note : Les documents en langue étrangère doivent être accompagnés d'une traduction${v.pays === 'HORSUE' ? ' et, si applicable, d\'une apostille ou légalisation' : ''}.`;
          introEN = `As part of the onboarding process for ${dossierRef}, we need the following documents to complete your KYB file.\n\n⚠️ Note: Foreign language documents should be accompanied by a translation${v.pays === 'HORSUE' ? ' and, where applicable, an apostille or legalization' : ''}.`;
        } else {
          introFR = `Dans le cadre de l'entrée en relation de ${dossierRef}, nous avons besoin des documents suivants pour compléter votre dossier KYB :`;
          introEN = `As part of the onboarding process for ${dossierRef}, we need the following documents to complete your KYB file:`;
        }
      } else if (v.clientType === 'PF') {
        introFR = `Dans le cadre de l'ouverture de ${dossierRef}, nous avons besoin des documents suivants pour compléter votre dossier :`;
        introEN = `As part of opening ${dossierRef}, we need the following documents to complete your file:`;
      } else { // TRUST
        introFR = `Dans le cadre de l'entrée en relation pour ${dossierRef}, nous avons besoin des documents suivants relatifs au trust/fiducie :`;
        introEN = `As part of the onboarding process for ${dossierRef}, we need the following documents related to the trust:`;
      }

      // Ajouter note PPE si applicable
      let ppNoteFR = '', ppNoteEN = '';
      if (isPPE) {
        ppNoteFR = '\n\n📋 Information complémentaire : Dans le cadre de nos obligations réglementaires, nous vous demanderons également des justificatifs concernant l\'origine de votre patrimoine.';
        ppNoteEN = '\n\n📋 Additional information: As part of our regulatory obligations, we will also require documentation regarding the origin of your wealth.';
      }

      const templateFR = `Bonjour,

${introFR}

${docsText}${ppNoteFR}

Merci de nous transmettre ces éléments dans les meilleurs délais.

Pour toute question, n'hésitez pas à revenir vers nous.

Cordialement,
[Votre nom]`;

      const templateEN = `Hello,

${introEN}

${docs.slice(0, 8).map(d => `• ${translateDocItem(d)}`).join('\n')}${ppNoteEN}

Please send us these documents at your earliest convenience.

If you have any questions, please do not hesitate to contact us.

Best regards,
[Your name]`;

      return { fr: templateFR, en: templateEN };
    }

    // ========================================
    // INIT
    // ========================================
    document.addEventListener('DOMContentLoaded', async () => {
      populateLegalFormOptions('FR', true);

      // v7.5: Charger les données pays GAFI/sanctions
      try {
        const resp = await fetch('../liste-pays/data.json');
        if (resp.ok) {
          PAYS_DATA = await resp.json();
          populatePaysDetail();
        }
      } catch (e) {
        console.warn('Données pays non disponibles:', e.message);
      }

      const restored = loadFromLocalStorage();
      if (restored) setTimeout(updateForm, 100);

      updateProgressBar();
    });
