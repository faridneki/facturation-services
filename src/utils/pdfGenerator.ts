import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Client, CompanyInfo, Invoice } from '../types';
import { amountToWordsFR, calculateInvoiceTotals, formatCurrency, formatDateFR, formatNumber, getClientAddress, getClientDisplayName, getClientPhone } from './calculations';

export function generateInvoicePDF(invoice: Invoice, client: Client, company: CompanyInfo): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const totals = calculateInvoiceTotals(invoice.items, 0, invoice.depositAmount);
  const primaryColor: [number, number, number] = [30, 41, 59]; // Slate 800
  const secondaryColor: [number, number, number] = [71, 85, 105]; // Slate 600
  const accentColor: [number, number, number] = [37, 99, 235]; // Blue 600

  // 1. Header - Company Info & Right Meta Box (Y: 10 to 42)
  let compY = 14;

  const logoImg = company.logoBase64 || company.logoUrl;
  if (logoImg && typeof logoImg === 'string' && logoImg.startsWith('data:image')) {
    try {
      const imgType = logoImg.includes('png') ? 'PNG' : logoImg.includes('jpeg') || logoImg.includes('jpg') ? 'JPEG' : 'PNG';
      doc.addImage(logoImg, imgType, 14, 10, 35, 18);
      compY = 32;
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text((company.name || 'ALGERIE BATI PRO').substring(0, 35), 14, compY + 4);
      compY += 8;
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text((company.name || 'ALGERIE BATI PRO').substring(0, 35), 14, compY + 4);
    compY += 8;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  if (company.legalName && company.legalName !== company.name) {
    doc.text(company.legalName.substring(0, 45), 14, compY);
    compY += 4.5;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  if (company.address) {
    const fullAddr = `${company.address}${company.city ? `, ${company.city}` : ''}`;
    doc.text(fullAddr.substring(0, 50), 14, compY);
    compY += 4;
  }
  if (company.phone || company.email) {
    doc.text(`Tél : ${company.phone || '-'}  |  Email : ${company.email || '-'}`, 14, compY);
    compY += 4;
  }

  // Right Block - Document Title & Meta Box (X: 122 to 196, Width: 74, Y: 10 to 42)
  const isQuote = invoice.type === 'DEVIS';
  const docTypeLabel =
    invoice.type === 'FACTURE'
      ? 'FACTURE'
      : invoice.type === 'DEVIS'
      ? 'DEVIS'
      : invoice.type === 'ACOMPTE'
      ? 'FACTURE D\'ACOMPTE'
      : 'AVOIR';

  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.roundedRect(122, 10, 74, 32, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(docTypeLabel, 127, 18);

  doc.setFontSize(10);
  doc.text(`N° ${invoice.number}`, 127, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Date : ${formatDateFR(invoice.issueDate)}`, 127, 30);
  doc.text(`Échéance : ${formatDateFR(invoice.dueDate)}`, 127, 36);

  // 2. Algerian Fiscal Identifiers Banner (Y: 45 to ~56)
  const nif = company.taxId || company.siret;
  const rc = company.rc;
  const ai = company.ai || company.art;
  const nis = company.nis;

  const fiscalParts: string[] = [];
  if (nif) fiscalParts.push(`NIF : ${nif}`);
  if (rc) fiscalParts.push(`RC : ${rc}`);
  if (ai) fiscalParts.push(`AI : ${ai}`);
  if (nis) fiscalParts.push(`NIS : ${nis}`);

  let bannerBottomY = 44;

  if (fiscalParts.length > 0) {
    const fiscalText = fiscalParts.join('   |   ');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    const textWidth = doc.getTextWidth(fiscalText);

    if (textWidth <= 172) {
      // Single line banner (Height: 8mm, Y: 44 to 52)
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 44, 182, 8, 1.5, 1.5, 'FD');

      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(fiscalText, 18, 49.2);
      bannerBottomY = 52;
    } else {
      // Two-line banner (Height: 12mm, Y: 44 to 56)
      const line1Parts: string[] = [];
      const line2Parts: string[] = [];
      if (nif) line1Parts.push(`NIF : ${nif}`);
      if (rc) line1Parts.push(`RC : ${rc}`);
      if (ai) line2Parts.push(`AI : ${ai}`);
      if (nis) line2Parts.push(`NIS : ${nis}`);

      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 44, 182, 12, 1.5, 1.5, 'FD');

      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(line1Parts.join('   |   '), 18, 49);
      doc.text(line2Parts.join('   |   '), 18, 53.5);
      bannerBottomY = 56;
    }
  }

  // 3. Client Box & Object/Notes Box (Y: bannerBottomY + 4)
  const clientBoxY = bannerBottomY + 4;
  const clientBoxHeight = 36;

  // Right side: Client Box Frame (X: 110 to 196, Width = 86mm)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(110, clientBoxY, 86, clientBoxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('FACTURÉ À :', 114, clientBoxY + 5.5);

  const clientName = getClientDisplayName(client);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(clientName.substring(0, 42), 114, clientBoxY + 11);

  let clientLineY = clientBoxY + 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

  const clientPhone = getClientPhone(client);
  if (clientPhone && clientPhone !== '-') {
    doc.text(`Tél : ${clientPhone}`, 114, clientLineY);
    clientLineY += 4.5;
  }

  const clientAddress = getClientAddress(client);
  if (clientAddress && clientAddress !== '-') {
    doc.text(clientAddress.substring(0, 45), 114, clientLineY);
    clientLineY += 4.5;
  }

  const clientNif = client.nif || client.siret;
  const clientRc = client.rc;
  if (clientNif || clientRc) {
    const clientFiscalStr = [clientNif ? `NIF: ${clientNif}` : '', clientRc ? `RC: ${clientRc}` : ''].filter(Boolean).join(' | ');
    doc.text(clientFiscalStr.substring(0, 45), 114, clientLineY);
    clientLineY += 4.5;
  }

  if (client.ncBancaire && clientLineY <= clientBoxY + clientBoxHeight - 3) {
    doc.text(`Compte Client: ${client.ncBancaire}`, 114, clientLineY);
  }

  // Left side: Object / Notes Box (X: 14 to 106, Width = 92mm)
  if (invoice.notes) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, clientBoxY, 92, clientBoxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('OBJET / REMARQUES :', 18, clientBoxY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

    const splitNotes = doc.splitTextToSize(invoice.notes, 84);
    doc.text(splitNotes.slice(0, 5), 18, clientBoxY + 11);
  }

  const startY = clientBoxY + clientBoxHeight + 5;

  // 3. Line Items Table (Fourniture et pose)
  const tableData = invoice.items.map((item, idx) => [
    `${idx + 1}`,
    `${item.description}\n${item.category ? `[${item.category}]` : ''}`,
    item.unit || 'm²',
    formatNumber(Number(item.quantity) || 0, (Number(item.quantity) || 0) % 1 === 0 ? 0 : 2),
    formatCurrency(item.unitPriceHT),    
    `${item.vatRate || 9}%`,
    formatCurrency(item.totalHT)
  ]);

  autoTable(doc, {
    startY: startY,
    head: [['#', 'Prestation / Désignation (Fourniture & Pose)', 'Unité', 'Qté', 'P.U. HT', 'TVA', 'Total HT']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'left', cellWidth: 82 },
      2: { halign: 'center', cellWidth: 16 },
      3: { halign: 'center', cellWidth: 14 },
      4: { halign: 'right', cellWidth: 24 },
      
      5: { halign: 'center', cellWidth: 12 },
      6: { halign: 'right', cellWidth: 26 }
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      valign: 'middle',
      overflow: 'linebreak'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  // 4. Financial Totals & VAT Breakdown
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  // Left side: VAT Breakdown
  const vatRows = totals.vatBreakdowns.map(v => [
    `TVA ${v.rate}%`,
    formatCurrency(v.baseHT),
    formatCurrency(v.vatAmount)
  ]);

  if (vatRows.length > 0) {
    autoTable(doc, {
      startY: finalY,
      margin: { left: 14 },
      tableWidth: 85,
      head: [['Taux TVA', 'Base HT', 'Montant TVA']],
      body: vatRows,
      theme: 'plain',
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: primaryColor,
        fontStyle: 'bold',
        fontSize: 8
      },
      styles: {
        fontSize: 8,
        cellPadding: 1.5
      }
    });
  }

  // Right side: Financial Totals Box
  const totalsX = 112;
  let totalsY = finalY;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

  doc.text('Total HT :', totalsX, totalsY + 4);
  doc.text(formatCurrency(totals.subtotalHT), 196, totalsY + 4, { align: 'right' });

  if (totals.discountAmount > 0) {
    totalsY += 5;
    doc.text('Remise globale :', totalsX, totalsY + 4);
    doc.text(`-${formatCurrency(totals.discountAmount)}`, 196, totalsY + 4, { align: 'right' });
  }

  totalsY += 5;
  doc.text('Total TVA (9%) :', totalsX, totalsY + 4);
  doc.text(formatCurrency(totals.taxAmount), 196, totalsY + 4, { align: 'right' });

  totalsY += 6;
  doc.setFillColor(241, 245, 249);
  doc.rect(totalsX - 2, totalsY, 86, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('TOTAL TTC :', totalsX, totalsY + 5.5);
  doc.text(formatCurrency(totals.totalTTC), 196, totalsY + 5.5, { align: 'right' });

  if (totals.depositAmount > 0) {
    totalsY += 9;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Acompte versé :', totalsX, totalsY + 4);
    doc.text(`-${formatCurrency(totals.depositAmount)}`, 196, totalsY + 4, { align: 'right' });

    totalsY += 6;
    doc.setFillColor(220, 238, 255);
    doc.rect(totalsX - 2, totalsY, 86, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text('NET À PAYER :', totalsX, totalsY + 5.5);
    doc.text(formatCurrency(totals.remainingDue), 196, totalsY + 5.5, { align: 'right' });
  }

  // 5. Amount in Words Box (Arrêté le présent document à la somme de...)
  const payableAmount = totals.depositAmount > 0 ? totals.remainingDue : totals.totalTTC;
  const docTypeWord = isQuote ? 'présent devis' : invoice.type === 'AVOIR' ? 'présent avoir' : 'présente facture';
  const amountWords = amountToWordsFR(payableAmount);
  const fullAmountText = `Arrêté le ${docTypeWord} à la somme de : ${amountWords}.`;

  let wordsY = Math.max(totalsY + 12, finalY + 15);

  if (wordsY > 245) {
    doc.addPage();
    wordsY = 20;
  }

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, wordsY, 182, 11, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('MONTANT EN LETTRES :', 18, wordsY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  const splitAmountWords = doc.splitTextToSize(fullAmountText, 136);
  doc.text(splitAmountWords, 58, wordsY + 4.5);

  // 6. Payment & Bank Information
  let footerY = wordsY + 14;

  if (footerY > 245) {
    doc.addPage();
    footerY = 20;
  }

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, footerY, 182, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('COORDONNÉES BANCAIRES ET MODALITÉS DE PAIEMENT', 18, footerY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(
    `Banque : ${company.bankName || 'BNA'}    |    Compte : ${company.bankAccount || '-'}    |    RIB : ${company.bankRib || company.iban || '-'}`,
    18,
    footerY + 10.5
  );
  doc.text(`Conditions : ${invoice.paymentTerms || company.paymentTerms || company.legalTerms || 'Paiement à 30 jours par chèque ou virement.'}`, 18, footerY + 15.5);

  // 7. Signature box for Quote (Devis)
  if (isQuote) {
    footerY += 24;
    doc.setDrawColor(203, 213, 225);
    doc.rect(115, footerY, 81, 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('BON POUR ACCORD (Mention "Lu et approuvé")', 118, footerY + 5);
    doc.text('Date : .....................   Signature :', 118, footerY + 12);
  }

  // 8. Footer Legal Disclaimer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // Slate 400
  const footerLegalText = `${company.legalName || company.name} - NIF ${nif || '-'} - ${company.footerText || company.legalNotice || 'Merci de votre confiance.'}`;
  doc.text(footerLegalText, 105, 287, { align: 'center' });

  return doc;
}

export function downloadInvoicePDF(invoice: Invoice, client?: Client | null, company?: CompanyInfo | null): void {
  try {
    if (!invoice) {
      console.error('Aucun document fourni à downloadInvoicePDF');
      alert('Erreur : Document introuvable.');
      return;
    }

    const safeClient = client || invoice.client || {
      id: invoice.clientId || 'default',
      name: 'Client Inconnu',
      type: 'PARTICULIER'
    } as Client;

    const safeCompany = company || { name: 'ALGERIE BATI PRO' } as CompanyInfo;

    const pdf = generateInvoicePDF(invoice, safeClient, safeCompany);
    const clientName = getClientDisplayName(safeClient);
    const safeClientName = (clientName || 'Client').replace(/[^a-zA-Z0-9_\-]/g, '_');
    const docNumber = (invoice.number || '0000').replace(/[^a-zA-Z0-9_\-]/g, '_');
    const docType = invoice.type || 'FACTURE';
    const fileName = `${docType}_${docNumber}_${safeClientName}.pdf`;

    // Generate fresh Blob
    const arrayBuffer = pdf.output('arraybuffer');
    const pdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(pdfBlob);

    // 1. Attempt dynamic link download for direct file saving
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 1000);

    // 2. Open PDF in new tab to guarantee reliability on repeated clicks in framed/iframe environments
    const pdfWindow = window.open(blobUrl, '_blank');
    if (pdfWindow) {
      pdfWindow.focus();
    }

    // Revoke Blob URL after a delay so tab and download finish reading
    setTimeout(() => {
      try {
        URL.revokeObjectURL(blobUrl);
      } catch {
        // ignore
      }
    }, 180000);
  } catch (error) {
    console.error('Erreur lors du téléchargement du PDF :', error);
    alert('Une erreur est survenue lors de la génération du PDF. Veuillez réessayer.');
  }
}
