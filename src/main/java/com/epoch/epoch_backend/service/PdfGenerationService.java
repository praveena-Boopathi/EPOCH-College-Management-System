package com.epoch.epoch_backend.service;

import com.epoch.epoch_backend.model.FeeReceipt;
import com.epoch.epoch_backend.model.OdRequest;
import com.epoch.epoch_backend.model.OdStatus;
import com.epoch.epoch_backend.model.StaffSignature;
import com.epoch.epoch_backend.model.StudentComplaint;
import com.epoch.epoch_backend.model.ComplaintStatus;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Locale;
import java.util.Map;

@Service
public class PdfGenerationService {

    private final SignatureService signatureService;

    public PdfGenerationService(SignatureService signatureService) {
        this.signatureService = signatureService;
    }

    public byte[] generateApprovedPdf(OdRequest req) throws Exception {
        if (req.getStatus() != OdStatus.APPROVED) {
            throw new IllegalStateException("Official certificate can only be generated for APPROVED requests");
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 40, 40, 40, 40);
        PdfWriter.getInstance(document, baos);
        document.open();

        if (req.isBonafide()) {
            buildBonafideCertificatePdf(document, req);
        } else {
            buildNonBonafideApprovalPdf(document, req);
        }

        document.close();
        return baos.toByteArray();
    }

