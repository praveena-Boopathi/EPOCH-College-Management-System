package com.epoch.epoch_backend.service;

import com.epoch.epoch_backend.model.StaffSignature;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SignatureService {

    private final Firestore db;
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");
    private final Map<String, StaffSignature> signatureCache = new ConcurrentHashMap<>();

    public SignatureService(Firestore db) {
        this.db = db;
        initDefaultSignatures();
    }

    private void initDefaultSignatures() {
        createDefaultSignature("arularasi", "Mrs. P. Arularasi", "Class Advisor (CSE-A)");
        createDefaultSignature("divyabharathi", "Mrs. Dhivya Bharathi", "Class Advisor (CSE-B)");
        createDefaultSignature("dhivyabharathi", "Mrs. Dhivya Bharathi", "Class Advisor (CSE-B)");
        createDefaultSignature("rajavathijayapriya", "Dr. Rajavathi Jaya Priya", "Class Advisor (CSE-C)");
        createDefaultSignature("gopinath", "Dr. K. Gopinath", "Head of Department (CSE)");
        createDefaultSignature("bsanjaygandhi", "Dr. B. Sanjay Gandhi", "Principal");
    }

    public String canonicalUsername(String username) {
        if (username == null) return "";
        String u = username.trim().toLowerCase().replace("dr. ", "").replace("mrs. ", "").replace("p. ", "");
        if (u.contains("dhivya") || u.contains("divya")) return "divyabharathi";
        if (u.contains("raja") || u.contains("jayapriya")) return "rajavathijayapriya";
        if (u.contains("arula") || u.contains("arasi")) return "arularasi";
        if (u.contains("gopi") || u.contains("hod")) return "gopinath";
        if (u.contains("sanjay") || u.contains("principal") || u.contains("gandhi")) return "bsanjaygandhi";
        return u;
    }

    private String generateFallbackSignatureBase64(String signerName, String role) {
        try {
            int width = 280;
            int height = 80;
            BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
            Graphics2D g2 = img.createGraphics();
            g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

            // Transparent background
            g2.setColor(new Color(0, 0, 0, 0));
            g2.fillRect(0, 0, width, height);

            // Elegant deep blue institutional signature ink
            g2.setColor(new Color(15, 41, 66));
            Font cursiveFont = new Font("SansSerif", Font.ITALIC | Font.BOLD, 22);
            g2.setFont(cursiveFont);

            // Draw signature name
            g2.drawString(signerName, 12, 38);

            // Underline flourish
            g2.setStroke(new BasicStroke(2.0f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
            int strWidth = g2.getFontMetrics().stringWidth(signerName);
            int lineEnd = Math.min(width - 15, 12 + strWidth + 18);
            g2.drawLine(10, 48, lineEnd, 48);

            // Digital signature subline
            Font subFont = new Font("SansSerif", Font.PLAIN, 10);
            g2.setFont(subFont);
            g2.setColor(new Color(71, 85, 105));
            g2.drawString("Authorized Signature • " + role, 12, 65);

            g2.dispose();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(img, "png", baos);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (Exception e) {
            return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        }
    }

    private StaffSignature createDefaultSignature(String canonical, String signerName, String role) {
        StaffSignature sig = new StaffSignature();
        sig.setUsername(canonical);
        sig.setSignerName(signerName);
        sig.setRole(role);
        sig.setUploadedAt(LocalDateTime.now().format(formatter));
        sig.setSignatureBase64(generateFallbackSignatureBase64(signerName, role));
        signatureCache.put(canonical, sig);
        return sig;
    }

    public void saveSignature(String username, String signerName, String role, String signatureBase64) {
        String canonical = canonicalUsername(username);
        StaffSignature sig = new StaffSignature();
        sig.setUsername(canonical);
        sig.setSignerName(signerName != null && !signerName.isEmpty() ? signerName : username);
        sig.setRole(role != null && !role.isEmpty() ? role : "Staff");
        sig.setSignatureBase64(signatureBase64);
        sig.setUploadedAt(LocalDateTime.now().format(formatter));

        signatureCache.put(canonical, sig);

        try {
            db.collection("signatures").document(canonical).set(sig);
        } catch (Exception ex) {
            System.err.println("Firestore write failed for signature (saved in cache): " + ex.getMessage());
        }
    }

    public StaffSignature getSignature(String username) {
        String canonical = canonicalUsername(username);
        if (signatureCache.containsKey(canonical)) {
            return signatureCache.get(canonical);
        }
        try {
            DocumentSnapshot doc = db.collection("signatures").document(canonical).get().get(800, java.util.concurrent.TimeUnit.MILLISECONDS);
            if (doc.exists()) {
                StaffSignature sig = doc.toObject(StaffSignature.class);
                if (sig != null && sig.getSignatureBase64() != null && !sig.getSignatureBase64().isEmpty()) {
                    signatureCache.put(canonical, sig);
                    return sig;
                }
            }
        } catch (Exception ex) {
            System.err.println("Firestore read failed for signature (serving cache): " + ex.getMessage());
        }

        // Generate and cache default signature for this canonical user
        return switch (canonical) {
            case "arularasi" -> createDefaultSignature("arularasi", "Mrs. P. Arularasi", "Class Advisor (CSE-A)");
            case "divyabharathi", "dhivyabharathi" -> createDefaultSignature("divyabharathi", "Mrs. Dhivya Bharathi", "Class Advisor (CSE-B)");
            case "rajavathijayapriya" -> createDefaultSignature("rajavathijayapriya", "Dr. Rajavathi Jaya Priya", "Class Advisor (CSE-C)");
            case "gopinath" -> createDefaultSignature("gopinath", "Dr. K. Gopinath", "Head of Department (CSE)");
            case "bsanjaygandhi" -> createDefaultSignature("bsanjaygandhi", "Dr. B. Sanjay Gandhi", "Principal");
            default -> createDefaultSignature(canonical, username != null ? username : "Authorized Signatory", "Staff");
        };
    }
}
