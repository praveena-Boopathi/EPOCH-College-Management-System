# EPOCH — College Management System

An institutional enterprise web platform engineered for higher education institutions (Gnanamani College of Technology, Autonomous • Affiliated to Anna University, Chennai). **EPOCH** provides comprehensive role-based governance across Students, Class Advisors, Department Heads (HOD), and the Principal, unifying academic requisitions, multi-stage approval workflows, authorized electronic signatures, institutional messaging, confidential grievance redressal, announcements, and fee records.

---

## 🏛️ Project Architecture Overview

```
                                      ┌──────────────────────────────────────────────┐
                                      │             EPOCH Web Platform               │
                                      │   (Single-Page Enterprise Portal System)    │
                                      └──────────────────────┬───────────────────────┘
                                                             │
                                   ┌─────────────────────────┴─────────────────────────┐
                                   ▼                                                   ▼
                     ┌───────────────────────────┐                       ┌───────────────────────────┐
                     │   Responsive UI Layer     │                       │   Spring Boot 3 Backend   │
                     │  HTML5 • CSS3 • Modern JS │ ◄── REST APIs / JWT ─►│  Java 17 • Spring MVC/Sec  │
                     │  FontAwesome • KaTeX • QR │                       │  iText PDF • Firestore   │
                     └─────────────┬─────────────┘                       └─────────────┬─────────────┘
                                   │                                                   │
                                   └─────────────────────────┬─────────────────────────┘
                                                             ▼
                                              ┌─────────────────────────────┐
                                              │      Google Firebase        │
                                              │ Firestore • Firebase Auth   │
                                              │ Cloud Storage • Rules       │
                                              └─────────────────────────────┘
```

---

## ✨ Key System Modules & Features

### 1. 🔐 Role-Governed Authentication & Access Control
- **Distinct Academic Roles**: Dedicated sign-in and authorization portals for **Students**, **Class Advisors** (CSE-A, CSE-B, CSE-C), **Head of Department (HOD - CSE)**, and the **Principal**.
- **Cryptographic JWT Tokens**: Stateless HMAC-SHA256 authenticated requests with token expiration and role-based route filters.
- **Section-Isolated Data Security**: Class Advisors strictly access and review records pertaining to their assigned section.

### 2. 📝 Academic On-Duty (OD) & Leave Application Engine
- **7 Institutional OD Categories**: Symposium / Conference, Workshop, Hackathon, Paper Presentation, Project Competition, Sports / Cultural Event, Other.
- **High-Fidelity Printable Document Preview**: High-definition academic requisition layout displaying registration details, event venue, dates, reason, and institutional routing.
- **Residence-Specific Leave Applications**:
  - *Day Scholar*: Parent phone, reason, and date range.
  - *Hosteller*: Hostel block, room number, destination address, parent contact, departure & return times, and parental verbal consent verification.
- **Strict Two-Tier Approval Routing**:
  - **Workflow B (All ODs & Leave Requests)**: $\text{Student} \longrightarrow \text{Class Advisor} \longrightarrow \text{Head of Department (CSE Final Sanction)}$.
  - **Workflow A (Bonafide Certificates ONLY)**: $\text{Student} \longrightarrow \text{Class Advisor} \longrightarrow \text{Head of Department} \longrightarrow \text{Principal}$.
  - OD & Leave requests never route to the Principal; HOD is the final approving authority.

### 3. ✍️ Authorized Digital Signatures & Verifiable QR Certificates
- **Electronic Signatures**: Pre-registered authorized signatures captured and stamped upon approval decisions.
- **Digital Audit Trail**: Every stage records approver name, designation, timestamp, and optional remarks.
- **Dynamic PDF Generation**: High-resolution official documents generated on-the-fly via iText with verified college headers and signature stamps.
- **Live Verifiable QR Codes**: Cryptographically verifiable QR inspection modal for campus security and event attendance officers.

### 4. 📜 Bonafide Certificate Requisition & Issuance
- **3-Stage Institutional Clearance**: Routed from Student $\rightarrow$ Class Advisor $\rightarrow$ HOD $\rightarrow$ Principal.
- **Standardized Purposes**: Passport Application, Bank Education Loan, State/Central Scholarship, Industry Internship, Bus/Train Concession Pass.
- **Executive Seal**: Official Bonafide Certificate issued bearing the Principal's executive digital seal.