    /**
     * Bonafide Certificate PDF:
     * - College Header: GNANAMANI COLLEGE OF TECHNOLOGY
     * - Title: BONAFIDE CERTIFICATE
     * - 3 Signatures: Class Advisor, HOD, Principal
     */
    private void buildBonafideCertificatePdf(Document document, OdRequest req) throws Exception {
        Font collegeFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 15, new Color(15, 41, 66));
        Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA, 9, new Color(71, 85, 105));
        Font deptFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, new Color(30, 58, 95));
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, new Color(15, 41, 66));
        Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, new Color(30, 41, 59));
        Font regularFont = FontFactory.getFont(FontFactory.HELVETICA, 9.5f, Color.BLACK);
        Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);
        Font bodyBoldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, new Color(15, 41, 66));

        // Institutional Header
        PdfPTable headerTable = new PdfPTable(1);
        headerTable.setWidthPercentage(100);

        PdfPCell c1 = new PdfPCell(new Phrase("GNANAMANI COLLEGE OF TECHNOLOGY", collegeFont));
        c1.setHorizontalAlignment(Element.ALIGN_CENTER);
        c1.setBorder(Rectangle.NO_BORDER);
        headerTable.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Phrase("(An Autonomous Institution - Affiliated to Anna University, Chennai)", subTitleFont));
        c2.setHorizontalAlignment(Element.ALIGN_CENTER);
        c2.setBorder(Rectangle.NO_BORDER);
        headerTable.addCell(c2);

        PdfPCell cLoc = new PdfPCell(new Phrase("NH-7, A.K. Samuthiram, Pachal (PO), Namakkal - 637 018, Tamil Nadu", subTitleFont));
        cLoc.setHorizontalAlignment(Element.ALIGN_CENTER);
        cLoc.setBorder(Rectangle.NO_BORDER);
        headerTable.addCell(cLoc);

        PdfPCell c3 = new PdfPCell(new Phrase("DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING", deptFont));
        c3.setHorizontalAlignment(Element.ALIGN_CENTER);
        c3.setPaddingTop(4);
        c3.setPaddingBottom(6);
        c3.setBorder(Rectangle.NO_BORDER);
        headerTable.addCell(c3);

        PdfPCell cDivider = new PdfPCell(new Phrase(""));
        cDivider.setBorder(Rectangle.BOTTOM);
        cDivider.setBorderColor(new Color(15, 41, 66));
        cDivider.setBorderWidth(1.5f);
        headerTable.addCell(cDivider);

        document.add(headerTable);
        document.add(new Paragraph(" "));

        // Certificate Banner
        PdfPTable certTitleTable = new PdfPTable(1);
        certTitleTable.setWidthPercentage(60);
        PdfPCell certCell = new PdfPCell(new Phrase("BONAFIDE CERTIFICATE", titleFont));
        certCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        certCell.setBackgroundColor(new Color(241, 245, 249));
        certCell.setPadding(6);
        certCell.setBorderColor(new Color(15, 41, 66));
        certTitleTable.addCell(certCell);
        document.add(certTitleTable);
        document.add(new Paragraph(" "));

        // Metadata: Reference Number & Approval Date
        PdfPTable metaTable = new PdfPTable(2);
        metaTable.setWidthPercentage(100);
        metaTable.setWidths(new float[]{1, 1});

        String issueDate = req.getPrincipalDecision() != null && req.getPrincipalDecision().get("timestamp") != null
                ? (String) req.getPrincipalDecision().get("timestamp")
                : req.getSubmittedAt();

        metaTable.addCell(createCell("Certificate Ref: " + req.getId(), boldFont, Element.ALIGN_LEFT));
        metaTable.addCell(createCell("Date of Issue: " + issueDate, regularFont, Element.ALIGN_RIGHT));
        document.add(metaTable);
        document.add(new Paragraph(" "));

        // Salutation
        Paragraph salutation = new Paragraph("TO WHOMSOEVER IT MAY CONCERN", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, new Color(15, 41, 66)));
        salutation.setAlignment(Element.ALIGN_CENTER);
        document.add(salutation);
        document.add(new Paragraph(" "));

        // Certificate Body Paragraph
        Paragraph p1 = new Paragraph();
        p1.setLeading(16);
        p1.add(new Chunk("This is to certify that Mr. / Ms. ", bodyFont));
        p1.add(new Chunk(req.getStudentName() != null ? req.getStudentName().toUpperCase() : "STUDENT", bodyBoldFont));
        p1.add(new Chunk(" (Register No: ", bodyFont));
        p1.add(new Chunk(req.getRegNo() != null ? req.getRegNo() : "", bodyBoldFont));
        p1.add(new Chunk(") is a bonafide student of Gnanamani College of Technology, studying in ", bodyFont));
        p1.add(new Chunk("IV Year B.E. Computer Science and Engineering", bodyBoldFont));
        p1.add(new Chunk(" (Section: " + (req.getSection() != null ? req.getSection() : "CSE") + ") during the academic year 2025–2026.", bodyFont));
        document.add(p1);

        document.add(new Paragraph(" "));

        Paragraph p2 = new Paragraph();
        p2.setLeading(16);
        p2.add(new Chunk("This certificate is issued upon the student's request for the purpose of: ", bodyFont));
        String purpose = req.getReason() != null && !req.getReason().isEmpty() ? req.getReason() : (req.getEventTitle() != null ? req.getEventTitle() : "Official Institutional Purpose");
        p2.add(new Chunk(purpose, bodyBoldFont));
        p2.add(new Chunk(".", bodyFont));
        document.add(p2);

        if (req.getSupportingDetails() != null && !req.getSupportingDetails().isEmpty() && !req.getSupportingDetails().equalsIgnoreCase(purpose)) {
            Paragraph p3 = new Paragraph();
            p3.setLeading(14);
            p3.add(new Chunk("Application Particulars / Authority: ", boldFont));
            p3.add(new Chunk(req.getSupportingDetails(), regularFont));
            document.add(p3);
        }

        document.add(new Paragraph(" "));
        document.add(new Paragraph(" "));

        // 3 Signature Columns: Class Advisor, HOD, Principal
        PdfPTable sigTable = new PdfPTable(3);
        sigTable.setWidthPercentage(100);
        sigTable.setWidths(new float[]{1f, 1f, 1f});

        // 1. Advisor
        sigTable.addCell(createSignatureCell(
                "Class Advisor (" + (req.getSection() != null ? req.getSection() : "CSE") + ")",
                req.getAdvisorDecision(),
                OdService.getAdvisorForSection(req.getSection()),
                boldFont, regularFont
        ));

        // 2. HOD
        sigTable.addCell(createSignatureCell(
                "Head of Department (CSE)",
                req.getHodDecision(),
                "gopinath",
                boldFont, regularFont
        ));

        // 3. Principal
        sigTable.addCell(createSignatureCell(
                "Principal",
                req.getPrincipalDecision(),
                "bsanjaygandhi",
                boldFont, regularFont
        ));

        document.add(sigTable);

        // Footer Note
        Paragraph footer = new Paragraph(
                "\nThis is an official Bonafide Certificate electronically verified and issued by Gnanamani College of Technology. Verification Ref: " + req.getId(),
                FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, Color.GRAY)
        );
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);
    }

    /**
     * Non-Bonafide Approval PDF (On-Duty / Leave):
     * - College Header: GNANAMANI COLLEGE OF TECHNOLOGY
     * - Verified student and request details
     * - 2 Signatures ONLY: Class Advisor and HOD (Principal is NOT included)
     */
    private void buildNonBonafideApprovalPdf(Document document, OdRequest req) throws Exception {
        Font collegeFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 15, new Color(15, 41, 66));
        Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA, 9, new Color(71, 85, 105));
        Font deptFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, new Color(30, 58, 95));
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new Color(15, 41, 66));
        Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, new Color(30, 41, 59));
        Font regularFont = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK);

        // Header Table
        PdfPTable headerTable = new PdfPTable(1);
        headerTable.setWidthPercentage(100);

        PdfPCell c1 = new PdfPCell(new Phrase("GNANAMANI COLLEGE OF TECHNOLOGY", collegeFont));
        c1.setHorizontalAlignment(Element.ALIGN_CENTER);
        c1.setBorder(Rectangle.NO_BORDER);
        headerTable.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Phrase("(An Autonomous Institution - Affiliated to Anna University, Chennai)", subTitleFont));
        c2.setHorizontalAlignment(Element.ALIGN_CENTER);
        c2.setBorder(Rectangle.NO_BORDER);
        headerTable.addCell(c2);

        PdfPCell c3 = new PdfPCell(new Phrase("DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING", deptFont));
        c3.setHorizontalAlignment(Element.ALIGN_CENTER);
        c3.setBorder(Rectangle.NO_BORDER);
        headerTable.addCell(c3);

        String docTitle;
        if (req.isLeave()) {
            docTitle = "OFFICIAL LEAVE APPROVAL CERTIFICATE";
        } else if (req.getOdType() != null && !req.getOdType().trim().isEmpty() && !req.getOdType().equalsIgnoreCase("On-Duty")) {
            docTitle = "OFFICIAL ON-DUTY (OD) APPROVAL CERTIFICATE – " + req.getOdType().toUpperCase();
        } else {
            docTitle = "OFFICIAL ON-DUTY (OD) APPROVAL CERTIFICATE";
        }

        PdfPCell c4 = new PdfPCell(new Phrase(docTitle, headerFont));
        c4.setHorizontalAlignment(Element.ALIGN_CENTER);
        c4.setPaddingTop(6);
        c4.setPaddingBottom(8);
        c4.setBorder(Rectangle.BOTTOM);
        c4.setBorderColor(new Color(15, 41, 66));
        c4.setBorderWidth(1.5f);
        headerTable.addCell(c4);

        document.add(headerTable);
        document.add(new Paragraph(" "));

        // Meta info
        PdfPTable metaTable = new PdfPTable(2);
        metaTable.setWidthPercentage(100);
        metaTable.setWidths(new float[]{1, 1});

        String approvalDate = req.getHodDecision() != null && req.getHodDecision().get("timestamp") != null
                ? (String) req.getHodDecision().get("timestamp")
                : req.getSubmittedAt();

        metaTable.addCell(createCell("Document Ref: " + req.getId(), boldFont, Element.ALIGN_LEFT));
        metaTable.addCell(createCell("Final Approval Date: " + approvalDate, regularFont, Element.ALIGN_RIGHT));

        document.add(metaTable);
        document.add(new Paragraph(" "));

        // Student Details Table (4 columns)
        PdfPTable studentTable = new PdfPTable(4);
        studentTable.setWidthPercentage(100);
        studentTable.setWidths(new float[]{1.5f, 2f, 1.5f, 2f});

        addTableRow(studentTable, "Student Name:", req.getStudentName(), "Register No:", req.getRegNo(), boldFont, regularFont);
        addTableRow(studentTable, "Department:", req.getDept(), "Class / Section:", req.getSection(), boldFont, regularFont);
        addTableRow(studentTable, "Student Type:", req.getStudentType() != null ? req.getStudentType() : "Day Scholar", "Category:", req.getOdType(), boldFont, regularFont);
        addTableRow(studentTable, "Start Date:", req.getStartDate(), "End Date:", req.getEndDate() + " (" + req.getNumberOfDays() + " Day(s))", boldFont, regularFont);
        if (req.getHostelDetails() != null && !req.getHostelDetails().trim().isEmpty()) {
            addTableRow(studentTable, "Hostel & Room:", req.getHostelDetails(), "Parent Contact:", req.getParentContact() != null ? req.getParentContact() : "-", boldFont, regularFont);
        }

        document.add(studentTable);
        document.add(new Paragraph(" "));

        // Event / Reason details
        Paragraph detailsPara = new Paragraph();
        detailsPara.add(new Chunk("Reason / Justification Details:\n", boldFont));
        detailsPara.add(new Chunk(req.getReason() != null ? req.getReason() : "N/A", regularFont));
        if (req.getSupportingDetails() != null && !req.getSupportingDetails().isEmpty()) {
            detailsPara.add(new Chunk("\nHost Organization & Venue:\n", boldFont));
            detailsPara.add(new Chunk(req.getSupportingDetails(), regularFont));
        }
        document.add(detailsPara);
        document.add(new Paragraph(" "));

        // Approval History Audit
        Paragraph auditTitle = new Paragraph("Institutional Approval History:", boldFont);
        document.add(auditTitle);

        PdfPTable auditTable = new PdfPTable(3);
        auditTable.setWidthPercentage(100);
        auditTable.setWidths(new float[]{1.5f, 2f, 2.5f});

        PdfPCell ah1 = new PdfPCell(new Phrase("Stage", boldFont));
        ah1.setBackgroundColor(new Color(241, 245, 249));
        auditTable.addCell(ah1);

        PdfPCell ah2 = new PdfPCell(new Phrase("Approver / Role", boldFont));
        ah2.setBackgroundColor(new Color(241, 245, 249));
        auditTable.addCell(ah2);

        PdfPCell ah3 = new PdfPCell(new Phrase("Decision Timestamp & Audit", boldFont));
        ah3.setBackgroundColor(new Color(241, 245, 249));
        auditTable.addCell(ah3);

        // Advisor row
        String advApprover = req.getAdvisorDecision() != null ? (String) req.getAdvisorDecision().get("approver") : "Class Advisor";
        String advTime = req.getAdvisorDecision() != null ? (String) req.getAdvisorDecision().get("timestamp") : "-";
        auditTable.addCell(new PdfPCell(new Phrase("Class Advisor Review", regularFont)));
        auditTable.addCell(new PdfPCell(new Phrase(advApprover + " (" + req.getSection() + ")", regularFont)));
        auditTable.addCell(new PdfPCell(new Phrase("APPROVED • " + advTime, regularFont)));

        // HOD row
        String hodApprover = req.getHodDecision() != null ? (String) req.getHodDecision().get("approver") : "Dr. K. Gopinath";
        String hodTime = req.getHodDecision() != null ? (String) req.getHodDecision().get("timestamp") : "-";
        auditTable.addCell(new PdfPCell(new Phrase("HOD Final Sanction", regularFont)));
        auditTable.addCell(new PdfPCell(new Phrase(hodApprover + " (HOD-CSE)", regularFont)));
        auditTable.addCell(new PdfPCell(new Phrase("APPROVED • " + hodTime, regularFont)));

        document.add(auditTable);
        document.add(new Paragraph(" "));

        // 2 Signature Columns ONLY: Class Advisor & HOD (NO Principal)
        PdfPTable sigTable = new PdfPTable(2);
        sigTable.setWidthPercentage(100);
        sigTable.setWidths(new float[]{1f, 1f});

        // 1. Advisor Column
        sigTable.addCell(createSignatureCell(
                "Class Advisor (" + (req.getSection() != null ? req.getSection() : "CSE") + ")",
                req.getAdvisorDecision(),
                OdService.getAdvisorForSection(req.getSection()),
                boldFont, regularFont
        ));

        // 2. HOD Column
        sigTable.addCell(createSignatureCell(
                "Head of Department (CSE)",
                req.getHodDecision(),
                "gopinath",
                boldFont, regularFont
        ));

        document.add(sigTable);

        // Footer note
        Paragraph footer = new Paragraph(
                "\nThis is an official college record digitally sanctioned by the Head of Department. Verification Ref: " + req.getId(),
                FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, Color.GRAY)
        );
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);
    }

    private PdfPCell createCell(String text, Font font, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setHorizontalAlignment(alignment);
        return cell;
    }

    private void addTableRow(PdfPTable table, String h1, String v1, String h2, String v2, Font bf, Font rf) {
        PdfPCell c1 = new PdfPCell(new Phrase(h1, bf));
        c1.setBackgroundColor(new Color(245, 247, 250));
        table.addCell(c1);
        table.addCell(new PdfPCell(new Phrase(v1 != null ? v1 : "", rf)));

        PdfPCell c2 = new PdfPCell(new Phrase(h2, bf));
        c2.setBackgroundColor(new Color(245, 247, 250));
        table.addCell(c2);
        table.addCell(new PdfPCell(new Phrase(v2 != null ? v2 : "", rf)));
    }

    private PdfPCell createSignatureCell(String title, Map<String, Object> decision, String fallbackUsername, Font bf, Font rf) {
        PdfPCell cell = new PdfPCell();
        cell.setMinimumHeight(85);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setBorder(Rectangle.BOX);
        cell.setBorderColor(new Color(203, 213, 225));
        cell.setPadding(8);

        Paragraph pTitle = new Paragraph(title, bf);
        pTitle.setAlignment(Element.ALIGN_CENTER);
        cell.addElement(pTitle);

        if (decision != null && "APPROVED".equalsIgnoreCase((String) decision.get("status"))) {
            String approver = (String) decision.get("approver");
            String signerName = (String) decision.get("signerName");
            String timestamp = (String) decision.get("timestamp");
            String sigBase64 = (String) decision.get("signatureBase64");

            // Fallback to signature service if snapshot doesn't contain base64
            try {
                if (sigBase64 == null || sigBase64.isEmpty()) {
                    String userKey = approver != null ? approver : fallbackUsername;
                    StaffSignature ss = signatureService.getSignature(userKey);
                    if (ss != null) {
                        sigBase64 = ss.getSignatureBase64();
                        if (signerName == null || signerName.isEmpty()) {
                            signerName = ss.getSignerName();
                        }
                    }
                }

                if (sigBase64 != null && !sigBase64.trim().isEmpty()) {
                    String base64Data = sigBase64.contains(",") ? sigBase64.split(",")[1] : sigBase64;
                    byte[] imgBytes = Base64.getDecoder().decode(base64Data);
                    Image img = Image.getInstance(imgBytes);
                    img.scaleToFit(110, 36);
                    img.setAlignment(Element.ALIGN_CENTER);
                    cell.addElement(img);
                }
            } catch (Exception ex) {
                System.err.println("PDF signature image render note: " + ex.getMessage());
            }

            String displayName = (signerName != null && !signerName.isEmpty()) ? signerName : approver;
            Paragraph pDetails = new Paragraph();
            pDetails.setAlignment(Element.ALIGN_CENTER);
            pDetails.add(new Chunk("Signed by: " + (displayName != null ? displayName : "Authorized Signatory") + "\n", rf));
            if (timestamp != null) {
                pDetails.add(new Chunk("Date: " + timestamp, FontFactory.getFont(FontFactory.HELVETICA, 7.5f, new Color(71, 85, 105))));
            }
            cell.addElement(pDetails);
        } else if (decision != null && "REJECTED".equalsIgnoreCase((String) decision.get("status"))) {
            Paragraph pRej = new Paragraph("\n[Rejected]", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, new Color(220, 38, 38)));
            pRej.setAlignment(Element.ALIGN_CENTER);
            cell.addElement(pRej);
            if (decision.get("reason") != null && !((String) decision.get("reason")).isEmpty()) {
                Paragraph pRejReason = new Paragraph("(" + decision.get("reason") + ")", FontFactory.getFont(FontFactory.HELVETICA, 7, Color.GRAY));
                pRejReason.setAlignment(Element.ALIGN_CENTER);
                cell.addElement(pRejReason);
            }
        } else {
            Paragraph pPending = new Paragraph("\n[Pending Approval]", FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8.5f, Color.LIGHT_GRAY));
            pPending.setAlignment(Element.ALIGN_CENTER);
            cell.addElement(pPending);
        }

        return cell;
    }

    public byte[] generateFeeReceiptPdf(FeeReceipt receipt) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 36, 36);
        PdfWriter.getInstance(document, baos);
        document.open();

        Font collegeFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 15, new Color(15, 41, 66));
        Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA, 9, new Color(71, 85, 105));
        Font deptFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, new Color(30, 58, 95));
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, new Color(15, 41, 66));
        Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, new Color(30, 41, 59));
        Font regularFont = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK);
        Font bodyBoldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, new Color(15, 41, 66));

        // 1. Institutional Header
        PdfPTable headerTable = new PdfPTable(1);
        headerTable.setWidthPercentage(100);

        PdfPCell c1 = new PdfPCell(new Phrase("GNANAMANI COLLEGE OF TECHNOLOGY", collegeFont));
        c1.setHorizontalAlignment(Element.ALIGN_CENTER);
        c1.setBorder(Rectangle.NO_BORDER);
        headerTable.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Phrase("(An Autonomous Institution - Affiliated to Anna University, Chennai)", subTitleFont));
        c2.setHorizontalAlignment(Element.ALIGN_CENTER);
        c2.setBorder(Rectangle.NO_BORDER);
        headerTable.addCell(c2);

        PdfPCell cLoc = new PdfPCell(new Phrase("NH-7, A.K. Samuthiram, Pachal (PO), Namakkal - 637 018, Tamil Nadu", subTitleFont));
        cLoc.setHorizontalAlignment(Element.ALIGN_CENTER);
        cLoc.setBorder(Rectangle.NO_BORDER);
        headerTable.addCell(cLoc);

        PdfPCell c3 = new PdfPCell(new Phrase("DIRECTORATE OF FINANCE & ACCOUNTS", deptFont));
        c3.setHorizontalAlignment(Element.ALIGN_CENTER);
        c3.setBorder(Rectangle.NO_BORDER);
        c3.setPaddingTop(3);
        c3.setPaddingBottom(4);
        headerTable.addCell(c3);

        PdfPCell cDivider = new PdfPCell();
        cDivider.setBorder(Rectangle.BOTTOM);
        cDivider.setBorderColor(new Color(13, 148, 136));
        cDivider.setBorderWidth(1.5f);
        headerTable.addCell(cDivider);

        document.add(headerTable);
        document.add(new Paragraph(" "));

        // 2. Receipt Banner
        PdfPTable receiptTitleTable = new PdfPTable(1);
        receiptTitleTable.setWidthPercentage(60);
        PdfPCell titleCell = new PdfPCell(new Phrase("OFFICIAL FEE PAYMENT RECEIPT", titleFont));
        titleCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        titleCell.setBackgroundColor(new Color(241, 245, 249));
        titleCell.setBorder(Rectangle.BOX);
        titleCell.setBorderColor(new Color(203, 213, 225));
        titleCell.setPadding(6);
        receiptTitleTable.addCell(titleCell);
        document.add(receiptTitleTable);
        document.add(new Paragraph(" "));

        // 3. Receipt Meta Table
        PdfPTable metaTable = new PdfPTable(2);
        metaTable.setWidthPercentage(100);
        metaTable.setWidths(new float[]{1, 1});

        PdfPCell leftMeta = new PdfPCell();
        leftMeta.setBorder(Rectangle.NO_BORDER);
        leftMeta.addElement(new Paragraph("Receipt No: " + receipt.getId(), boldFont));
        leftMeta.addElement(new Paragraph("Payment Date: " + receipt.getPaymentDate(), regularFont));
        leftMeta.addElement(new Paragraph("Verification Date: " + receipt.getVerifiedDate(), regularFont));
        metaTable.addCell(leftMeta);

        PdfPCell rightMeta = new PdfPCell();
        rightMeta.setBorder(Rectangle.NO_BORDER);
        rightMeta.setHorizontalAlignment(Element.ALIGN_RIGHT);
        Paragraph pStat = new Paragraph("Status: CONFIRMED & VERIFIED", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9.5f, new Color(13, 148, 136)));
        pStat.setAlignment(Element.ALIGN_RIGHT);
        rightMeta.addElement(pStat);
        Paragraph pMode = new Paragraph("Mode: " + receipt.getPaymentMode(), regularFont);
        pMode.setAlignment(Element.ALIGN_RIGHT);
        rightMeta.addElement(pMode);
        Paragraph pUtr = new Paragraph("UPI UTR / Ref: " + receipt.getUtrNumber(), boldFont);
        pUtr.setAlignment(Element.ALIGN_RIGHT);
        rightMeta.addElement(pUtr);
        metaTable.addCell(rightMeta);

        document.add(metaTable);
        document.add(new Paragraph(" "));

        // 4. Student & Academic Details Box
        PdfPTable studentTable = new PdfPTable(2);
        studentTable.setWidthPercentage(100);
        studentTable.setWidths(new float[]{1, 1});

        PdfPCell s1 = new PdfPCell();
        s1.setBackgroundColor(new Color(248, 250, 252));
        s1.setBorder(Rectangle.BOX);
        s1.setBorderColor(new Color(226, 232, 240));
        s1.setPadding(8);
        s1.addElement(new Paragraph("STUDENT DETAILS", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, new Color(71, 85, 105))));
        s1.addElement(new Paragraph("Name: " + receipt.getStudentName(), boldFont));
        s1.addElement(new Paragraph("Registration No: " + receipt.getStudentId(), regularFont));
        s1.addElement(new Paragraph("Class & Section: " + receipt.getSection(), regularFont));
        studentTable.addCell(s1);

        PdfPCell s2 = new PdfPCell();
        s2.setBackgroundColor(new Color(248, 250, 252));
        s2.setBorder(Rectangle.BOX);
        s2.setBorderColor(new Color(226, 232, 240));
        s2.setPadding(8);
        s2.addElement(new Paragraph("ACADEMIC PROGRAM", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, new Color(71, 85, 105))));
        s2.addElement(new Paragraph("Department: " + receipt.getDepartment(), regularFont));
        s2.addElement(new Paragraph("Academic Year: " + (receipt.getAcademicYear() != null ? receipt.getAcademicYear() : "IV Year B.E."), regularFont));
        s2.addElement(new Paragraph("Fee Category: " + receipt.getCategory(), boldFont));
        studentTable.addCell(s2);

        document.add(studentTable);
        document.add(new Paragraph(" "));

        // 5. Financial Breakdown Table
        PdfPTable finTable = new PdfPTable(3);
        finTable.setWidthPercentage(100);
        finTable.setWidths(new float[]{3.5f, 1.5f, 1.5f});

        Font whiteBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
        PdfPCell hDesc = new PdfPCell(new Phrase("Description & Purpose", whiteBold));
        hDesc.setBackgroundColor(new Color(15, 41, 66));
        hDesc.setPadding(6);
        finTable.addCell(hDesc);

        PdfPCell hPaid = new PdfPCell(new Phrase("Amount Received", whiteBold));
        hPaid.setBackgroundColor(new Color(15, 41, 66));
        hPaid.setPadding(6);
        hPaid.setHorizontalAlignment(Element.ALIGN_RIGHT);
        finTable.addCell(hPaid);

        PdfPCell hBal = new PdfPCell(new Phrase("Remaining Balance", whiteBold));
        hBal.setBackgroundColor(new Color(15, 41, 66));
        hBal.setPadding(6);
        hBal.setHorizontalAlignment(Element.ALIGN_RIGHT);
        finTable.addCell(hBal);

        PdfPCell rDesc = new PdfPCell(new Phrase(receipt.getCategory() + " - " + (receipt.getDescription() != null ? receipt.getDescription() : "College Fee"), regularFont));
        rDesc.setPadding(8);
        finTable.addCell(rDesc);

        PdfPCell rPaid = new PdfPCell(new Phrase("₹ " + String.format("%.2f", receipt.getAmountReceived()), bodyBoldFont));
        rPaid.setPadding(8);
        rPaid.setHorizontalAlignment(Element.ALIGN_RIGHT);
        finTable.addCell(rPaid);

        PdfPCell rBal = new PdfPCell(new Phrase("₹ " + String.format("%.2f", receipt.getRemainingBalance()), regularFont));
        rBal.setPadding(8);
        rBal.setHorizontalAlignment(Element.ALIGN_RIGHT);
        finTable.addCell(rBal);

        document.add(finTable);
        document.add(new Paragraph(" "));

        // 6. Verification & Signatory Box
        PdfPTable sigTable = new PdfPTable(2);
        sigTable.setWidthPercentage(100);
        sigTable.setWidths(new float[]{1.5f, 1f});

        PdfPCell noteCell = new PdfPCell();
        noteCell.setBorder(Rectangle.NO_BORDER);
        noteCell.addElement(new Paragraph("Important Note:", boldFont));
        noteCell.addElement(new Paragraph("This is an electronically generated institutional receipt issued by Gnanamani College of Technology. Verified against banking reconciliation records.", FontFactory.getFont(FontFactory.HELVETICA, 8, Color.DARK_GRAY)));
        sigTable.addCell(noteCell);

        PdfPCell verCell = new PdfPCell();
        verCell.setBorder(Rectangle.BOX);
        verCell.setBorderColor(new Color(13, 148, 136));
        verCell.setBackgroundColor(new Color(240, 253, 250));
        verCell.setPadding(8);
        verCell.setHorizontalAlignment(Element.ALIGN_CENTER);

        Paragraph v1 = new Paragraph("✓ DIGITALLY VERIFIED", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, new Color(13, 148, 136)));
        v1.setAlignment(Element.ALIGN_CENTER);
        verCell.addElement(v1);

        Paragraph v2 = new Paragraph(receipt.getVerifiedBy() != null ? receipt.getVerifiedBy() : "Accounts Directorate", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, new Color(15, 41, 66)));
        v2.setAlignment(Element.ALIGN_CENTER);
        verCell.addElement(v2);

        Paragraph v3 = new Paragraph(receipt.getVerifiedDate(), FontFactory.getFont(FontFactory.HELVETICA, 7.5f, Color.GRAY));
        v3.setAlignment(Element.ALIGN_CENTER);
        verCell.addElement(v3);

        sigTable.addCell(verCell);
        document.add(sigTable);

        document.close();
        return baos.toByteArray();
    }

    public byte[] generateComplaintPdf(StudentComplaint cmp) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 40, 40, 40, 40);
        PdfWriter.getInstance(document, baos);
        document.open();

        Font collegeFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 15, new Color(15, 41, 66));
        Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA, 9, new Color(71, 85, 105));
        Font deptFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, new Color(30, 58, 95));
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new Color(15, 41, 66));
        Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, new Color(30, 41, 59));
        Font regularFont = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK);

        // Header Table
        PdfPTable headerTable = new PdfPTable(1);
        headerTable.setWidthPercentage(100);

        PdfPCell c1 = new PdfPCell(new Phrase("GNANAMANI COLLEGE OF TECHNOLOGY", collegeFont));
        c1.setHorizontalAlignment(Element.ALIGN_CENTER);
        c1.setBorder(Rectangle.NO_BORDER);
        headerTable.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Phrase("(An Autonomous Institution - Affiliated to Anna University, Chennai)", subTitleFont));
        c2.setHorizontalAlignment(Element.ALIGN_CENTER);
        c2.setBorder(Rectangle.NO_BORDER);
        headerTable.addCell(c2);

        PdfPCell c3 = new PdfPCell(new Phrase("OFFICE OF THE PRINCIPAL & STUDENT GRIEVANCE CELL", deptFont));
        c3.setHorizontalAlignment(Element.ALIGN_CENTER);
        c3.setBorder(Rectangle.NO_BORDER);
        headerTable.addCell(c3);

        boolean isResolvedOrClosed = cmp.getStatus() == ComplaintStatus.RESOLVED || cmp.getStatus() == ComplaintStatus.CLOSED;
        String docTitle = isResolvedOrClosed
                ? "OFFICIAL COMPLAINT RESOLUTION RECORD"
                : "STUDENT GRIEVANCE & COMPLAINT ACKNOWLEDGEMENT";

        PdfPCell c4 = new PdfPCell(new Phrase(docTitle, headerFont));
        c4.setHorizontalAlignment(Element.ALIGN_CENTER);
        c4.setPaddingTop(6);
        c4.setPaddingBottom(8);
        c4.setBorder(Rectangle.BOTTOM);
        c4.setBorderColor(new Color(15, 41, 66));
        c4.setBorderWidth(1.5f);
        headerTable.addCell(c4);

        document.add(headerTable);
        document.add(new Paragraph(" "));

        // Meta Table
        PdfPTable metaTable = new PdfPTable(2);
        metaTable.setWidthPercentage(100);
        metaTable.setWidths(new float[]{1, 1});
        metaTable.addCell(createCell("Complaint Ref: " + cmp.getId(), boldFont, Element.ALIGN_LEFT));
        metaTable.addCell(createCell("Date Submitted: " + (cmp.getSubmittedAt() != null ? cmp.getSubmittedAt() : "-"), regularFont, Element.ALIGN_RIGHT));
        document.add(metaTable);
        document.add(new Paragraph(" "));

        // Student Classification Details Table (4 columns)
        PdfPTable studentTable = new PdfPTable(4);
        studentTable.setWidthPercentage(100);
        studentTable.setWidths(new float[]{1.5f, 2f, 1.5f, 2f});

        addTableRow(studentTable, "Student Name:", cmp.getStudentName(), "Register No:", cmp.getRegNo(), boldFont, regularFont);
        addTableRow(studentTable, "Department:", cmp.getDepartment() != null ? cmp.getDepartment() : "CSE", "Class / Section:", cmp.getSection(), boldFont, regularFont);
        addTableRow(studentTable, "Academic Year:", cmp.getYear() != null ? cmp.getYear() : "IV Year", "Student Type:", cmp.getStudentType() != null ? cmp.getStudentType() : "Day Scholar", boldFont, regularFont);
        addTableRow(studentTable, "Grievance Category:", cmp.getCategory(), "Current Status:", String.valueOf(cmp.getStatus()), boldFont, regularFont);

        document.add(studentTable);
        document.add(new Paragraph(" "));

        // Subject & Description
        Paragraph descPara = new Paragraph();
        descPara.add(new Chunk("Subject / Grievance Headline:\n", boldFont));
        descPara.add(new Chunk(cmp.getSubject() != null ? cmp.getSubject() : "N/A", regularFont));
        descPara.add(new Chunk("\n\nDetailed Description:\n", boldFont));
        descPara.add(new Chunk(cmp.getDescription() != null ? cmp.getDescription() : "N/A", regularFont));
        if (cmp.getSupportingInfo() != null && !cmp.getSupportingInfo().trim().isEmpty()) {
            descPara.add(new Chunk("\n\nSupporting Details:\n", boldFont));
            descPara.add(new Chunk(cmp.getSupportingInfo(), regularFont));
        }
        document.add(descPara);
        document.add(new Paragraph(" "));

        // Principal Response / Resolution if available
        if (cmp.getPrincipalResponse() != null && !cmp.getPrincipalResponse().trim().isEmpty()) {
            Paragraph respPara = new Paragraph();
            respPara.add(new Chunk("Principal Review & Resolution Decision:\n", boldFont));
            respPara.add(new Chunk(cmp.getPrincipalResponse(), regularFont));
            if (cmp.getRespondedAt() != null) {
                respPara.add(new Chunk("\nDecision Timestamp: " + cmp.getRespondedAt(), subTitleFont));
            }
            document.add(respPara);
            document.add(new Paragraph(" "));
        }

        // Verification & Signature Box
        PdfPTable sigTable = new PdfPTable(2);
        sigTable.setWidthPercentage(100);
        sigTable.setWidths(new float[]{1.5f, 1f});

        PdfPCell noteCell = new PdfPCell();
        noteCell.setBorder(Rectangle.NO_BORDER);
        noteCell.addElement(new Paragraph("Confidential Grievance Record:", boldFont));
        noteCell.addElement(new Paragraph("This is an official administrative document submitted directly to the Principal. All actions and decisions are logged in the institutional ledger.", FontFactory.getFont(FontFactory.HELVETICA, 8, Color.DARK_GRAY)));
        sigTable.addCell(noteCell);

        Map<String, Object> prinDecision = new java.util.HashMap<>();
        prinDecision.put("status", "APPROVED");
        prinDecision.put("approver", "bsanjaygandhi");
        prinDecision.put("signerName", "Dr. B. Sanjay Gandhi");
        prinDecision.put("approverRole", "Principal");
        prinDecision.put("timestamp", cmp.getRespondedAt() != null ? cmp.getRespondedAt() : cmp.getSubmittedAt());
        StaffSignature sig = signatureService.getSignature("bsanjaygandhi");
        if (sig != null && sig.getSignatureBase64() != null) {
            prinDecision.put("signatureBase64", sig.getSignatureBase64());
        }
        sigTable.addCell(createSignatureCell("Office of the Principal", prinDecision, "bsanjaygandhi", boldFont, regularFont));

        document.add(sigTable);

        document.close();
        return baos.toByteArray();
    }
}