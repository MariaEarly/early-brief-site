/**
 * PDF Export Module - Early Brief Branded
 * Génère un PDF brandé avec header/footer "Early Brief"
 * Version: 8.0
 */

// Configuration de la marque
const BRAND_CONFIG = {
  name: 'Early Brief',
  url: 'https://early-brief.com/',
  tagline: 'Checklist KYC/KYB',
  colors: {
    primary: '#9E3D1B',      // Terra Early Brief
    secondary: '#4A4540',    // Texte secondaire
    muted: '#6B6560',        // Texte atténué
    light: '#F4F0E6',        // Fond écru Early Brief
    success: '#2C4A2E',      // Vert Early Brief
    warning: '#B5854A',
    danger: '#C45C5C'
  }
};

/**
 * Exporte la checklist en PDF brandé
 */
function exportBrandedPDF() {
  // Vérifier que jsPDF est chargé
  if (typeof window.jspdf === 'undefined') {
    alert('Bibliothèque PDF en cours de chargement. Réessayez dans quelques secondes.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  let yPos = margin;

  // ========================================
  // HEADER BRANDÉ
  // ========================================
  function drawHeader() {
    // Bandeau terra
    doc.setFillColor(158, 61, 27); // #9E3D1B
    doc.rect(0, 0, pageWidth, 25, 'F');

    // Nom de la marque
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(BRAND_CONFIG.name, margin, 12);

    // Tagline
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(BRAND_CONFIG.tagline, margin, 19);

    // Date à droite
    const today = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    doc.text(today, pageWidth - margin, 12, { align: 'right' });

    return 35; // Position Y après le header
  }

  // ========================================
  // FOOTER BRANDÉ
  // ========================================
  function drawFooter(pageNum, totalPages) {
    const footerY = pageHeight - 15;

    // Ligne de séparation
    doc.setDrawColor(158, 61, 27);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

    // Texte footer
    doc.setTextColor(107, 101, 96);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    // URL à gauche
    doc.text(BRAND_CONFIG.url, margin, footerY);

    // Numéro de page au centre
    doc.text(`Page ${pageNum} / ${totalPages}`, pageWidth / 2, footerY, { align: 'center' });

    // Avertissement à droite
    doc.text('Outil indicatif', pageWidth - margin, footerY, { align: 'right' });
  }

  // ========================================
  // CONTENU
  // ========================================

  yPos = drawHeader();

  // Référence dossier
  const dossierRef = document.getElementById('dossierRef')?.value || 'Sans référence';
  doc.setTextColor(31, 42, 35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`Dossier : ${dossierRef}`, margin, yPos);
  yPos += 10;

  // Niveau de risque
  const riskLevel = document.getElementById('riskScoreLevel')?.textContent || 'STANDARD';
  const riskColors = {
    'STANDARD': [44, 74, 46],
    'VIGILANCE': [181, 133, 74],
    'RENFORCÉ': [196, 92, 92]
  };
  const riskColor = riskColors[riskLevel] || riskColors['STANDARD'];

  doc.setFillColor(...riskColor);
  doc.roundedRect(margin, yPos, 50, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Risque : ${riskLevel}`, margin + 25, yPos + 5.5, { align: 'center' });
  yPos += 15;

  // Contexte
  doc.setTextColor(74, 69, 64);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const v = typeof getFormValues === 'function' ? getFormValues() : {};
  const contextLines = [
    `Organisation: ${v.organisation || '-'} | Canal: ${v.canal || '-'}`,
    `Type client: ${v.clientType || '-'} | Pays: ${v.pays || '-'} | PPE: ${v.ppeStatus || 'Non'}`
  ];

  contextLines.forEach(line => {
    doc.text(line, margin, yPos);
    yPos += 5;
  });
  yPos += 5;

  // Ligne de séparation
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // ========================================
  // CHECKLISTS
  // ========================================

  const sections = [
    { id: 'socleChecklist', title: 'INFOS 1 - Identification' },
    { id: 'complementsChecklist', title: 'INFOS 2 - Connaissance relation' },
    { id: 'docsChecklist', title: 'DOCS - Pièces justificatives' },
    { id: 'gelChecklist', title: 'SANCTIONS & GEL DES AVOIRS' },
    { id: 'verificationsChecklist', title: 'CONTRÔLES - Vérifications BE/PEP' },
    { id: 'evidencesChecklist', title: 'PREUVES - Audit trail' }
  ];

  sections.forEach(section => {
    const checklist = document.getElementById(section.id);
    if (!checklist) return;

    const items = checklist.querySelectorAll('li[data-item-id]');
    if (items.length === 0) return;

    // Vérifier si on a besoin d'une nouvelle page
    if (yPos > pageHeight - 50) {
      doc.addPage();
      yPos = drawHeader();
    }

    // Titre de section
    doc.setFillColor(244, 240, 230);
    doc.rect(margin, yPos - 3, contentWidth, 8, 'F');
    doc.setTextColor(158, 61, 27);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(section.title, margin + 3, yPos + 2);
    yPos += 10;

    // Items
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    items.forEach(item => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = drawHeader();
      }

      const isChecked = item.classList.contains('checked');
      const text = item.querySelector('.check-text')?.textContent || item.textContent;

      // Checkbox
      doc.setDrawColor(158, 61, 27);
      doc.setLineWidth(0.3);
      doc.rect(margin, yPos - 3, 4, 4);

      if (isChecked) {
        doc.setFillColor(158, 61, 27);
        doc.rect(margin + 0.5, yPos - 2.5, 3, 3, 'F');
        doc.setTextColor(107, 101, 96);
      } else {
        doc.setTextColor(31, 42, 35);
      }

      // Texte (avec wrap)
      const maxWidth = contentWidth - 10;
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, margin + 7, yPos);
      yPos += lines.length * 4 + 2;
    });

    yPos += 5;
  });

  // ========================================
  // NOTES
  // ========================================
  const notes = document.getElementById('dossierNotes')?.value;
  if (notes && notes.trim()) {
    if (yPos > pageHeight - 50) {
      doc.addPage();
      yPos = drawHeader();
    }

    doc.setFillColor(244, 240, 230);
    doc.rect(margin, yPos - 3, contentWidth, 8, 'F');
    doc.setTextColor(158, 61, 27);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('NOTES', margin + 3, yPos + 2);
    yPos += 10;

    doc.setTextColor(74, 69, 64);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const noteLines = doc.splitTextToSize(notes, contentWidth);
    doc.text(noteLines, margin, yPos);
  }

  // ========================================
  // FOOTERS SUR TOUTES LES PAGES
  // ========================================
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }

  // ========================================
  // TÉLÉCHARGEMENT
  // ========================================
  const filename = `checklist-kyc-${dossierRef.replace(/[^a-z0-9]/gi, '-').substring(0, 30)}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);

  // Fermer le dropdown
  document.getElementById('exportDropdown')?.classList.remove('open');
}

// Exposer globalement
window.exportBrandedPDF = exportBrandedPDF;