### 5. 🚨 Confidential Grievance & Student Redressal Cell
- **Direct-to-Principal Channel**: Confidential complaints route exclusively to Principal Dr. B. Sanjay Gandhi.
- **Guaranteed Anonymity/Privacy**: Class Advisors and Department HODs have zero visibility into grievance submissions.
- **Principal Resolution Feedback**: Formal resolution statements, priority status flags, and PDF complaint dossiers.

### 6. 💬 EPOCH Institutional Chat & Messaging System
- **Two-Way Institutional Communication**: Real-time messaging between students and faculty members.
- **Modern Chat Interface**: Instant search, category separation (Staff & Students), quoting, message replies, and attachment previews.

### 7. 📢 Institutional Announcements
- **Publisher Permissions**: Strictly reserved for Class Advisors, HOD, and Principal (students have view-only access).
- **Targeted Audiences**: Dispatches targeted to specific sections (CSE-A, CSE-B, CSE-C), combinations, or college-wide broadcasts.


### .8 🤖 AI Academic Assistant
- Embedded institutional assistant addressing student questions on Anna University 75% attendance criteria, OD application processes, safe leave headroom, and campus rules.

### 9. 👤 Personal Profile Management & Photo Uploads
- Universal profile photo upload supporting JPG, JPEG, PNG, and WEBP formats.
- Persistent Firestore storage with synchronized avatars across navigation, top bar, and chat.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | HTML5, CSS3 (Modern Responsive Grid/Flexbox), JavaScript (ES6+ Modules, async/await), FontAwesome, KaTeX KaTeX Math Rendering |
| **Backend Framework** | Java 17, Spring Boot 3.x (`spring-boot-starter-web`, `spring-boot-starter-security`) |
| **Cloud & Database** | Google Firebase (Cloud Firestore, Firebase Authentication, Firebase Admin SDK) |
| **Security & Auth** | JSON Web Tokens (JJWT 0.11.5), BCrypt Password Encryption, CORS Configuration |
| **Document Generation** | iText PDF Library (OpenPDF 1.3.30), QR Code Matrix Generation |
| **Payment Gateway** | Razorpay Java SDK 1.4.3 |
| **Build & Tooling** | Gradle Wrapper, PowerShell automation scripts |

---

## 📁 Repository Structure

```
epoch-backend/
├── src/
│   ├── main/
│   │   ├── java/com/epoch/epoch_backend/
│   │   │   ├── EpochBackendApplication.java       # Spring Boot main application entry point
│   │   │   ├── config/                           # Firebase & Security configuration
│   │   │   │   ├── FirebaseConfig.java
│   │   │   │   └── SecurityConfig.java
│   │   │   ├── controller/                       # REST API controllers
│   │   │   │   ├── AnnouncementController.java
│   │   │   │   ├── AttendanceController.java
│   │   │   │   ├── AuthController.java
│   │   │   │   ├── ChatController.java
│   │   │   │   ├── ComplaintController.java
│   │   │   │   ├── FeeController.java
│   │   │   │   ├── NotificationController.java
│   │   │   │   ├── OdController.java
│   │   │   │   ├── RealtimeController.java
│   │   │   │   ├── SignatureController.java
│   │   │   │   └── UserController.java
│   │   │   ├── model/                            # Data transfer and domain entities
│   │   │   ├── security/                         # JWT token provider & request filters
│   │   │   └── service/                          # Core business logic services
│   │   │       ├── AnnouncementService.java
│   │   │       ├── AttendanceService.java
│   │   │       ├── AuthService.java
│   │   │       ├── ChatService.java
│   │   │       ├── ComplaintService.java
│   │   │       ├── FeeService.java
│   │   │       ├── OdService.java
│   │   │       ├── PdfGenerationService.java
│   │   │       ├── SignatureService.java
│   │   │       └── UserService.java
│   │   └── resources/
│   │       ├── application.properties            # Backend properties and port config
│   │       ├── firebase-service-account.example.json # Service account template (secrets excluded)
│   │       └── static/                           # Client-side web application
│   │           ├── index.html                    # Single-Page Application interface
│   │           ├── css/
│   │           │   └── style.css                 # Comprehensive responsive styling
│   │           └── js/                           # Specialized modular frontend scripts
│   │               ├── advisor.js
│   │               ├── announcements.js
│   │               ├── app.js
│   │               ├── assistant.js
│   │               ├── auth.js
│   │               ├── chat.js
│   │               ├── demo-data.js
│   │               ├── hod.js
│   │               ├── principal.js
│   │               └── student.js
├── firestore.rules                               # Authoritative Firestore security rules
├── build.gradle                                  # Gradle dependencies and build configuration
├── gradlew.bat / gradlew                         # Gradle wrapper executable
└── README.md                                     # System documentation
```

