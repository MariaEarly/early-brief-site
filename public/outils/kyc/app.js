    // ========================================
    // RULES ENGINE (loaded from rules.json)
    // ========================================
    let RULES = null;

    async function loadRules() {
      const resp = await fetch('./rules.json');
      const data = await resp.json();
      RULES = data.items.filter(i => i.id); // filtre les séparateurs _comment
    }

    function matchesProfile(item, v) {
      const c = item.conditions;
      if (!c) return true;

      // client_type
      if (c.client_type && !c.client_type.includes('*') &&
          !c.client_type.includes(v.clientType)) return false;

      // family
      if (c.family && !c.family.includes('*') &&
          !c.family.includes(v.family)) return false;

      // pays
      if (c.pays && !c.pays.includes('*') &&
          !c.pays.includes(v.pays)) return false;

      // statut (inclusion)
      if (c.statut && !c.statut.includes('*') &&
          !c.statut.includes(v.statut)) return false;

      // statut_not (exclusion)
      if (c.statut_not && c.statut_not.includes(v.statut)) return false;

      // canal
      if (c.canal && !c.canal.includes('*') &&
          !c.canal.includes(v.canal)) return false;

      // organisation
      if (c.organisation && !c.organisation.includes('*') &&
          !c.organisation.includes(v.organisation)) return false;

      // ppeStatus
      if (c.ppeStatus && !c.ppeStatus.includes('*') &&
          !c.ppeStatus.includes(v.ppeStatus)) return false;

      // cotee
      if (c.cotee && !c.cotee.includes('*') &&
          !c.cotee.includes(v.cotee)) return false;

      // cotee_not
      if (c.cotee_not && c.cotee_not.includes(v.cotee)) return false;

      // detention
      if (c.detention && !c.detention.includes('*') &&
          !c.detention.includes(v.detention)) return false;

      // signataire
      if (c.signataire && !c.signataire.includes('*') &&
          !c.signataire.includes(v.signataireDifferent)) return false;

      // revision
      if (c.revision) {
        const isRevision = v.revisionMode ? 'true' : 'false';
        if (!c.revision.includes(isRevision)) return false;
      }

      // expositionUS
      if (c.expositionUS && !c.expositionUS.includes('*') &&
          !c.expositionUS.includes(v.expositionUS)) return false;

      return true;
    }

    function getRuleItems(category, v, filter) {
      if (!RULES) return [];
      return RULES
        .filter(item => item.category === category)
        .filter(item => {
          if (filter) {
            if (filter.section && item.section !== filter.section) return false;
            if (filter.status_not && item.status === filter.status_not) return false;
          }
          return true;
        })
        .filter(item => matchesProfile(item, v))
        .map(item => item.label);
    }

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

      // Formulaires / Webhooks (à configurer)
      emailWebhook: null,
      webhookTimeout: 8000,

      // Helpers UI form — familles applicables
      coteeApplicableFamilies: ['commerciale', 'civile', 'sel'],
      detentionApplicableFamilies: ['commerciale', 'civile', 'sel', 'gie'],
      assoFondationFamilies: ['association', 'fondation'],
      noBEFamilies: ['ei', 'publique'],
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
      // Depuis v8: la valeur du select EST la famille
      return legalForm || 'autre';
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
        relation: 'affaires',
        expositionUS: document.getElementById('expositionUS').value,
        clientType: clientTypeEl ? clientTypeEl.value : null,
        pays: document.getElementById('pays').value,
        statut: document.getElementById('statut').value,
        legalForm,
        family,
        effectiveFamily: getEffectiveFamily(family),
        cotee: document.getElementById('cotee').value,
        detention: document.getElementById('detention').value,
        signataireDifferent: document.getElementById('signataireDifferent').value,
        // v7.4: Nouveaux champs
        ppeStatus: document.getElementById('ppeStatus')?.value || '',
        revisionMode: document.getElementById('toggleRevisionMode')?.checked || false,
        // v7.5: Pays détaillé (code ISO2 si HORSUE)
        paysDetail: document.getElementById('pays-detail')?.value || ''
      };
    }

    function updateLegalFormLabel(pays) {
      const label = document.getElementById('legalFormLabel');
      if (label) {
        label.textContent = pays === 'FR' ? 'Famille juridique' : pays === 'UE' ? 'Famille juridique (UE)' : 'Famille juridique (Hors UE)';
      }
    }

    function onPaysChange() {
      const pays = document.getElementById('pays').value;
      if (pays) updateLegalFormLabel(pays);

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

      updateForm();
    }

    function resetConditionalValues() {
      document.getElementById('cotee').value = '';
      document.getElementById('detention').value = '';
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

      // CASP alert visibility
      const caspAlert = document.getElementById('casp-alert');
      if (caspAlert) caspAlert.classList.toggle('hidden', v.organisation !== 'CASP');

      if (!isPM) {
        ['coteeGroup', 'detentionGroup', 'signataireGroup'].forEach(id =>
          document.getElementById(id).classList.add('hidden')
        );
        updateProgressBar();
        tryAutoGenerate();
        return;
      }

      if (v.pays) updateLegalFormLabel(v.pays);

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
        step3Complete = v.pays && v.legalForm;
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
        // Génération progressive — socle visible dès pays + legalForm
        if (!v.pays || !v.legalForm) return false;
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
      const gel = buildGelList(v);
      const verifs = buildVerificationsList(v);
      const evs = buildEvidencesList(v);
      const acpr = buildACPRPoints(v);
      const showNote = v.clientType === 'PM' && isAssoFondation(v.family);

      currentResults = {
        context: v,
        socle: infos.socle,
        complements: infos.complements,
        documents: docs,
        gel: gel,
        verifications: verifs,
        evidences: evs,
        acprPoints: acpr,
        showAssoFondationNote: showNote,
        timestamp: new Date().toISOString()
      };

      renderChecklist('socleChecklist', infos.socle, 'countA1');
      renderChecklist('complementsChecklist', infos.complements, 'countA2');
      renderChecklist('docsChecklist', docs, 'countB');
      renderChecklist('gelChecklist', gel, 'countGel');
      renderChecklist('verificationsChecklist', verifs, 'countC');
      renderChecklist('evidencesChecklist', evs, 'countD');
      renderACPRPoints(acpr);

      document.getElementById('noteAssoFondation').classList.toggle('hidden', !showNote);
      document.getElementById('results').classList.remove('hidden');

      updateChecklistProgress();
      updateProgressBar();
      
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
      return {
        socle: getRuleItems('info', v, { section: 'socle' }),
        complements: getRuleItems('info', v, { section: 'complement' })
      };
    }

    function buildDocsList(v) {
      return getRuleItems('doc', v);
    }

    // Items gel des avoirs (screening sanctions / OFAC)
    function buildGelList(v) {
      const gel = ["Screening sanctions (UE, ONU — OFAC si nexus US)"];
      if (v.expositionUS === 'oui') gel.push('Vérification OFAC renforcée');
      // Revision: re-screening sanctions
      if (v.revisionMode) gel.push("Re-screening sanctions/PEP (tous)");
      return gel;
    }

    function buildVerificationsList(v) {
      const gelItems = new Set(buildGelList(v));
      return getRuleItems('controle', v).filter(label => !gelItems.has(label));
    }

    function buildEvidencesList(v) {
      return getRuleItems('preuve', v);
    }

    function buildACPRPoints(v) {
      return getRuleItems('info', v, { section: 'acpr' });
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

        const ruleItem = RULES?.find(r => r.label === item);
    const sourceIcon = ruleItem?.ref
      ? `<a href="${ruleItem.url}" target="_blank" rel="noopener" class="source-icon" title="${ruleItem.ref}" aria-label="Source : ${ruleItem.ref}">ⓘ</a>`
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
        checklistGelDesAvoirs: currentResults.gel,
        checklistVerifications: currentResults.verifications,
        checklistEvidences: currentResults.evidences,
        pointsACPR: currentResults.acprPoints
      };
      
      // Add notes (asso/fondation + user notes)
      const allNotes = [];
      if (currentResults.showAssoFondationNote) {
        const noteItem = RULES?.find(r => r.id === 'note-asso-fondation');
        if (noteItem) allNotes.push(noteItem.label);
      }
      if (dossierNotes) allNotes.push(dossierNotes);
      if (allNotes.length) data.notes = allNotes;

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

      let csv = 'Section,Element\n';
      csv += `Meta,"Document Collector v${CONFIG.version}"\n`;
      csv += `Meta,"${new Date().toISOString()}"\n`;
      if (dossierRef) csv += `Meta,"Dossier: ${sanitizeCSV(dossierRef)}"\n`;

      if (!excludeContext) {
        Object.entries(currentResults.context).forEach(([k, val]) => {
          if (val) csv += `Contexte,"${sanitizeCSV(k + ': ' + val)}"\n`;
        });
      }

      currentResults.socle.forEach(i => csv += `A1-Socle,"${sanitizeCSV(i)}"\n`);
      currentResults.complements.forEach(i => csv += `A2-Complements,"${sanitizeCSV(i)}"\n`);
      if (currentResults.showAssoFondationNote) {
        const noteItem = RULES?.find(r => r.id === 'note-asso-fondation');
        if (noteItem) csv += `A2-Note,"${sanitizeCSV(noteItem.label)}"\n`;
      }
      currentResults.documents.forEach(i => csv += `B-Documents,"${sanitizeCSV(i)}"\n`);
      currentResults.gel.forEach(i => csv += `C1-Sanctions-Gel,"${sanitizeCSV(i)}"\n`);
      currentResults.verifications.forEach(i => csv += `C2-Verifications,"${sanitizeCSV(i)}"\n`);
      currentResults.evidences.forEach(i => csv += `D-Evidences,"${sanitizeCSV(i)}"\n`);
      currentResults.acprPoints.forEach(i => csv += `ACPR,"${sanitizeCSV(i)}"\n`);
      
      // Notes utilisateur
      if (dossierNotes) csv += `Notes,"${sanitizeCSV(dossierNotes)}"\n`;

      const filename = dossierRef ? `checklist-${slugify(dossierRef)}.csv` : `checklist-kyc-${new Date().toISOString().slice(0,10)}.csv`;
      download(filename, csv, 'text/csv');
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

      ['kybDetails', 'coteeGroup', 'detentionGroup', 'signataireGroup', 'results', 'noteAssoFondation'].forEach(id =>
        document.getElementById(id).classList.add('hidden')
      );
      updateProgressBar();
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
            expositionUS: document.getElementById('expositionUS')?.value || '',
            clientType: clientTypeEl ? clientTypeEl.value : null,
            pays: document.getElementById('pays')?.value || '',
            statut: document.getElementById('statut')?.value || '',
            legalForm: document.getElementById('legalForm')?.value || '',
            cotee: document.getElementById('cotee')?.value || '',
            detention: document.getElementById('detention')?.value || '',
            signataireDifferent: document.getElementById('signataireDifferent')?.value || '',
            dossierRef: document.getElementById('dossierRef')?.value || '',
            dossierNotes: document.getElementById('dossierNotes')?.value || '',
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

        const toggle = document.getElementById('toggleLocalStorage');
        const btn = document.getElementById('btnClearStorage');
        if (toggle) toggle.checked = true;
        if (btn) btn.style.display = 'inline-flex';

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
        safeSet('expositionUS', fv.expositionUS);

        if (fv.clientType) {
          const radio = document.querySelector(`input[name="clientType"][value="${fv.clientType}"]`);
          if (radio) radio.checked = true;
        }

        if (fv.pays) {
          document.getElementById('pays').value = fv.pays;
          updateLegalFormLabel(fv.pays);
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
        safeSet('dossierRef', fv.dossierRef);
        safeSet('dossierNotes', fv.dossierNotes);

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

      // Facteur 4: Exposition US — retiré du scoring.
      // OFAC relève d'une politique interne, pas d'une obligation CMF.
      // L'alerte contextuelle #nexusUSAlert suffit.

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
    // ========================================
    // INIT
    // ========================================
    document.addEventListener('DOMContentLoaded', async () => {
      // Charger le référentiel rules.json
      try {
        await loadRules();
      } catch (e) {
        console.warn('Rules non disponibles:', e.message);
      }

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