---

## 🚀 Getting Started & Local Setup

### Prerequisites
1. **Java Development Kit (JDK 17)** or later:
   ```bash
   java -version
   ```
2. **Google Firebase Project**:
   - Create a project on the [Firebase Console](https://console.firebase.google.com/).
   - Enable **Cloud Firestore** in Native mode.
   - Generate a Firebase Admin Service Account Key JSON file.

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/praveena-Boopathi/EPOCH-College-Management-System.git
cd EPOCH-College-Management-System
```

---

### Step 2: Configure Environment & Service Account

1. Copy the example service account template:
   ```bash
   cp src/main/resources/firebase-service-account.example.json src/main/resources/firebase-service-account.json
   ```
2. Populate `src/main/resources/firebase-service-account.json` with your real private service account credentials:
   ```json
   {
     "type": "service_account",
     "project_id": "YOUR_FIREBASE_PROJECT_ID",
     "private_key_id": "YOUR_PRIVATE_KEY_ID",
     "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n",
     "client_email": "firebase-adminsdk@YOUR_PROJECT_ID.iam.gserviceaccount.com"
   }
   ```
3. Update `src/main/resources/application.properties` with your project configurations:
   ```properties
   spring.application.name=epoch-backend
   server.port=8080

   epoch.firebase.project-id=YOUR_FIREBASE_PROJECT_ID
   epoch.jwt.secret=YOUR_SECURE_256_BIT_SECRET_KEY
   epoch.jwt.expiration-ms=86400000
   ```

*(Note: `firebase-service-account.json` and private key files are strictly excluded from version control via `.gitignore`.)*

---

### Step 3: Build & Run the Backend

On Windows:
```cmd
gradlew.bat bootRun
```

On Linux / macOS:
```bash
./gradlew bootRun
```

When started, the Spring Boot application runs on `http://localhost:8080`.

---

### Step 4: Access the Application

Open any modern browser and navigate to:
```
http://localhost:8080
```

---

## 📸 Screenshots & UI Showcase

| Student Dashboard & OD Requisition | Class Advisor Review & Signature |
|:---:|:---:|
| ![Student Dashboard](docs/screenshots/student_dashboard.png) *(Placeholder)* | ![Advisor Review](docs/screenshots/advisor_review.png) *(Placeholder)* |

| HOD Final Endorsement & Form Issuance | Principal Confidential Grievances & Bonafide |
|:---:|:---:|
| ![HOD Endorsement](docs/screenshots/hod_portal.png) *(Placeholder)* | ![Principal Portal](docs/screenshots/principal_portal.png) *(Placeholder)* |

---

## 🔒 Security Best Practices Implemented

- **Private Keys Excluded**: Service account keys, environment variables, credentials, and Java heap dumps are strictly excluded from version control via `.gitignore`.
- **Stateless Authentication**: JWT tokens with cryptographically signed payloads.
- **Role Isolation**: Enforced at the controller level via Spring Security and at the database level via Firestore security rules.
- **Input Sanitization**: HTML escaping across dynamic DOM insertions to prevent Cross-Site Scripting (XSS).

---

## 📜 License

This project is licensed under the [MIT License](LICENSE) — see the LICENSE file for details.

---

## 👥 Contributors & Institutional Credits
- **Project**: EPOCH — College Management System
- **Repository**: [praveena-Boopathi/EPOCH-College-Management-System](https://github.com/praveena-Boopathi/EPOCH-College-Management-System)
- **Institution**: Gnanamani College of Technology (Autonomous), Namakkal, Tamil Nadu.
