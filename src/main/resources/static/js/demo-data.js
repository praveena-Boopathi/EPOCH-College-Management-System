/**
 * EPOCH College Management Platform - Demo State Store
 * ===================================================
 * DEMO ONLY: Provides isolated, in-memory/localStorage state for local testing.
 * Does NOT communicate with Firebase, create real accounts, or store sensitive credentials.
 */

const DemoStore = {
  STORAGE_KEY: "epoch_demo_state_v4",

  // Initial demo seed data
  getSeedData() {
    return {
      users: {
  "arularasi": {
    "identifier": "arularasi",
    "name": "Mrs. P. Arularasi",
    "role": "ADVISOR",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "email": "arularasi@gct.ac.in",
    "contact": "+91 98765 00002",
    "title": "Assistant Professor & Class Advisor (CSE-A)",
    "cabin": "Admin Block, Room 204",
    "bio": "Academic advisor for Section CSE-A. Overseeing student attendance, on-duty approvals, and mentor evaluations."
  },
  "divyabharathi": {
    "identifier": "divyabharathi",
    "name": "Dr. Divyabharathi",
    "role": "ADVISOR",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "email": "divyabharathi@gct.ac.in",
    "contact": "+91 98765 00012",
    "title": "Assistant Professor & Class Advisor (CSE-B)",
    "cabin": "Admin Block, Room 205",
    "bio": "Academic advisor for Section CSE-B."
  },
  "rajavathijayapriya": {
    "identifier": "rajavathijayapriya",
    "name": "Mrs. Rajavathi Jayapriya",
    "role": "ADVISOR",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "email": "advisor.c.demo@epoch.edu",
    "contact": "+91 98765 00013",
    "title": "Assistant Professor & Class Advisor (CSE-C)",
    "cabin": "Admin Block, Room 206",
    "bio": "Academic advisor for Section CSE-C."
  },
  "gopinath": {
    "identifier": "gopinath",
    "name": "Dr. K. Gopinath",
    "role": "HOD",
    "section": "ALL",
    "dept": "Computer Science & Engineering",
    "email": "gopinath@gct.ac.in",
    "contact": "+91 98765 00003",
    "title": "Professor & Head of Department (CSE)",
    "cabin": "CSE Department Head Office, Tech Block 1",
    "bio": "Head of Department supervising CSE academic curriculum, symposium endorsements, and faculty development."
  },
  "bsanjaygandhi": {
    "identifier": "bsanjaygandhi",
    "name": "Dr. B. Sanjay Gandhi",
    "role": "PRINCIPAL",
    "section": "ALL",
    "dept": "Administration",
    "email": "principal@gct.ac.in",
    "contact": "+91 98765 00004",
    "title": "Principal — Gnanamani College of Technology",
    "cabin": "Principal's Office, Main Administration Block",
    "bio": "Executive institutional leadership presiding over academic standards, accreditation, and student welfare."
  },
  "admin": {
    "identifier": "admin",
    "name": "Dr. S. K. Ramesh",
    "role": "ADMIN",
    "section": "ALL",
    "dept": "College Administration & Accounts",
    "email": "admin@gct.ac.in",
    "contact": "+91 98765 00099",
    "title": "College Administrator & Chief Accounts Officer",
    "cabin": "Administrative Block, Room 101",
    "bio": "Institutional administrator managing fee assignments, UPI payment verifications, student financial records, and campus-wide announcements."
  },
  "620823104002": {
    "identifier": "620823104002",
    "name": "ABINAYA G",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "abinayagopi3052006@gmail.com",
    "contact": "+91 9487784237",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering. Passionate about AI research and distributed systems.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 412,
      "percentage": 85.8,
      "safeLeavesRemaining": 5,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104003": {
    "identifier": "620823104003",
    "name": "ABINAYA P",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "aabikutty827@gmail.com",
    "contact": "+91 9363623761",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 411,
      "percentage": 82.8,
      "safeLeavesRemaining": 3,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104004": {
    "identifier": "620823104004",
    "name": "ABINAYA S",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "abinayasureshkumar04@gmail.com",
    "contact": "+91 9944484347",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 412,
      "percentage": 83.6,
      "safeLeavesRemaining": 4,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104005": {
    "identifier": "620823104005",
    "name": "ABIRAMI P",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "abirami3@gmail.com",
    "contact": "+91 8675384915",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 413,
      "percentage": 84.4,
      "safeLeavesRemaining": 5,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104007": {
    "identifier": "620823104007",
    "name": "ADONIYA N P",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "npadoniya@gmail.com",
    "contact": "+91 8667541092",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 414,
      "percentage": 85.2,
      "safeLeavesRemaining": 6,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104008": {
    "identifier": "620823104008",
    "name": "AJINA S",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "ajinasaids@gmail.com",
    "contact": "+91 9344417778",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 415,
      "percentage": 86,
      "safeLeavesRemaining": 7,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104009": {
    "identifier": "620823104009",
    "name": "AKASH V",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "avs629372@gmail.com",
    "contact": "+91 6374876743",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 416,
      "percentage": 86.8,
      "safeLeavesRemaining": 2,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104010": {
    "identifier": "620823104010",
    "name": "AMARNATH R",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "amar14052005@gmail.com",
    "contact": "+91 9842097353",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 417,
      "percentage": 87.6,
      "safeLeavesRemaining": 3,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104011": {
    "identifier": "620823104011",
    "name": "AMIT KUMAR",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "amitsiwan5038@gmail.com",
    "contact": "+91 8207854340",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 418,
      "percentage": 88.4,
      "safeLeavesRemaining": 4,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104012": {
    "identifier": "620823104012",
    "name": "ANKIT KUMAR",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "ankit43751@gmail.com",
    "contact": "+91 9113457529",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 419,
      "percentage": 89.2,
      "safeLeavesRemaining": 5,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104013": {
    "identifier": "620823104013",
    "name": "ANUSIYA D",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "anusanusiya300@gmail.com",
    "contact": "+91 8883171137",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 420,
      "percentage": 90,
      "safeLeavesRemaining": 6,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104014": {
    "identifier": "620823104014",
    "name": "ARIYA K",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "kandhasamyariya480@gmail.com",
    "contact": "+91 9585325221",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 421,
      "percentage": 90.8,
      "safeLeavesRemaining": 7,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104015": {
    "identifier": "620823104015",
    "name": "ARUNACHALAM M",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "arun2005ar@gmail.com",
    "contact": "+91 8489375273",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Student athlete and software enthusiast. Zonal Badminton team representative.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 377,
      "percentage": 78.5,
      "safeLeavesRemaining": 2,
      "status": "Eligible (Borderline)"
    }
  },
  "620823104017": {
    "identifier": "620823104017",
    "name": "AVANTHIKA V",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "dd9871116@gmail.com",
    "contact": "+91 8903743433",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 423,
      "percentage": 92.4,
      "safeLeavesRemaining": 3,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104018": {
    "identifier": "620823104018",
    "name": "AVULA KISHORE",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "kishorchinna03@eamil.com",
    "contact": "+91 8897511258",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "CSE student working on cloud computing architectures.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 343,
      "percentage": 71.4,
      "safeLeavesRemaining": 0,
      "status": "Deficit (Condonation Needed)"
    }
  },
  "620823104019": {
    "identifier": "620823104019",
    "name": "BALACHANDAR M",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "chandarb401@gmail.com",
    "contact": "+91 9786865403",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 425,
      "percentage": 94,
      "safeLeavesRemaining": 5,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104020": {
    "identifier": "620823104020",
    "name": "BALAMURUGAN C",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "ranibalam853@gmail.com",
    "contact": "+91 9787286154",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 426,
      "percentage": 82,
      "safeLeavesRemaining": 6,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104021": {
    "identifier": "620823104021",
    "name": "BALAMURUGAN P",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "balap20055@gmail.com",
    "contact": "+91 9486661885",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 427,
      "percentage": 82.8,
      "safeLeavesRemaining": 7,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104022": {
    "identifier": "620823104022",
    "name": "BALASUBRAMANI M",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "balasubramanikantha@gmail.com",
    "contact": "+91 9003846098",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 428,
      "percentage": 83.6,
      "safeLeavesRemaining": 2,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104023": {
    "identifier": "620823104023",
    "name": "BHARANIDHARAN S",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "bharanid292@gmail.com",
    "contact": "+91 6383223099",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 429,
      "percentage": 84.4,
      "safeLeavesRemaining": 3,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104024": {
    "identifier": "620823104024",
    "name": "BHAVADHARSHANA U",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "sanjeevsamsung4312@gmail.com",
    "contact": "+91 9994734312",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 430,
      "percentage": 85.2,
      "safeLeavesRemaining": 4,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104025": {
    "identifier": "620823104025",
    "name": "CHEREDDY UDAY",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "udaygaming743@gmail.com",
    "contact": "+91 8096369184",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 431,
      "percentage": 86,
      "safeLeavesRemaining": 5,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104026": {
    "identifier": "620823104026",
    "name": "CHEREDDY UPENDRA",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "upendrareddy1017@gmali.com",
    "contact": "+91 8096369184",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 432,
      "percentage": 86.8,
      "safeLeavesRemaining": 6,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104027": {
    "identifier": "620823104027",
    "name": "CHILAKALA SRIHARI REDDY",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "Chilakalasrihari7@gmail.com",
    "contact": "+91 7993145603",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 433,
      "percentage": 87.6,
      "safeLeavesRemaining": 7,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104028": {
    "identifier": "620823104028",
    "name": "DEEPA S",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "durgadeepa67@gmail.com",
    "contact": "+91 8056984090",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 434,
      "percentage": 88.4,
      "safeLeavesRemaining": 2,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104029": {
    "identifier": "620823104029",
    "name": "DEEPAN M A",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "deepandeepan67037@gmail.com",
    "contact": "+91 9789119789",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 435,
      "percentage": 89.2,
      "safeLeavesRemaining": 3,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104030": {
    "identifier": "620823104030",
    "name": "DEEPIKA T",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "t.deepika28032006@gmail.com",
    "contact": "+91 9095389053",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 436,
      "percentage": 90,
      "safeLeavesRemaining": 4,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104031": {
    "identifier": "620823104031",
    "name": "DEVA P",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "devapalanisamy2005@gmail.com",
    "contact": "+91 8300137703",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 437,
      "percentage": 90.8,
      "safeLeavesRemaining": 5,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104032": {
    "identifier": "620823104032",
    "name": "DEVADHARSHINI S",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "kalaidevaa9@gmail.com",
    "contact": "+91 9677750715",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 438,
      "percentage": 91.6,
      "safeLeavesRemaining": 6,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104033": {
    "identifier": "620823104033",
    "name": "DEVARAJ KAMARAJ",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "devakd2603@gmail.com",
    "contact": "+91 9095679603",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 439,
      "percentage": 92.4,
      "safeLeavesRemaining": 7,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104034": {
    "identifier": "620823104034",
    "name": "DEVISRI A",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "arivalazhandevisri@gmail.com",
    "contact": "+91 8124187047",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 410,
      "percentage": 93.2,
      "safeLeavesRemaining": 2,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104035": {
    "identifier": "620823104035",
    "name": "DHANUSHIYA M",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "dhanushiya132@gmail.com",
    "contact": "+91 8825530890",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 411,
      "percentage": 94,
      "safeLeavesRemaining": 3,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104036": {
    "identifier": "620823104036",
    "name": "DHARSHINI K",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "kumardharshini498@gmail.com",
    "contact": "+91 9487506558",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 412,
      "percentage": 82,
      "safeLeavesRemaining": 4,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104037": {
    "identifier": "620823104037",
    "name": "DHARSHINI K",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "mkdharshini23@gmail.com",
    "contact": "+91 9994897321",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 413,
      "percentage": 82.8,
      "safeLeavesRemaining": 5,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104038": {
    "identifier": "620823104038",
    "name": "DINESH KUMAR S",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "lovlydinesh64@gmail.com",
    "contact": "+91 8925709599",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 414,
      "percentage": 83.6,
      "safeLeavesRemaining": 6,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104039": {
    "identifier": "620823104039",
    "name": "DIVYA V T",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "divyavt202006@gmail.com",
    "contact": "+91 8248219435",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 415,
      "percentage": 84.4,
      "safeLeavesRemaining": 7,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104040": {
    "identifier": "620823104040",
    "name": "ELAKKIYA E",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "eelakkiyaelangovan2006@gmail.com",
    "contact": "+91 9976627072",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 416,
      "percentage": 85.2,
      "safeLeavesRemaining": 2,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104041": {
    "identifier": "620823104041",
    "name": "ELAVARASAN S",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "es9991288@gmail.com",
    "contact": "+91 7639217478",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 417,
      "percentage": 86,
      "safeLeavesRemaining": 3,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104042": {
    "identifier": "620823104042",
    "name": "EZHILMATHI K",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "ezhil7579@gmail.com",
    "contact": "+91 6379616618",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 418,
      "percentage": 86.8,
      "safeLeavesRemaining": 4,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104044": {
    "identifier": "620823104044",
    "name": "GANGA K",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "g8382315@gmail.com",
    "contact": "+91 9585506303",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 419,
      "percentage": 87.6,
      "safeLeavesRemaining": 5,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104045": {
    "identifier": "620823104045",
    "name": "GAYAM SAIKUMAR REDDY",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "saikumarreddygayam68@gmail.com",
    "contact": "+91 9985535937",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 420,
      "percentage": 88.4,
      "safeLeavesRemaining": 6,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104046": {
    "identifier": "620823104046",
    "name": "GAYATHRI B",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "gayujala@gmail.com",
    "contact": "+91 9443273366",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 421,
      "percentage": 89.2,
      "safeLeavesRemaining": 7,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104047": {
    "identifier": "620823104047",
    "name": "GIRINATH R",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "GirinathGirinath028@gmail.om",
    "contact": "+91 6383895767",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 422,
      "percentage": 90,
      "safeLeavesRemaining": 2,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104048": {
    "identifier": "620823104048",
    "name": "GOKUL K",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "gokulperumalgokul@gmail.com",
    "contact": "+91 8248258849",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 423,
      "percentage": 90.8,
      "safeLeavesRemaining": 3,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104049": {
    "identifier": "620823104049",
    "name": "GOKUL M",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "gokulmurugesan9356@gmail.com",
    "contact": "+91 9445848183",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 424,
      "percentage": 91.6,
      "safeLeavesRemaining": 4,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104050": {
    "identifier": "620823104050",
    "name": "GOKUL N",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "gokulgokuljnp2005@gmail.com",
    "contact": "+91 9487210625",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 425,
      "percentage": 92.4,
      "safeLeavesRemaining": 5,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104051": {
    "identifier": "620823104051",
    "name": "GOKULADHARSHINI S",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "gokuladharshini2415@gmail.com",
    "contact": "+91 9790627462",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 426,
      "percentage": 93.2,
      "safeLeavesRemaining": 6,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104052": {
    "identifier": "620823104052",
    "name": "GOKULAPRIYAN M A",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "magokulapriyanpacschemb@gmail.com",
    "contact": "+91 7010745018",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 427,
      "percentage": 94,
      "safeLeavesRemaining": 7,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104053": {
    "identifier": "620823104053",
    "name": "GOKULNATH M",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "sridharamudha78@gmail.com",
    "contact": "+91 9025985322",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 428,
      "percentage": 82,
      "safeLeavesRemaining": 2,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104054": {
    "identifier": "620823104054",
    "name": "GOKULNATHAN A",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "agokul6442@gmail.com",
    "contact": "+91 8883320046",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 429,
      "percentage": 82.8,
      "safeLeavesRemaining": 3,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104055": {
    "identifier": "620823104055",
    "name": "GORANTLA BHAVITHA",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "gorantlabhavitha2005@gmail.com",
    "contact": "+91 8247402007",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 430,
      "percentage": 83.6,
      "safeLeavesRemaining": 4,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104056": {
    "identifier": "620823104056",
    "name": "GOWSHICKRAJA V",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "gowshicklite@gmail.com",
    "contact": "+91 9488411557",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 431,
      "percentage": 84.4,
      "safeLeavesRemaining": 5,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104057": {
    "identifier": "620823104057",
    "name": "GOWTHAMAN K M",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "gowtham2507.mcg@gmail.com",
    "contact": "+91 8667702642",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 432,
      "percentage": 85.2,
      "safeLeavesRemaining": 6,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104058": {
    "identifier": "620823104058",
    "name": "GUNAVATHI S",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "gunavathiselvam06@gmail.com",
    "contact": "+91 9597519383",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 433,
      "percentage": 86,
      "safeLeavesRemaining": 7,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104059": {
    "identifier": "620823104059",
    "name": "HARIHARAN N",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "hariharannandha2005@gmail.com",
    "contact": "+91 9786032831",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 434,
      "percentage": 86.8,
      "safeLeavesRemaining": 2,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104060": {
    "identifier": "620823104060",
    "name": "HARI KRISHNA R",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "harikrishnakannaiya@gmail.com",
    "contact": "+91 9606554211",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 435,
      "percentage": 87.6,
      "safeLeavesRemaining": 3,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104061": {
    "identifier": "620823104061",
    "name": "HARIRAGUL R",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "hariragul088@gmail.com",
    "contact": "+91 9751767503",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 436,
      "percentage": 88.4,
      "safeLeavesRemaining": 4,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104062": {
    "identifier": "620823104062",
    "name": "HARISHRAJ J",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "harishrajj2005@gmail.com",
    "contact": "+91 8760626164",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 437,
      "percentage": 89.2,
      "safeLeavesRemaining": 5,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104063": {
    "identifier": "620823104063",
    "name": "JAISHREE R",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "jaishreeramesh792@gamil.com",
    "contact": "+91 8610947596",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 438,
      "percentage": 90,
      "safeLeavesRemaining": 6,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104064": {
    "identifier": "620823104064",
    "name": "JANA S",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "janasakthivel333@gmail.com",
    "contact": "+91 7373907849",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 439,
      "percentage": 90.8,
      "safeLeavesRemaining": 7,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104065": {
    "identifier": "620823104065",
    "name": "JANANI S",
    "role": "STUDENT",
    "section": "CSE-A",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "janjanani0808@gmail.com",
    "contact": "+91 8098789696",
    "advisor": "Mrs. P. Arularasi (CSE-A)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 410,
      "percentage": 91.6,
      "safeLeavesRemaining": 2,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104066": {
    "identifier": "620823104066",
    "name": "JANSI G",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "gjansi2005@gmail.com",
    "contact": "+91 7539901345",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Full-stack developer and CSE-B student representative.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 438,
      "percentage": 91.3,
      "safeLeavesRemaining": 8,
      "status": "Eligible (Exemplary)"
    }
  },
  "620823104067": {
    "identifier": "620823104067",
    "name": "JAYA SURIYA S",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "jayasuriya0702@gmail.com",
    "contact": "+91 6383078552",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 411,
      "percentage": 82.8,
      "safeLeavesRemaining": 3,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104068": {
    "identifier": "620823104068",
    "name": "JEEVANANTHAN S",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "jeevananthanjii@gmail.com",
    "contact": "+91 9600994661",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 412,
      "percentage": 83.6,
      "safeLeavesRemaining": 4,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104069": {
    "identifier": "620823104069",
    "name": "JIJITH P",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "palanisamyjijith@gmail.com",
    "contact": "+91 9600569421",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 413,
      "percentage": 84.4,
      "safeLeavesRemaining": 5,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104071": {
    "identifier": "620823104071",
    "name": "JOJI SUNNY",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "jojisunny0317@gmail.com",
    "contact": "+91 6282653781",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 414,
      "percentage": 85.2,
      "safeLeavesRemaining": 6,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104072": {
    "identifier": "620823104072",
    "name": "JOTHI EAASWARAN S",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "jothishsasii@gmail.com",
    "contact": "+91 8610762819",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 415,
      "percentage": 86,
      "safeLeavesRemaining": 7,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104073": {
    "identifier": "620823104073",
    "name": "KAAVIYA S",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "Kaviyak494@gmail.com",
    "contact": "+91 9353136192",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 416,
      "percentage": 86.8,
      "safeLeavesRemaining": 2,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104074": {
    "identifier": "620823104074",
    "name": "KALAIYARASAN P",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "kpgkalai2004@gmail.com",
    "contact": "+91 6381143502",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 417,
      "percentage": 87.6,
      "safeLeavesRemaining": 3,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104075": {
    "identifier": "620823104075",
    "name": "KARTHIK K",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "ksanjaiksanjai86@gmail.com",
    "contact": "+91 9786972473",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 418,
      "percentage": 88.4,
      "safeLeavesRemaining": 4,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104076": {
    "identifier": "620823104076",
    "name": "KASIRAJAN J",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "kasirajan11172005@gmail.com",
    "contact": "+91 9342174755",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 419,
      "percentage": 89.2,
      "safeLeavesRemaining": 5,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104077": {
    "identifier": "620823104077",
    "name": "KATHIRVEL M",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "mkathir989@gmail.com",
    "contact": "+91 9894212249",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 420,
      "percentage": 90,
      "safeLeavesRemaining": 6,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104078": {
    "identifier": "620823104078",
    "name": "KAVINKUMAR V",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "Kavin5714@gmail.com",
    "contact": "+91 8754120203",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 421,
      "percentage": 90.8,
      "safeLeavesRemaining": 7,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104079": {
    "identifier": "620823104079",
    "name": "KAVIPRAKASH R",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "pkavi8972@gmail.com",
    "contact": "+91 9025154860",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 422,
      "percentage": 91.6,
      "safeLeavesRemaining": 2,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104080": {
    "identifier": "620823104080",
    "name": "KAVIRAJA K",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "Kavirajak201@gmail.com",
    "contact": "+91 9361004632",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 423,
      "percentage": 92.4,
      "safeLeavesRemaining": 3,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104081": {
    "identifier": "620823104081",
    "name": "KAVIYA R",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "kaviya28209@gmail.com",
    "contact": "+91 8438819526",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 424,
      "percentage": 93.2,
      "safeLeavesRemaining": 4,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104082": {
    "identifier": "620823104082",
    "name": "KEVINSAMUVELS L",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "kevinsamuvels29@gmail.com",
    "contact": "+91 8489854003",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 425,
      "percentage": 94,
      "safeLeavesRemaining": 5,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104083": {
    "identifier": "620823104083",
    "name": "KIRAN K",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "kiran.k29012005@gmail.com",
    "contact": "+91 9942264603",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 426,
      "percentage": 82,
      "safeLeavesRemaining": 6,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104084": {
    "identifier": "620823104084",
    "name": "KIRUTHIK M",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "kiruthikmohan205@gmail.com",
    "contact": "+91 8428486779",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 427,
      "percentage": 82.8,
      "safeLeavesRemaining": 7,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104085": {
    "identifier": "620823104085",
    "name": "KIRUTHIKA K",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "abinrajkathiresan@gmail.com",
    "contact": "+91 9384756563",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 428,
      "percentage": 83.6,
      "safeLeavesRemaining": 2,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104086": {
    "identifier": "620823104086",
    "name": "KISORE VIGNESWARAN R",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "Kisore771@gmail.com",
    "contact": "+91 9042441049",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 429,
      "percentage": 84.4,
      "safeLeavesRemaining": 3,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104087": {
    "identifier": "620823104087",
    "name": "KONDURU DIVYA",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "kondurudivya85@gmail.com",
    "contact": "+91 7416283255",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 430,
      "percentage": 85.2,
      "safeLeavesRemaining": 4,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104089": {
    "identifier": "620823104089",
    "name": "LAKESHSHEKE L",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "lakeshsheke05@gmail.com",
    "contact": "+91 8610899421",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 431,
      "percentage": 86,
      "safeLeavesRemaining": 5,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104090": {
    "identifier": "620823104090",
    "name": "LALITHKUMAR R",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "rrlalithkumarrr@gmail.com",
    "contact": "+91 9790313670",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 432,
      "percentage": 86.8,
      "safeLeavesRemaining": 6,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104091": {
    "identifier": "620823104091",
    "name": "MADHANKUMAR S",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "Madhankumar5231@gmail.com",
    "contact": "+91 6383242425",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 433,
      "percentage": 87.6,
      "safeLeavesRemaining": 7,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104092": {
    "identifier": "620823104092",
    "name": "MAHALAKSHMI P",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "mahalakshmipasupuathy@gmail.com",
    "contact": "+91 9677329810",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 434,
      "percentage": 88.4,
      "safeLeavesRemaining": 2,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104093": {
    "identifier": "620823104093",
    "name": "MAHENDHIRAN E",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "mahedhiraneswaran@gmail.com",
    "contact": "+91 7418096719",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 435,
      "percentage": 89.2,
      "safeLeavesRemaining": 3,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104094": {
    "identifier": "620823104094",
    "name": "MAHIMA M",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "mahima29062006@gmail.com",
    "contact": "+91 6362853869",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 436,
      "percentage": 90,
      "safeLeavesRemaining": 4,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104095": {
    "identifier": "620823104095",
    "name": "MANAV SHARMA",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "manav34352@gmail.com",
    "contact": "+91 7739034352",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 437,
      "percentage": 90.8,
      "safeLeavesRemaining": 5,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104096": {
    "identifier": "620823104096",
    "name": "MANIVEL D",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "Manivel922006@gmail.com",
    "contact": "+91 9952339417",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 438,
      "percentage": 91.6,
      "safeLeavesRemaining": 6,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104097": {
    "identifier": "620823104097",
    "name": "MANO S",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "Sekarmano9342@Gmail.com",
    "contact": "+91 7603871156",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 439,
      "percentage": 92.4,
      "safeLeavesRemaining": 7,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104098": {
    "identifier": "620823104098",
    "name": "MD ASAD ANSARI",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "alimdsaif9314@gmail.com",
    "contact": "+91 9031409314",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 410,
      "percentage": 93.2,
      "safeLeavesRemaining": 2,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104099": {
    "identifier": "620823104099",
    "name": "MD KAIF ALI KHAN",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "kaif14515@gmail.com",
    "contact": "+91 8114523312",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 411,
      "percentage": 94,
      "safeLeavesRemaining": 3,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104100": {
    "identifier": "620823104100",
    "name": "MD TAUKIR ANSARI",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "taukirbhai572@gmail.com",
    "contact": "+91 9304311146",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 412,
      "percentage": 82,
      "safeLeavesRemaining": 4,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104101": {
    "identifier": "620823104101",
    "name": "MITRRA S K",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "Mithramithra242@gmail.com",
    "contact": "+91 9698816931",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 413,
      "percentage": 82.8,
      "safeLeavesRemaining": 5,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104103": {
    "identifier": "620823104103",
    "name": "MOHAMMED SIDDIQ M",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "Mohammedsiddiq8080@gmail.com",
    "contact": "+91 6369385104",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 414,
      "percentage": 83.6,
      "safeLeavesRemaining": 6,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104104": {
    "identifier": "620823104104",
    "name": "MOHANAPRIYA V",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "priyavsm2007@gmail.com",
    "contact": "+91 8056739908",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 415,
      "percentage": 84.4,
      "safeLeavesRemaining": 7,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104105": {
    "identifier": "620823104105",
    "name": "MONASH R",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "monashravi2006@gmail.com",
    "contact": "+91 9600378748",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 416,
      "percentage": 85.2,
      "safeLeavesRemaining": 2,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104106": {
    "identifier": "620823104106",
    "name": "MOULISHWARAN S",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "mouli5017@gmail.com",
    "contact": "+91 8838143122",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 417,
      "percentage": 86,
      "safeLeavesRemaining": 3,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104107": {
    "identifier": "620823104107",
    "name": "MUGUNTHAN A",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "mmugunthansuriya@gmail.com",
    "contact": "+91 8056597525",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 418,
      "percentage": 86.8,
      "safeLeavesRemaining": 4,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104108": {
    "identifier": "620823104108",
    "name": "MUTHARASAN P",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "mutharasanarasan9@gmail.com",
    "contact": "+91 8270974640",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 419,
      "percentage": 87.6,
      "safeLeavesRemaining": 5,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104109": {
    "identifier": "620823104109",
    "name": "MUTHU PANDI M",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "muthupandip354@gmail.com",
    "contact": "+91 9361368559",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 420,
      "percentage": 88.4,
      "safeLeavesRemaining": 6,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104110": {
    "identifier": "620823104110",
    "name": "NATHANI SOWKYA",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "sowkhyanathani@gmail.com",
    "contact": "+91 8147843619",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 421,
      "percentage": 89.2,
      "safeLeavesRemaining": 7,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104111": {
    "identifier": "620823104111",
    "name": "NAVASRI S",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "navasrisaravanan@gmail.com",
    "contact": "+91 8122115889",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 422,
      "percentage": 90,
      "safeLeavesRemaining": 2,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104112": {
    "identifier": "620823104112",
    "name": "NAVEENKUMAR G",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "naveenkumar1456@gmail.com",
    "contact": "+91 9940046857",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 423,
      "percentage": 90.8,
      "safeLeavesRemaining": 3,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104113": {
    "identifier": "620823104113",
    "name": "NAVEENKUMAR K",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "nishanthinaveen861@gmail.com",
    "contact": "+91 9789253071",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 424,
      "percentage": 91.6,
      "safeLeavesRemaining": 4,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104114": {
    "identifier": "620823104114",
    "name": "NAVIN KUMAR S",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "navindhanu2023@gmail.com",
    "contact": "+91 8778235393",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 425,
      "percentage": 92.4,
      "safeLeavesRemaining": 5,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104115": {
    "identifier": "620823104115",
    "name": "NETTAM UDAY KIRAN",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "nudaykirannuday@gmail.com",
    "contact": "+91 6304945209",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 426,
      "percentage": 93.2,
      "safeLeavesRemaining": 6,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104116": {
    "identifier": "620823104116",
    "name": "NISHA P",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "nishaprakash142006@gmail.com",
    "contact": "+91 6382756327",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 427,
      "percentage": 94,
      "safeLeavesRemaining": 7,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104118": {
    "identifier": "620823104118",
    "name": "NITHYADHARSHINI S",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "snithyadharshinisnithya@gmail.com",
    "contact": "+91 9345200213",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 428,
      "percentage": 82,
      "safeLeavesRemaining": 2,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104119": {
    "identifier": "620823104119",
    "name": "OVIYASRI P",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "reetairudhayam@gmail.comC",
    "contact": "+91 9750330939",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 429,
      "percentage": 82.8,
      "safeLeavesRemaining": 3,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104120": {
    "identifier": "620823104120",
    "name": "PALA ABHILASH",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "abhilashpala41@gmail.com",
    "contact": "+91 7816070540",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 430,
      "percentage": 83.6,
      "safeLeavesRemaining": 4,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104121": {
    "identifier": "620823104121",
    "name": "PANKAJ KUMAR YADAV",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "pankajydv787074@gmail.com",
    "contact": "+91 7870748165",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 431,
      "percentage": 84.4,
      "safeLeavesRemaining": 5,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104122": {
    "identifier": "620823104122",
    "name": "PARKAVIN L",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "parkavin7373@gmail.com",
    "contact": "+91 6381390388",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 432,
      "percentage": 85.2,
      "safeLeavesRemaining": 6,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104123": {
    "identifier": "620823104123",
    "name": "PAVITHRA J",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "pavithrajaganathan2436@gmail.com",
    "contact": "+91 7904925127",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 433,
      "percentage": 86,
      "safeLeavesRemaining": 7,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104124": {
    "identifier": "620823104124",
    "name": "PONSANKAR K",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "ponsankar2605@gmail.com",
    "contact": "+91 9345317058",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 434,
      "percentage": 86.8,
      "safeLeavesRemaining": 2,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104126": {
    "identifier": "620823104126",
    "name": "POORVASH S",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "Poorvashrichie32@gmail.com",
    "contact": "+91 9345881678",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 435,
      "percentage": 87.6,
      "safeLeavesRemaining": 3,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104127": {
    "identifier": "620823104127",
    "name": "PRADEEP S",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "pradeep1752006@gmail.com",
    "contact": "+91 6380340495",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 436,
      "percentage": 88.4,
      "safeLeavesRemaining": 4,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104128": {
    "identifier": "620823104128",
    "name": "PRADEEPKUMAR M",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "attupradeeppradeep@gmail.com",
    "contact": "+91 7418877938",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 437,
      "percentage": 89.2,
      "safeLeavesRemaining": 5,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104129": {
    "identifier": "620823104129",
    "name": "PRAJITKUMAR V S",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "vstarmeshvstarmesh@gmail.com",
    "contact": "+91 6385533689",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 438,
      "percentage": 90,
      "safeLeavesRemaining": 6,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104130": {
    "identifier": "620823104130",
    "name": "PRASANNA R",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "prasannarajapriya@gmail.com",
    "contact": "+91 6383847466",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 439,
      "percentage": 90.8,
      "safeLeavesRemaining": 7,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104131": {
    "identifier": "620823104131",
    "name": "PRASATH B",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "Prasathprince276@gmail.com",
    "contact": "+91 8122050270",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 410,
      "percentage": 91.6,
      "safeLeavesRemaining": 2,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104132": {
    "identifier": "620823104132",
    "name": "PRAVEEN A",
    "role": "STUDENT",
    "section": "CSE-B",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "praveenapraveen104@gmail.com",
    "contact": "+91 9566937837",
    "advisor": "Dr. Divyabharathi (CSE-B)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 411,
      "percentage": 92.4,
      "safeLeavesRemaining": 3,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104133": {
    "identifier": "620823104133",
    "name": "PRAVEENA B",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "praveena90613@gmail.com",
    "contact": "+91 9043840935",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "CSE-C undergraduate student active in coding competitions.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 420,
      "percentage": 87.5,
      "safeLeavesRemaining": 6,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104134": {
    "identifier": "620823104134",
    "name": "PRAVEENA C",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "praveenachinnusamy006@gmail.com",
    "contact": "+91 7604864152",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 411,
      "percentage": 82.8,
      "safeLeavesRemaining": 3,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104135": {
    "identifier": "620823104135",
    "name": "PRIYADHARSHINI M",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "priyadharshinimohanraj5080@gmail.com",
    "contact": "+91 9943163226",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 412,
      "percentage": 83.6,
      "safeLeavesRemaining": 4,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104137": {
    "identifier": "620823104137",
    "name": "PUGAZHENTHI S",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "jayapugazh947@gmail.com",
    "contact": "+91 9943205075",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 413,
      "percentage": 84.4,
      "safeLeavesRemaining": 5,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104138": {
    "identifier": "620823104138",
    "name": "R RAM MOORTHY",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "rammoorthyram83@gmail.com",
    "contact": "+91 8019862077",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 414,
      "percentage": 85.2,
      "safeLeavesRemaining": 6,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104139": {
    "identifier": "620823104139",
    "name": "RACHANA N",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "rachanamylu12@gmail.com",
    "contact": "+91 6379380557",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 415,
      "percentage": 86,
      "safeLeavesRemaining": 7,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104140": {
    "identifier": "620823104140",
    "name": "RAHUL KUMAR CHAUPAL",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "chaupalrahul000@gmailcom",
    "contact": "+91 8002545435",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 416,
      "percentage": 86.8,
      "safeLeavesRemaining": 2,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104141": {
    "identifier": "620823104141",
    "name": "RAJA M",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "tamilan8487@gmail.com",
    "contact": "+91 9345726855",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 417,
      "percentage": 87.6,
      "safeLeavesRemaining": 3,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104142": {
    "identifier": "620823104142",
    "name": "RASANI MEHA",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "rasaniramesh@gmail.com",
    "contact": "+91 9121105135",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 418,
      "percentage": 88.4,
      "safeLeavesRemaining": 4,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104143": {
    "identifier": "620823104143",
    "name": "RAVI D",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "raviravi44012@gmail.com",
    "contact": "+91 8098200749",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 419,
      "percentage": 89.2,
      "safeLeavesRemaining": 5,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104145": {
    "identifier": "620823104145",
    "name": "SACHIN YADAV",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "seemasachin979@gmail.com",
    "contact": "+91 6387605916",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 420,
      "percentage": 90,
      "safeLeavesRemaining": 6,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104146": {
    "identifier": "620823104146",
    "name": "SAKTHIVEL S",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "sakthiselva62@gmail.com",
    "contact": "+91 6379888531",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 421,
      "percentage": 90.8,
      "safeLeavesRemaining": 7,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104147": {
    "identifier": "620823104147",
    "name": "SAMUVEL D",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "samuvelsamuvel@gmail.com",
    "contact": "+91 9345222979",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 422,
      "percentage": 91.6,
      "safeLeavesRemaining": 2,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104148": {
    "identifier": "620823104148",
    "name": "SANJAI K",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "k.sanjaisanjai33@gmail.com",
    "contact": "+91 9597419578",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 423,
      "percentage": 92.4,
      "safeLeavesRemaining": 3,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104149": {
    "identifier": "620823104149",
    "name": "SANJAI S",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "sanjaisankar049@gmail.com",
    "contact": "+91 6381055294",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 424,
      "percentage": 93.2,
      "safeLeavesRemaining": 4,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104150": {
    "identifier": "620823104150",
    "name": "SANJAY A",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "sanjayarul705@gmail.com",
    "contact": "+91 9043215573",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 425,
      "percentage": 94,
      "safeLeavesRemaining": 5,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104151": {
    "identifier": "620823104151",
    "name": "SANJAY P",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "sanjayp132005@gmail.com",
    "contact": "+91 8940509032",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 426,
      "percentage": 82,
      "safeLeavesRemaining": 6,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104152": {
    "identifier": "620823104152",
    "name": "SANJAYKISHORE M",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "deenusanjay10@gmail.com",
    "contact": "+91 7010326679",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 427,
      "percentage": 82.8,
      "safeLeavesRemaining": 7,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104153": {
    "identifier": "620823104153",
    "name": "SANTHIYA V",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "santhiyavnkl@gmail.com",
    "contact": "+91 9790159848",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 428,
      "percentage": 83.6,
      "safeLeavesRemaining": 2,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104154": {
    "identifier": "620823104154",
    "name": "SANTHOSHKUMAR M",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "santhoshkumar160706@gmail.com",
    "contact": "+91 9345402493",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 429,
      "percentage": 84.4,
      "safeLeavesRemaining": 3,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104156": {
    "identifier": "620823104156",
    "name": "SARANG K",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "kSarang600@gmail.com",
    "contact": "+91 9495006186",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 430,
      "percentage": 85.2,
      "safeLeavesRemaining": 4,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104157": {
    "identifier": "620823104157",
    "name": "SARAVANAKUMAR R",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "saravanakumar12032005@gmail.com",
    "contact": "+91 6379598677",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 431,
      "percentage": 86,
      "safeLeavesRemaining": 5,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104158": {
    "identifier": "620823104158",
    "name": "SARAVANAVEL M",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "vel793028@gmail.com",
    "contact": "+91 7806940773",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 432,
      "percentage": 86.8,
      "safeLeavesRemaining": 6,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104159": {
    "identifier": "620823104159",
    "name": "SASIKUMAR R",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "r.sasikumar016@gmail.com",
    "contact": "+91 9345726098",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 433,
      "percentage": 87.6,
      "safeLeavesRemaining": 7,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104160": {
    "identifier": "620823104160",
    "name": "SATYAM KUMAR SINGH",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "satyamsinghrajput01778@gmail.com",
    "contact": "+91 8541823196",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 434,
      "percentage": 88.4,
      "safeLeavesRemaining": 2,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104161": {
    "identifier": "620823104161",
    "name": "SHAIK MOHAMMED",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "shaikmohammed44926@gmail.com",
    "contact": "+91 9515585943",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 435,
      "percentage": 89.2,
      "safeLeavesRemaining": 3,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104162": {
    "identifier": "620823104162",
    "name": "SHAKILA T",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "shakilathangarasubecse@gmail.com",
    "contact": "+91 8220195892",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 436,
      "percentage": 90,
      "safeLeavesRemaining": 4,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104164": {
    "identifier": "620823104164",
    "name": "SNEKA S",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "snekapappu7695@gmail.com",
    "contact": "+91 8248567695",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 437,
      "percentage": 90.8,
      "safeLeavesRemaining": 5,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104165": {
    "identifier": "620823104165",
    "name": "SOWMIYA L",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "sowmiyalogu2006@gmail.com",
    "contact": "+91 9345302588",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 438,
      "percentage": 91.6,
      "safeLeavesRemaining": 6,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104166": {
    "identifier": "620823104166",
    "name": "SUBHASH KUMAR",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "subhashkumar8873670435@gmail.com",
    "contact": "+91 8873670435",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 439,
      "percentage": 92.4,
      "safeLeavesRemaining": 7,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104167": {
    "identifier": "620823104167",
    "name": "SUBISRI S",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "subisriselvakumar@gmail.com",
    "contact": "+91 9080402566",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 410,
      "percentage": 93.2,
      "safeLeavesRemaining": 2,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104168": {
    "identifier": "620823104168",
    "name": "SUDHARSAN S",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "ipssudharsan2@gmail.com",
    "contact": "+91 6374435625",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 411,
      "percentage": 94,
      "safeLeavesRemaining": 3,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104169": {
    "identifier": "620823104169",
    "name": "SUJITH S",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "sujithff123@gmail.com",
    "contact": "+91 6381357523",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 412,
      "percentage": 82,
      "safeLeavesRemaining": 4,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104170": {
    "identifier": "620823104170",
    "name": "SUMITHRA K",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "kumaresanparimala104@gmail.com",
    "contact": "+91 9342928248",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 413,
      "percentage": 82.8,
      "safeLeavesRemaining": 5,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104171": {
    "identifier": "620823104171",
    "name": "SURENDHAR R",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "surendhar738@gmail.com",
    "contact": "+91 6382339698",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 414,
      "percentage": 83.6,
      "safeLeavesRemaining": 6,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104172": {
    "identifier": "620823104172",
    "name": "SWETHA R",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "ariyaramesh0@gmail.com",
    "contact": "+91 9042903821",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 415,
      "percentage": 84.4,
      "safeLeavesRemaining": 7,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104173": {
    "identifier": "620823104173",
    "name": "SYED UMAR FAROOQ",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "usyed7208@gmail.com",
    "contact": "+91 9966992615",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 416,
      "percentage": 85.2,
      "safeLeavesRemaining": 2,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104174": {
    "identifier": "620823104174",
    "name": "TAMIZHARASAN P",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "ta6705869@gmail.com",
    "contact": "+91 9843544369",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 417,
      "percentage": 86,
      "safeLeavesRemaining": 3,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104175": {
    "identifier": "620823104175",
    "name": "THANIGAIVELAN S",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "amuthanthangai143@gmail.com",
    "contact": "+91 9442487157",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 418,
      "percentage": 86.8,
      "safeLeavesRemaining": 4,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104176": {
    "identifier": "620823104176",
    "name": "THILAKESWARAN B",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "thilakesb@gmail.com",
    "contact": "+91 7904865511",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 419,
      "percentage": 87.6,
      "safeLeavesRemaining": 5,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104177": {
    "identifier": "620823104177",
    "name": "VAITHISWARAN P",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "vaithiswaranp@gmail.com",
    "contact": "+91 8778328194",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 420,
      "percentage": 88.4,
      "safeLeavesRemaining": 6,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104178": {
    "identifier": "620823104178",
    "name": "VEEMARASU M",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "veemarasu12@gmail.com",
    "contact": "+91 8098435255",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 421,
      "percentage": 89.2,
      "safeLeavesRemaining": 7,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104179": {
    "identifier": "620823104179",
    "name": "VIKRAM S",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "vikram20063206@gmail.com",
    "contact": "+91 9788893709",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 422,
      "percentage": 90,
      "safeLeavesRemaining": 2,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104180": {
    "identifier": "620823104180",
    "name": "VINOTHINI C",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "vinothinichinnadurai13@gmail.com",
    "contact": "+91 9629701776",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 423,
      "percentage": 90.8,
      "safeLeavesRemaining": 3,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104181": {
    "identifier": "620823104181",
    "name": "VISHVA V",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "vishvavimal376@gmail.com",
    "contact": "+91 6381088434",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 424,
      "percentage": 91.6,
      "safeLeavesRemaining": 4,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104182": {
    "identifier": "620823104182",
    "name": "VISWANATHAN S",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "viswavickysrs@gmail.com",
    "contact": "+91 9629001066",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 425,
      "percentage": 92.4,
      "safeLeavesRemaining": 5,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104183": {
    "identifier": "620823104183",
    "name": "YAMUNASRI V",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "yammunasri324@gmail.com",
    "contact": "+91 7200501665",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 426,
      "percentage": 93.2,
      "safeLeavesRemaining": 6,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104184": {
    "identifier": "620823104184",
    "name": "YKUNTAM MANOJ YADAV",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "manojmanum740@gmail.com",
    "contact": "+91 9391400508",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 427,
      "percentage": 94,
      "safeLeavesRemaining": 7,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104185": {
    "identifier": "620823104185",
    "name": "YUKESH S",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "yukesh1825@gmail.com",
    "contact": "+91 8220385712",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 428,
      "percentage": 82,
      "safeLeavesRemaining": 2,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104301": {
    "identifier": "620823104301",
    "name": "AJITHKUMAR M",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "ajithrrk25@gmail.com",
    "contact": "+91 6369317787",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 429,
      "percentage": 82.8,
      "safeLeavesRemaining": 3,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104302": {
    "identifier": "620823104302",
    "name": "KOPALA HARIKA",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "kharika0606@gmail.com",
    "contact": "+91 8186963882",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 430,
      "percentage": 83.6,
      "safeLeavesRemaining": 4,
      "status": "Eligible (Good Standing)"
    }
  },
  "620823104303": {
    "identifier": "620823104303",
    "name": "THANIYA S",
    "role": "STUDENT",
    "section": "CSE-C",
    "dept": "Computer Science & Engineering",
    "year": "IV Year B.E.",
    "email": "thaniya1009son@gmail.com",
    "contact": "+91 8610326637",
    "advisor": "Mrs. Rajavathi Jayapriya (CSE-C)",
    "bio": "Undergraduate student in Computer Science & Engineering at Gnanamani College of Technology.",
    "attendance": {
      "totalHours": 480,
      "attendedHours": 431,
      "percentage": 84.4,
      "safeLeavesRemaining": 5,
      "status": "Eligible (Good Standing)"
    }
  }
},

      // OD Requests
      odRequests: [
        {
          id: "EPOCH-OD-2026-001",
          regNo: "620823104002",
          studentName: "Abinaya G",
          dept: "CSE",
          section: "CSE-A",
          odType: "Technical Symposium / Conference",
          reason: "Presented research paper titled 'Agentic Workflows in Automated Education Systems' at National Technical Summit.",
          venue: "PSG College of Technology, Coimbatore",
          startDate: "2026-03-12",
          endDate: "2026-03-13",
          numberOfDays: 2,
          status: "APPROVED",
          currentStage: "COMPLETED",
          submittedAt: "10 Mar 2026, 10:30 AM",
          verificationCode: "GCT-OD-VERIFIED-782914",
          advisorDecision: {
            status: "APPROVED",
            by: "Mrs. P. Arularasi (CSE-A)",
            timestamp: "10 Mar 2026, 02:15 PM",
            notes: "Verified symposium schedule and registration ticket."
          },
          hodDecision: {
            status: "APPROVED",
            by: "Dr. K. Gopinath (HOD-CSE)",
            timestamp: "11 Mar 2026, 11:00 AM",
            notes: "Endorsed and officially sanctioned for technical participation."
          }
        },
        {
          id: "EPOCH-BNF-2026-001",
          regNo: "620823104002",
          studentName: "Abinaya G",
          dept: "CSE",
          section: "CSE-A",
          odType: "Bonafide Certificate",
          reason: "Passport Application & Verification",
          venue: "Gnanamani College of Technology",
          startDate: "2026-03-01",
          endDate: "2026-03-01",
          numberOfDays: 1,
          status: "APPROVED",
          currentStage: "COMPLETED",
          requiresPrincipalApproval: true,
          submittedAt: "01 Mar 2026, 10:15 AM",
          advisorDecision: {
            status: "APPROVED",
            by: "Mrs. P. Arularasi (CSE-A)",
            timestamp: "01 Mar 2026, 01:30 PM",
            notes: "Academic standing verified. Forwarded to HOD."
          },
          hodDecision: {
            status: "APPROVED",
            by: "Dr. K. Gopinath (HOD-CSE)",
            timestamp: "02 Mar 2026, 10:45 AM",
            notes: "Department endorsement granted. Forwarded to Principal."
          },
          principalDecision: {
            status: "APPROVED",
            by: "Dr. B. Sanjay Gandhi (Principal)",
            timestamp: "02 Mar 2026, 04:30 PM",
            notes: "Official Bonafide Certificate granted and issued."
          }
        },
        {
          id: "EPOCH-OD-2026-002",
          regNo: "620823104002",
          studentName: "Abinaya G",
          dept: "CSE",
          section: "CSE-A",
          odType: "Placement Drive / Interview",
          reason: "Attending final round technical interview at Zoho Corporation campus.",
          venue: "Zoho Corporation, Estancia IT Park, Chennai",
          startDate: "2026-03-24",
          endDate: "2026-03-25",
          numberOfDays: 2,
          status: "PENDING_HOD",
          currentStage: "HOD",
          assignedReviewerId: "gopinath",
          assignedReviewerName: "Dr. K. Gopinath",
          assignedReviewerRole: "HOD",
          submittedAt: "18 Mar 2026, 09:15 AM",
          lastUpdatedAt: "18 Mar 2026, 11:30 AM",
          advisorDecision: {
            status: "APPROVED",
            by: "Mrs. P. Arularasi (CSE-A)",
            timestamp: "18 Mar 2026, 11:30 AM",
            notes: "Shortlist confirmed with placement cell."
          },
          workflowTimeline: [
            {
              stage: "SUBMITTED",
              actorId: "620823104002",
              actorName: "Abinaya G",
              actorRole: "STUDENT",
              decision: "SUBMITTED",
              remarks: "Attending final round technical interview at Zoho Corporation campus.",
              timestamp: "18 Mar 2026, 09:15 AM"
            },
            {
              stage: "ADVISOR_APPROVAL",
              actorId: "arularasi",
              actorName: "Mrs. P. Arularasi",
              actorRole: "CLASS_ADVISOR",
              decision: "APPROVED",
              remarks: "Shortlist confirmed with placement cell.",
              timestamp: "18 Mar 2026, 11:30 AM"
            }
          ]
        },
        {
          id: "EPOCH-OD-2026-003",
          regNo: "620823104015",
          studentName: "Dharun Kumar R",
          dept: "CSE",
          section: "CSE-A",
          odType: "Sports / Cultural Event",
          reason: "Anna University Zonal Badminton Tournament selection match.",
          venue: "KSR Educational Institutions, Tiruchengode",
          startDate: "2026-03-28",
          endDate: "2026-03-28",
          numberOfDays: 1,
          status: "PENDING_ADVISOR",
          currentStage: "ADVISOR",
          submittedAt: "19 Mar 2026, 02:40 PM"
        },
        {
          id: "EPOCH-OD-2026-004",
          regNo: "620823104042",
          studentName: "Kavya S",
          dept: "CSE",
          section: "CSE-B",
          odType: "Technical Symposium / Conference",
          reason: "Smart India Hackathon Zonal round hackathon attendance.",
          venue: "BIT, Sathyamangalam",
          startDate: "2026-03-30",
          endDate: "2026-03-31",
          numberOfDays: 2,
          status: "PENDING_ADVISOR",
          currentStage: "ADVISOR",
          submittedAt: "19 Mar 2026, 04:00 PM"
        }
      ],

      // Leave Requests
      leaveRequests: [
        {
          id: "EPOCH-LV-2026-101",
          regNo: "620823104002",
          studentName: "Abinaya G",
          section: "CSE-A",
          leaveType: "Medical / Sick Leave",
          startDate: "2026-02-14",
          endDate: "2026-02-15",
          numberOfDays: 2,
          reason: "Viral fever - Medical certificate submitted to department office.",
          status: "APPROVED",
          advisorDecision: {
            status: "APPROVED",
            by: "Mrs. P. Arularasi",
            timestamp: "16 Feb 2026, 09:30 AM"
          },
          submittedAt: "13 Feb 2026, 08:00 PM"
        }
      ],

      // Bonafide Requests
      bonafideRequests: [
        {
          id: "EPOCH-BNF-2026-201",
          regNo: "620823104002",
          studentName: "Abinaya G",
          section: "CSE-A",
          purpose: "Passport Application",
          academicYear: "2025-2026",
          details: "Required for tatkal passport appointment at PSK Coimbatore.",
          status: "APPROVED",
          certificateNumber: "GCT/CSE/BNF/2026/044",
          submittedAt: "01 Mar 2026, 11:20 AM",
          completedAt: "03 Mar 2026, 03:15 PM"
        }
      ],

      // Complaints (Direct to Principal Dr. B. Sanjay Gandhi exclusively)
      complaints: [
        {
          id: "EPOCH-CMP-2026-01",

          regNo: "620823104002",
          studentName: "Abinaya G",
          section: "CSE-A",
          category: "Infrastructure / Facilities",
          subject: "Extended Central Library access during upcoming University Exam period",
          description: "Requesting reading hall operating hours to be extended until 9:00 PM for day scholars and hostellers during April model exams.",
          supportingInfo: "Central Library 2nd Floor reading section",
          status: "RESOLVED",
          submittedAt: "05 Mar 2026, 04:12 PM",
          principalResponse: "Approved. Central Library reading wing will operate up to 9:00 PM starting next Monday with staff supervision.",
          resolvedAt: "07 Mar 2026, 11:30 AM"
        },
        {
          id: "EPOCH-CMP-2026-02",
          regNo: "620823104002",
          studentName: "Abinaya G",
          section: "CSE-A",
          category: "Academic",
          subject: "High-performance GPU cluster access for Final Year Deep Learning projects",
          description: "Requesting scheduled slot allocation in Lab 3 GPU workstations for our project team.",
          supportingInfo: "CSE Systems Lab 3, Workstations 12-16",
          status: "UNDER_REVIEW",
          submittedAt: "18 Mar 2026, 02:45 PM",
          principalResponse: "Discussed with HoD CSE. Timetable coordinator is preparing afternoon project batch slots."
        }
      ],

      // Advisor Attendance Alerts
      attendanceShortageList: [
        { regNo: "620823104018", name: "Gokulraj P", section: "CSE-A", attendance: 71.4, shortage: "3.6% deficit", phone: "+91 97890 12345" },
        { regNo: "620823104029", name: "Kishore Kumar M", section: "CSE-A", attendance: 69.2, shortage: "5.8% deficit", phone: "+91 98421 67890" }
      ],

      // Notifications
      notifications: [
        {
          id: "NOTIF-1",
          targetRole: "STUDENT",
          targetId: "620823104002",
          title: "OD Application Approved",
          message: "Your OD request (EPOCH-OD-2026-001) for PSG Tech Symposium has received final approval. Official certificate is available.",
          timestamp: "11 Mar 2026, 04:46 PM",
          type: "OD_APPROVED",
          unread: false
        },
        {
          id: "NOTIF-2",
          targetRole: "PRINCIPAL",
          targetId: "bsanjaygandhi",
          title: "New Student Complaint Received",
          message: "A confidential student complaint regarding 'GPU cluster access' was submitted directly by Abinaya G (CSE-A).",
          timestamp: "18 Mar 2026, 02:46 PM",
          type: "COMPLAINT_NEW",
          unread: true
        },
        {
          id: "NOTIF-3",
          targetRole: "ADVISOR",
          targetId: "arularasi",
          title: "New OD Submission",
          message: "Student Dharun Kumar R (CSE-A) submitted an OD application for Zonal Badminton Tournament.",
          timestamp: "19 Mar 2026, 02:41 PM",
          type: "OD_NEW",
          unread: true
        }
      ],

      // Fee Assignments
      feeAssignments: [
        {
          id: "FEE-2026-001",
          studentId: "620823104002",
          studentName: "Abinaya G",
          department: "Computer Science & Engineering",
          academicYear: "IV Year B.E.",
          section: "CSE-A",
          category: "Tuition Fee",
          description: "Even Semester Tuition Fee 2026",
          totalAmount: 45000,
          amountPaid: 0,
          balance: 45000,
          assignmentDate: "20 Oct 2026",
          dueDate: "15 Nov 2026",
          installmentPlan: "Full or 2 Installments",
          status: "UNPAID",
          paymentInstructions: "Scan the official merchant UPI QR code and enter the 12-digit UPI UTR number.",
          createdBy: "Dr. S. K. Ramesh (Admin Officer)",
          createdAt: 1729400000000,
          updatedAt: 1729400000000,
          auditHistory: [
            { action: "ASSIGNED", amount: 45000, changedBy: "Dr. S. K. Ramesh", timestamp: "20 Oct 2026, 10:00 AM", reason: "Standard semester tuition fee" }
          ]
        },
        {
          id: "FEE-2026-002",
          studentId: "620823104015",
          studentName: "Dharun Kumar R",
          department: "Computer Science & Engineering",
          academicYear: "IV Year B.E.",
          section: "CSE-A",
          category: "Examination Fee",
          description: "Autonomous End-Semester Examination Fee 2026",
          totalAmount: 3500,
          amountPaid: 0,
          balance: 3500,
          assignmentDate: "22 Oct 2026",
          dueDate: "10 Nov 2026",
          installmentPlan: "Single Payment",
          status: "UNPAID",
          paymentInstructions: "Pay through authorized UPI QR. Retain UTR reference for verification.",
          createdBy: "Dr. S. K. Ramesh (Admin Officer)",
          createdAt: 1729500000000,
          updatedAt: 1729500000000,
          auditHistory: [
            { action: "ASSIGNED", amount: 3500, changedBy: "Dr. S. K. Ramesh", timestamp: "22 Oct 2026, 11:30 AM", reason: "Autonomous examination fee" }
          ]
        },
        {
          id: "FEE-2026-003",
          studentId: "620823104066",
          studentName: "Jansi G",
          department: "Computer Science & Engineering",
          academicYear: "IV Year B.E.",
          section: "CSE-B",
          category: "Hostel & Mess Fee",
          description: "Semester Hostel Accommodation & Mess Charges",
          totalAmount: 38000,
          amountPaid: 20000,
          balance: 18000,
          assignmentDate: "15 Oct 2026",
          dueDate: "05 Nov 2026",
          installmentPlan: "Installment 1 Completed",
          status: "PARTIALLY_PAID",
          paymentInstructions: "Pay remaining balance before due date to avoid late fee charges.",
          createdBy: "Dr. S. K. Ramesh (Admin Officer)",
          createdAt: 1729200000000,
          updatedAt: 1729300000000,
          auditHistory: [
            { action: "ASSIGNED", amount: 38000, changedBy: "Dr. S. K. Ramesh", timestamp: "15 Oct 2026, 09:00 AM", reason: "Hostel fee" },
            { action: "PAYMENT_CONFIRMED", amount: 20000, utr: "429855667788", verifiedBy: "Dr. S. K. Ramesh", timestamp: "18 Oct 2026, 03:00 PM" }
          ]
        },
        {
          id: "FEE-2026-004",
          studentId: "620823104133",
          studentName: "Praveena B",
          department: "Computer Science & Engineering",
          academicYear: "IV Year B.E.",
          section: "CSE-C",
          category: "Tuition Fee",
          description: "Even Semester Tuition Fee 2026",
          totalAmount: 45000,
          amountPaid: 45000,
          balance: 0,
          assignmentDate: "10 Oct 2026",
          dueDate: "30 Oct 2026",
          installmentPlan: "Paid in Full",
          status: "PAID",
          paymentInstructions: "Payment completed and verified.",
          createdBy: "Dr. S. K. Ramesh (Admin Officer)",
          createdAt: 1729000000000,
          updatedAt: 1729100000000,
          auditHistory: [
            { action: "ASSIGNED", amount: 45000, changedBy: "Dr. S. K. Ramesh", timestamp: "10 Oct 2026, 10:00 AM", reason: "Tuition fee" },
            { action: "PAYMENT_CONFIRMED", amount: 45000, utr: "429811223344", verifiedBy: "Dr. S. K. Ramesh", timestamp: "14 Oct 2026, 02:15 PM" }
          ]
        }
      ],

      // Fee Payments
      feePayments: [
        {
          id: "PAY-2026-001",
          feeAssignmentId: "FEE-2026-004",
          studentId: "620823104133",
          studentName: "Praveena B",
          department: "CSE",
          section: "CSE-C",
          category: "Tuition Fee",
          amount: 45000,
          utrNumber: "429811223344",
          status: "CONFIRMED",
          paymentDate: "14 Oct 2026, 02:00 PM",
          submittedAt: 1729090000000,
          verifiedBy: "Dr. S. K. Ramesh",
          verifiedAt: "14 Oct 2026, 02:15 PM",
          receiptId: "RCPT-2026-620823104133-101"
        },
        {
          id: "PAY-2026-002",
          feeAssignmentId: "FEE-2026-003",
          studentId: "620823104066",
          studentName: "Jansi G",
          department: "CSE",
          section: "CSE-B",
          category: "Hostel & Mess Fee",
          amount: 20000,
          utrNumber: "429855667788",
          status: "CONFIRMED",
          paymentDate: "18 Oct 2026, 02:45 PM",
          submittedAt: 1729290000000,
          verifiedBy: "Dr. S. K. Ramesh",
          verifiedAt: "18 Oct 2026, 03:00 PM",
          receiptId: "RCPT-2026-620823104066-102"
        }
      ],

      // Fee Receipts
      feeReceipts: [
        {
          id: "RCPT-2026-620823104133-101",
          paymentId: "PAY-2026-001",
          feeAssignmentId: "FEE-2026-004",
          studentId: "620823104133",
          studentName: "Praveena B",
          department: "Computer Science & Engineering",
          academicYear: "IV Year B.E.",
          section: "CSE-C",
          category: "Tuition Fee",
          description: "Even Semester Tuition Fee 2026",
          amountReceived: 45000,
          remainingBalance: 0,
          paymentMode: "UPI QR (Online)",
          utrNumber: "429811223344",
          paymentDate: "14 Oct 2026, 02:00 PM",
          verifiedDate: "14 Oct 2026, 02:15 PM",
          verifiedBy: "Dr. S. K. Ramesh (Accounts Directorate)",
          generatedAt: 1729090900000
        },
        {
          id: "RCPT-2026-620823104066-102",
          paymentId: "PAY-2026-002",
          feeAssignmentId: "FEE-2026-003",
          studentId: "620823104066",
          studentName: "Jansi G",
          department: "Computer Science & Engineering",
          academicYear: "IV Year B.E.",
          section: "CSE-B",
          category: "Hostel & Mess Fee",
          description: "Semester Hostel Accommodation & Mess Charges",
          amountReceived: 20000,
          remainingBalance: 18000,
          paymentMode: "UPI QR (Online)",
          utrNumber: "429855667788",
          paymentDate: "18 Oct 2026, 02:45 PM",
          verifiedDate: "18 Oct 2026, 03:00 PM",
          verifiedBy: "Dr. S. K. Ramesh (Accounts Directorate)",
          generatedAt: 1729291000000
        }
      ],

      // Fee Settings
      feeSettings: {
        merchantUpiId: "gnanamani.fees@sbi",
        merchantName: "Gnanamani College of Technology",
        contactEmail: "accounts@gct.ac.in",
        contactPhone: "+91 4286 293888",
        bankName: "State Bank of India (Namakkal Main Branch)",
        accountNumber: "39201948572",
        ifscCode: "SBIN0001234"
      },

      // Announcements
      announcements: [
        {
          id: "ANN-2026-001",
          title: "Autonomous End-Semester Examination Schedule - November 2026",
          message: "All undergraduate IV Year B.E. students are hereby notified that the Autonomous End-Semester Theory Examinations commence from 24th November 2026. Hall tickets will be issued only upon clearance of outstanding semester dues.",
          priority: "URGENT",
          targetAudience: "ALL",
          targetDept: "ALL",
          targetSection: "ALL",
          senderId: "bsanjaygandhi",
          senderName: "Dr. B. Sanjay Gandhi",
          senderRole: "PRINCIPAL",
          createdAt: "22 Oct 2026, 10:00 AM",
          createdAtMs: 1729580000000,
          readBy: []
        },
        {
          id: "ANN-2026-002",
          title: "Department Symposium TECHFEST-2026 Registration Open",
          message: "The Department of Computer Science & Engineering is organizing the National-Level Technical Symposium TECHFEST-2026. Students interested in organizing committees and paper presentations should contact faculty coordinators.",
          priority: "IMPORTANT",
          targetAudience: "STUDENT",
          targetDept: "CSE",
          targetSection: "ALL",
          senderId: "gopinath",
          senderName: "Dr. K. Gopinath",
          senderRole: "HOD",
          createdAt: "23 Oct 2026, 02:30 PM",
          createdAtMs: 1729680000000,
          readBy: []
        },
        {
          id: "ANN-2026-003",
          title: "Section CSE-A Model Practical Exam Timings",
          message: "CSE-A students are instructed to report to Distributed Systems Lab (Lab 3) by 09:00 AM sharp on Monday for model practical evaluation. Laboratory records must be duly signed.",
          priority: "NORMAL",
          targetAudience: "STUDENT",
          targetDept: "CSE",
          targetSection: "CSE-A",
          senderId: "arularasi",
          senderName: "Mrs. P. Arularasi",
          senderRole: "ADVISOR",
          createdAt: "24 Oct 2026, 09:15 AM",
          createdAtMs: 1729750000000,
          readBy: []
        }
      ]
    };
  },

  // Load state from localStorage or initialize with seed
  getState() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.users && Object.keys(parsed.users).filter(k => parsed.users[k].role === "STUDENT").length >= 170) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not read local demo state, resetting to seed:", e);
    }
    const seed = this.getSeedData();
    this.saveState(seed);
    return seed;
  },

  // Save current state
  saveState(state) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Could not write local demo state:", e);
    }
  },

  // Reset to default seed
  resetDemoData() {
    const seed = this.getSeedData();
    this.saveState(seed);
    return seed;
  },

  // Private demo credentials registry for simulation
  // PASSWORDS ARE NEVER STORED IN USER PROFILE RECORDS (Requirement 13)
  _demoCredentials: {
    student: {
      "620823104002": "student@12",
      "620823104015": "student@12",
      "620823104042": "student@12",
      "620823104066": "student@12",
      "620823104133": "student@12",
      "620823104018": "student@12"
    },
    advisor: {
      "arularasi": "advisor@123",
      "arularasi@gct.ac.in": "advisor@123",
      "advisor.demo@epoch.edu": "advisor@123",
      "divyabharathi": "advisor@123",
      "divyabharathi@gct.ac.in": "advisor@123",
      "dhivyabharathi": "advisor@123",
      "advisor.b.demo@epoch.edu": "advisor@123",
      "rajavathijayapriya": "advisor@123",
      "rajavathijayapriya@gct.ac.in": "advisor@123",
      "advisor.c.demo@epoch.edu": "advisor@123"
    },
    hod: {
      "gopinath": "hod@123",
      "gopinath@gct.ac.in": "hod@123",
      "hod.demo@epoch.edu": "hod@123"
    },
    principal: {
      "bsanjaygandhi": "principal@123",
      "principal@gct.ac.in": "principal@123",
      "principal.demo@epoch.edu": "principal@123"
    },
    admin: {
      "admin": "admin@123",
      "admin@gct.ac.in": "admin@123",
      "admin.demo@epoch.edu": "admin@123"
    }
  },

  // Validate credentials locally without Firebase or remote mutation
  validateCredentials(role, identifier, password) {
    const cleanRole = (role || "").trim().toLowerCase();
    const cleanId = (identifier || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();

    if (!cleanRole || !this._demoCredentials[cleanRole]) {
      return {
        valid: false,
        error: "Invalid academic role selection. Please choose a valid role."
      };
    }

    if (!cleanId) {
      const fieldName = cleanRole === "student" ? "registration number" : (cleanRole === "principal" ? "official email" : "staff ID or official email");
      return {
        valid: false,
        error: `Please enter your ${fieldName}.`
      };
    }

    if (!cleanPass) {
      return {
        valid: false,
        error: "Please enter your password."
      };
    }

    const creds = this._demoCredentials[cleanRole];
    const expectedPass = creds[cleanId];

    if (!expectedPass) {
      let roleLabel = "Student";
      let idHint = "registration number (e.g. 620823104002)";
      if (cleanRole === "advisor") {
        roleLabel = "Class Advisor";
        idHint = "staff ID (e.g. arularasi) or official email";
      } else if (cleanRole === "hod") {
        roleLabel = "Head of Department (HOD)";
        idHint = "staff ID (e.g. gopinath) or official email";
      } else if (cleanRole === "principal") {
        roleLabel = "Principal";
        idHint = "official email (e.g. principal@gct.ac.in)";
      }

      return {
        valid: false,
        error: `Account identifier '${identifier}' is not recognized for ${roleLabel}. Please check your credentials or see the fictional demo accounts below.`
      };
    }

    if (expectedPass !== cleanPass) {
      return {
        valid: false,
        error: "Incorrect password. Please verify your credentials."
      };
    }

    // Resolve user profile
    const state = this.getState();
    let profile = null;

    if (cleanRole === "student") {
      profile = state.users[cleanId];
    } else {
      profile = Object.values(state.users).find(u => 
        (u.identifier && u.identifier.toLowerCase() === cleanId) ||
        (u.email && u.email.toLowerCase() === cleanId)
      );
    }

    if (!profile) {
      return {
        valid: false,
        error: `User profile record for '${identifier}' not found. Please click 'Reset Demo Data' to re-initialize.`
      };
    }

    // Ensure password is NEVER attached to profile object
    const safeProfile = { ...profile };
    delete safeProfile.password;
    delete safeProfile.passwordHash;

    return {
      valid: true,
      user: safeProfile
    };
  },

  // Helper list for fictional demo testing box
  getDemoAccountsForRole(role) {
    const cleanRole = (role || "").trim().toLowerCase();
    if (cleanRole === "student") {
      // Student demo accounts listing completely removed from login interface
      return [];
    } else if (cleanRole === "advisor") {
      return [
        { id: "arularasi", email: "arularasi@gct.ac.in", name: "Mrs. P. Arularasi", meta: "Class Advisor CSE-A • Section Oversight", pass: "advisor@123" },
        { id: "divyabharathi", email: "divyabharathi@gct.ac.in", name: "Dr. Divyabharathi", meta: "Class Advisor CSE-B • Section Oversight", pass: "advisor@123" },
        { id: "rajavathijayapriya", email: "rajavathijayapriya@gct.ac.in", name: "Mrs. Rajavathi Jayapriya", meta: "Class Advisor CSE-C • Section Oversight", pass: "advisor@123" }
      ];
    } else if (cleanRole === "hod") {
      return [
        { id: "gopinath", email: "gopinath@gct.ac.in", name: "Dr. K. Gopinath", meta: "HOD Computer Science & Eng. • Department Endorsements", pass: "hod@123" }
      ];
    } else if (cleanRole === "principal") {
      return [
        { id: "principal@gct.ac.in", email: "principal@gct.ac.in", name: "Dr. B. Sanjay Gandhi", meta: "Principal (Autonomous) • Executive Grievance & Sanctions", pass: "principal@123" }
      ];
    } else if (cleanRole === "admin") {
      return [
        { id: "admin", email: "admin@gct.ac.in", name: "Dr. S. K. Ramesh (Admin Officer)", meta: "College Administrator • Fee & Accounts Directorate", pass: "admin@123" }
      ];
    }
    return [];
  },

  // Helper getters
  getUser(username) {
    const state = this.getState();
    return state.users[username] || null;
  },

  getUserProfile(identifier, role) {
    const state = this.getState();
    if (!state.users) return null;
    if (identifier && state.users[identifier]) {
      return state.users[identifier];
    }
    if (identifier) {
      const byEmail = Object.values(state.users).find(u => (u.email && u.email.toLowerCase() === identifier.toLowerCase()));
      if (byEmail) return byEmail;
    }
    return null;
  },

  getOdRequestsForStudent(regNo) {
    return (this.getState().odRequests || []).filter(r => r.regNo === regNo);
  },

  getLeaveRequestsForStudent(regNo) {
    return (this.getState().leaveRequests || []).filter(l => l.regNo === regNo);
  },

  getBonafideRequestsForStudent(regNo) {
    return (this.getState().bonafideRequests || []).filter(b => b.regNo === regNo);
  },

  getComplaintsForStudent(regNo) {
    return (this.getState().complaints || []).filter(c => c.regNo === regNo);
  },

  getOdRequestsForAdvisor(section) {
    return (this.getState().odRequests || []).filter(r => r.section === section);
  },

  getAttendanceShortageForSection(section) {
    return (this.getState().attendanceShortageList || []).filter(s => s.section === section);
  },

  getHistoryForUser(user) {
    if (!user) return [];
    const all = this.getState().odRequests || [];
    if (user.role === "STUDENT") {
      return all.filter(r => r.regNo === user.identifier);
    } else if (user.role === "ADVISOR") {
      return all.filter(r => r.section === (user.section || "CSE-A"));
    } else {
      return all;
    }
  },

  updateUserProfile(identifier, updatedFields) {
    const state = this.getState();
    if (!state.users) state.users = {};
    if (!state.users[identifier]) {
      state.users[identifier] = { identifier, ...updatedFields };
    } else {
      state.users[identifier] = { ...state.users[identifier], ...updatedFields };
    }
    this.saveState(state);
    return state.users[identifier];
  },

  getOdRequests() {
    return this.getState().odRequests || [];
  },

  getLeaveRequests() {
    return this.getState().leaveRequests || [];
  },

  getBonafideRequests() {
    return this.getState().bonafideRequests || [];
  },

  getComplaints() {
    return this.getState().complaints || [];
  },

  getNotifications(userId, role) {
    const state = this.getState();
    return (state.notifications || []).filter(n => {
      if (n.targetId && n.targetId === userId) return true;
      if (n.targetRole && n.targetRole === role) return true;
      return false;
    });
  },

  // Add OD Request
  addOdRequest(req) {
    const state = this.getState();
    const id = "EPOCH-OD-2026-" + Math.floor(100 + Math.random() * 900);
    const now = new Date();
    const timestamp = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ", " + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const advisorId = req.section === "CSE-A" ? "arularasi" : (req.section === "CSE-B" ? "divyabharathi" : "rajavathijayapriya");
    const advisorName = req.section === "CSE-A" ? "Mrs. P. Arularasi" : (req.section === "CSE-B" ? "Dr. Divyabharathi" : "Mrs. Rajavathi Jayapriya");

    const newReq = {
      ...req,
      id: id,
      status: "PENDING_ADVISOR",
      currentStage: "ADVISOR",
      assignedReviewerId: advisorId,
      assignedReviewerName: advisorName,
      assignedReviewerRole: "CLASS_ADVISOR",
      submittedAt: timestamp,
      lastUpdatedAt: timestamp,
      verificationCode: "GCT-OD-" + Math.floor(100000 + Math.random() * 900000),
      workflowTimeline: [
        {
          stage: "SUBMITTED",
          actorId: req.regNo,
          actorName: req.studentName,
          actorRole: "STUDENT",
          decision: "SUBMITTED",
          remarks: req.reason || "Application submitted for academic review.",
          timestamp: timestamp
        }
      ]
    };

    state.odRequests.unshift(newReq);

    // Push notification to section advisor
    state.notifications.unshift({
      id: "NOTIF-" + Date.now(),
      targetRole: "ADVISOR",
      targetId: advisorId,
      title: "New OD Application Received",
      message: `OD application (${id}) submitted by ${req.studentName} (${req.section}) for ${req.odType}.`,
      timestamp: timestamp,
      type: "OD_NEW",
      unread: true
    });

    this.saveState(state);
    return newReq;
  },

  // Add Leave Request
  addLeaveRequest(req) {
    const state = this.getState();
    const id = "EPOCH-LV-2026-" + Math.floor(100 + Math.random() * 900);
    const now = new Date();
    const timestamp = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ", " + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const advisorId = req.section === "CSE-A" ? "arularasi" : (req.section === "CSE-B" ? "divyabharathi" : "rajavathijayapriya");
    const advisorName = req.section === "CSE-A" ? "Mrs. P. Arularasi" : (req.section === "CSE-B" ? "Dr. Divyabharathi" : "Mrs. Rajavathi Jayapriya");

    const newReq = {
      ...req,
      id: id,
      odType: req.leaveType || "Leave Application",
      status: "PENDING_ADVISOR",
      currentStage: "ADVISOR",
      assignedReviewerId: advisorId,
      assignedReviewerName: advisorName,
      assignedReviewerRole: "CLASS_ADVISOR",
      requiresPrincipalApproval: false,
      submittedAt: timestamp,
      lastUpdatedAt: timestamp,
      workflowTimeline: [
        {
          stage: "SUBMITTED",
          actorId: req.regNo,
          actorName: req.studentName,
          actorRole: "STUDENT",
          decision: "SUBMITTED",
          remarks: req.reason || "Leave application submitted.",
          timestamp: timestamp
        }
      ]
    };

    if (!state.leaveRequests) state.leaveRequests = [];
    if (!state.odRequests) state.odRequests = [];
    state.leaveRequests.unshift(newReq);
    state.odRequests.unshift(newReq);

    // Notify Advisor
    state.notifications.unshift({
      id: "NOTIF-" + Date.now(),
      targetRole: "ADVISOR",
      targetId: advisorId,
      title: "New Leave Application Received",
      message: `Leave application (${id}) submitted by ${req.studentName} (${req.section}).`,
      timestamp: timestamp,
      type: "LEAVE_NEW",
      unread: true
    });

    this.saveState(state);
    return newReq;
  },

  // Add Bonafide Request
  addBonafideRequest(req) {
    const state = this.getState();
    const id = "EPOCH-BNF-2026-" + Math.floor(100 + Math.random() * 900);
    const now = new Date();
    const timestamp = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ", " + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const advisorId = req.section === "CSE-A" ? "arularasi" : (req.section === "CSE-B" ? "divyabharathi" : "rajavathijayapriya");
    const advisorName = req.section === "CSE-A" ? "Mrs. P. Arularasi" : (req.section === "CSE-B" ? "Dr. Divyabharathi" : "Mrs. Rajavathi Jayapriya");

    const newReq = {
      ...req,
      id: id,
      odType: "Bonafide Certificate",
      status: "PENDING_ADVISOR",
      currentStage: "ADVISOR",
      assignedReviewerId: advisorId,
      assignedReviewerName: advisorName,
      assignedReviewerRole: "CLASS_ADVISOR",
      requiresPrincipalApproval: true,
      submittedAt: timestamp,
      lastUpdatedAt: timestamp,
      workflowTimeline: [
        {
          stage: "SUBMITTED",
          actorId: req.regNo,
          actorName: req.studentName,
          actorRole: "STUDENT",
          decision: "SUBMITTED",
          remarks: req.purpose || req.details || "Bonafide Certificate request submitted.",
          timestamp: timestamp
        }
      ]
    };

    if (!state.bonafideRequests) state.bonafideRequests = [];
    if (!state.odRequests) state.odRequests = [];
    state.bonafideRequests.unshift(newReq);
    state.odRequests.unshift(newReq);

    // Notify Advisor
    state.notifications.unshift({
      id: "NOTIF-" + Date.now(),
      targetRole: "ADVISOR",
      targetId: advisorId,
      title: "New Bonafide Certificate Request",
      message: `Bonafide Certificate request (${id}) submitted by ${req.studentName} (${req.section}).`,
      timestamp: timestamp,
      type: "BONAFIDE_NEW",
      unread: true
    });

    this.saveState(state);
    return newReq;
  },

  // Add Student Complaint (Direct to Principal)
  addComplaint(cmp) {
    const state = this.getState();
    const id = "EPOCH-CMP-2026-" + Math.floor(10 + Math.random() * 90);
    const now = new Date();
    const timestamp = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ", " + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newCmp = {
      ...cmp,
      id: id,
      status: "SUBMITTED",
      submittedAt: timestamp,
      principalResponse: null
    };

    state.complaints.unshift(newCmp);

    // Direct Principal Notification
    state.notifications.unshift({
      id: "NOTIF-" + Date.now(),
      targetRole: "PRINCIPAL",
      targetId: "bsanjaygandhi",
      title: "Confidential Student Complaint Received",
      message: `A direct student complaint (${id}) was submitted by ${cmp.studentName} (${cmp.section}). Subject: ${cmp.subject}`,
      timestamp: timestamp,
      type: "COMPLAINT_NEW",
      unread: true
    });

    this.saveState(state);
    return newCmp;
  },

  // Advisor updates OD
  advisorReviewOd(odId, isApproved, notes = "") {
    const state = this.getState();
    const req = state.odRequests.find(r => r.id === odId);
    if (!req) return null;

    const now = new Date();
    const timestamp = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ", " + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    if (isApproved) {
      req.status = "PENDING_HOD";
      req.currentStage = "HOD";
      req.assignedReviewerId = "gopinath";
      req.assignedReviewerName = "Dr. K. Gopinath";
      req.assignedReviewerRole = "HOD";
      req.lastUpdatedAt = timestamp;
      req.advisorDecision = {
        status: "APPROVED",
        by: "Class Advisor",
        timestamp: timestamp,
        notes: notes || "Recommended for approval."
      };
      if (!req.workflowTimeline) req.workflowTimeline = [];
      req.workflowTimeline.push({
        stage: "ADVISOR_APPROVAL",
        actorId: "arularasi",
        actorName: "Mrs. P. Arularasi",
        actorRole: "CLASS_ADVISOR",
        decision: "APPROVED",
        remarks: notes || "Recommended for approval.",
        timestamp: timestamp
      });
      // Notify HOD
      state.notifications.unshift({
        id: "NOTIF-" + Date.now(),
        targetRole: "HOD",
        targetId: "gopinath",
        title: "OD Awaiting HOD Approval",
        message: `Request ${req.id} for ${req.studentName} has been verified and forwarded by Class Advisor.`,
        timestamp: timestamp,
        type: "OD_STAGE_ADVANCE",
        unread: true
      });
    } else {
      req.status = "REJECTED";
      req.currentStage = "TERMINATED";
      req.assignedReviewerId = null;
      req.assignedReviewerName = null;
      req.assignedReviewerRole = null;
      req.lastUpdatedAt = timestamp;
      req.rejectedBy = "Class Advisor";
      req.rejectionReason = notes || "Attendance or documentation incomplete.";
      if (!req.workflowTimeline) req.workflowTimeline = [];
      req.workflowTimeline.push({
        stage: "ADVISOR_REJECTION",
        actorId: "arularasi",
        actorName: "Mrs. P. Arularasi",
        actorRole: "CLASS_ADVISOR",
        decision: "REJECTED",
        remarks: req.rejectionReason,
        timestamp: timestamp
      });
      // Notify Student
      state.notifications.unshift({
        id: "NOTIF-" + Date.now(),
        targetRole: "STUDENT",
        targetId: req.regNo,
        title: "OD Application Halted by Advisor",
        message: `Your OD request ${req.id} was rejected by Class Advisor: ${req.rejectionReason}`,
        timestamp: timestamp,
        type: "OD_REJECTED",
        unread: true
      });
    }

    this.saveState(state);
    return req;
  },

  // HOD updates OD
  hodReviewOd(odId, isApproved, notes = "") {
    const state = this.getState();
    const req = state.odRequests.find(r => r.id === odId);
    if (!req) return null;

    const now = new Date();
    const timestamp = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ", " + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    if (isApproved) {
      // WORKFLOW RULES:
      // 1. Bonafide Certificate -> 3 Approval Stages (Advisor -> HOD -> Principal)
      // 2. All Other Requests (OD, Leave) -> 2 Approval Stages (Advisor -> HOD -> Approved). Principal is NOT involved!
      const isBonafide = (req.odType && req.odType.toLowerCase().includes("bonafide")) || (req.id && req.id.includes("BNF"));

      if (isBonafide) {
        req.status = "PENDING_PRINCIPAL";
        req.currentStage = "PRINCIPAL";
        req.assignedReviewerId = "bsanjaygandhi";
        req.assignedReviewerName = "Dr. B. Sanjay Gandhi";
        req.assignedReviewerRole = "PRINCIPAL";
        req.lastUpdatedAt = timestamp;
        req.requiresPrincipalApproval = true;
        req.hodDecision = {
          status: "APPROVED",
          by: "Dr. K. Gopinath (HOD-CSE)",
          timestamp: timestamp,
          notes: notes || "Endorsed and forwarded to Principal for final Bonafide approval."
        };
        if (!req.workflowTimeline) req.workflowTimeline = [];
        req.workflowTimeline.push({
          stage: "HOD_APPROVAL",
          actorId: "gopinath",
          actorName: "Dr. K. Gopinath",
          actorRole: "HOD",
          decision: "APPROVED",
          remarks: notes || "Endorsed and forwarded to Principal for final Bonafide approval.",
          timestamp: timestamp
        });
        // Notify Principal
        state.notifications.unshift({
          id: "NOTIF-" + Date.now(),
          targetRole: "PRINCIPAL",
          targetId: "bsanjaygandhi",
          title: "Bonafide Certificate Awaiting Principal Approval",
          message: `Bonafide Certificate request ${req.id} for ${req.studentName} forwarded by HOD CSE.`,
          timestamp: timestamp,
          type: "OD_PRINCIPAL_QUEUE",
          unread: true
        });
      } else {
        // All other requests (OD, Leave, etc.): HOD is the final approval authority!
        req.status = "APPROVED";
        req.currentStage = "COMPLETED";
        req.assignedReviewerId = null;
        req.assignedReviewerName = null;
        req.assignedReviewerRole = null;
        req.lastUpdatedAt = timestamp;
        req.requiresPrincipalApproval = false;
        req.hodDecision = {
          status: "APPROVED",
          by: "Dr. K. Gopinath (HOD-CSE)",
          timestamp: timestamp,
          notes: notes || "Approved at departmental level. Official sanction form finalized."
        };
        if (!req.workflowTimeline) req.workflowTimeline = [];
        req.workflowTimeline.push({
          stage: "HOD_FINAL_APPROVAL",
          actorId: "gopinath",
          actorName: "Dr. K. Gopinath",
          actorRole: "HOD",
          decision: "APPROVED",
          remarks: notes || "Approved at departmental level. Official sanction form finalized.",
          timestamp: timestamp
        });
        // Notify Student
        state.notifications.unshift({
          id: "NOTIF-" + Date.now(),
          targetRole: "STUDENT",
          targetId: req.regNo,
          title: `${req.odType || "Request"} Officially Approved`,
          message: `Your ${req.odType || "request"} ${req.id} has received final HOD approval. You may download your official form.`,
          timestamp: timestamp,
          type: "OD_APPROVED",
          unread: true
        });
      }
    } else {
      req.status = "REJECTED";
      req.currentStage = "TERMINATED";
      req.assignedReviewerId = null;
      req.assignedReviewerName = null;
      req.assignedReviewerRole = null;
      req.lastUpdatedAt = timestamp;
      req.rejectedBy = "HOD Dr. K. Gopinath";
      req.rejectionReason = notes || "Academic schedule conflict.";
      if (!req.workflowTimeline) req.workflowTimeline = [];
      req.workflowTimeline.push({
        stage: "HOD_REJECTION",
        actorId: "gopinath",
        actorName: "Dr. K. Gopinath",
        actorRole: "HOD",
        decision: "REJECTED",
        remarks: req.rejectionReason,
        timestamp: timestamp
      });
      // Notify Student
      state.notifications.unshift({
        id: "NOTIF-" + Date.now(),
        targetRole: "STUDENT",
        targetId: req.regNo,
        title: "OD Request Rejected by HOD",
        message: `Your OD request ${req.id} was rejected by HOD: ${req.rejectionReason}`,
        timestamp: timestamp,
        type: "OD_REJECTED",
        unread: true
      });
    }

    this.saveState(state);
    return req;
  },

  // Principal updates OD
  principalReviewOd(odId, isApproved, notes = "") {
    const state = this.getState();
    const req = state.odRequests.find(r => r.id === odId);
    if (!req) return null;

    const now = new Date();
    const timestamp = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ", " + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    if (isApproved) {
      req.status = "APPROVED";
      req.currentStage = "COMPLETED";
      req.assignedReviewerId = null;
      req.assignedReviewerName = null;
      req.assignedReviewerRole = null;
      req.lastUpdatedAt = timestamp;
      req.principalDecision = {
        status: "APPROVED",
        by: "Dr. B. Sanjay Gandhi (Principal)",
        timestamp: timestamp,
        notes: notes || "Institutional sanction granted."
      };
      if (!req.workflowTimeline) req.workflowTimeline = [];
      req.workflowTimeline.push({
        stage: "PRINCIPAL_APPROVAL",
        actorId: "bsanjaygandhi",
        actorName: "Dr. B. Sanjay Gandhi",
        actorRole: "PRINCIPAL",
        decision: "APPROVED",
        remarks: notes || "Institutional sanction granted.",
        timestamp: timestamp
      });
      // Notify Student
      state.notifications.unshift({
        id: "NOTIF-" + Date.now(),
        targetRole: "STUDENT",
        targetId: req.regNo,
        title: "Principal Approved Your OD",
        message: `Principal Dr. B. Sanjay Gandhi has granted sanction for OD ${req.id}. Download your stamped certificate.`,
        timestamp: timestamp,
        type: "OD_APPROVED",
        unread: true
      });
    } else {
      req.status = "REJECTED";
      req.currentStage = "TERMINATED";
      req.assignedReviewerId = null;
      req.assignedReviewerName = null;
      req.assignedReviewerRole = null;
      req.lastUpdatedAt = timestamp;
      req.rejectedBy = "Principal Dr. B. Sanjay Gandhi";
      req.rejectionReason = notes || "Institutional policy limits.";
      if (!req.workflowTimeline) req.workflowTimeline = [];
      req.workflowTimeline.push({
        stage: "PRINCIPAL_REJECTION",
        actorId: "bsanjaygandhi",
        actorName: "Dr. B. Sanjay Gandhi",
        actorRole: "PRINCIPAL",
        decision: "REJECTED",
        remarks: req.rejectionReason,
        timestamp: timestamp
      });
      state.notifications.unshift({
        id: "NOTIF-" + Date.now(),
        targetRole: "STUDENT",
        targetId: req.regNo,
        title: "OD Application Rejected by Principal",
        message: `Your OD request ${req.id} was rejected: ${req.rejectionReason}`,
        timestamp: timestamp,
        type: "OD_REJECTED",
        unread: true
      });
    }

    this.saveState(state);
    return req;
  },

  // Principal updates Complaint
  updateComplaint(cmpId, status, responseText) {
    const state = this.getState();
    const cmp = state.complaints.find(c => c.id === cmpId);
    if (!cmp) return null;

    const now = new Date();
    const timestamp = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ", " + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    cmp.status = status;
    cmp.principalResponse = responseText;
    if (status === "RESOLVED") {
      cmp.resolvedAt = timestamp;
    }

    // Notify Student directly
    state.notifications.unshift({
      id: "NOTIF-" + Date.now(),
      targetRole: "STUDENT",
      targetId: cmp.regNo,
      title: "Principal Updated Your Complaint Status",
      message: `Your complaint (${cmp.id}) status is now ${status}. Principal Response: "${responseText}"`,
      timestamp: timestamp,
      type: "COMPLAINT_UPDATE",
      unread: true
    });

    this.saveState(state);
    return cmp;
  },

  // Assistant Predefined Q&A
  queryAssistant(question) {
    const q = question.toLowerCase();

    if (q.includes("od") || q.includes("on-duty") || q.includes("apply") || q.includes("approval")) {
      return {
        answer: "To apply for an On-Duty (OD) permit: Click the 'Apply for OD' button on your dashboard. Fill out the category, dates, host institution, and event description. The approval chain flows through your 1. Class Advisor (Student's Section) ➔ 2. Head of Department (CSE) for final institutional approval. OD and Leave requests never route to the Principal. (Principal approval applies exclusively to Bonafide Certificates). Once approved, an official certificate with a verifiable QR code is generated.",
        category: "OD Process"
      };
    }

    if (q.includes("attendance") || q.includes("shortage") || q.includes("percentage") || q.includes("75")) {
      return {
        answer: "As per Anna University regulations, a minimum of 75% attendance is strictly mandatory to be eligible for end-semester examinations. Your live attendance gauge on the student dashboard displays your current percentage (85.8%) and safe leave headroom. Class Advisors receive automated alerts for students with attendance below 75%.",
        category: "Attendance Rules"
      };
    }

    if (q.includes("complaint") || q.includes("principal") || q.includes("confidential") || q.includes("privacy")) {
      return {
        answer: "The Student Complaint Channel connects directly and exclusively to Principal Dr. B. Sanjay Gandhi. Class Advisors and Department HODs cannot view your complaints. All submissions remain strictly confidential, and the Principal provides formal status updates and responses directly to your portal.",
        category: "Confidentiality"
      };
    }

    if (q.includes("bonafide") || q.includes("certificate") || q.includes("passport") || q.includes("loan")) {
      return {
        answer: "Bonafide Certificates can be requested directly from the student dashboard for Passport Applications, Bank Education Loans, Scholarships, or Internship verification. Processing typically takes 1 to 2 business days and can be tracked in your portal.",
        category: "Bonafide Certificates"
      };
    }

    if (q.includes("leave") || q.includes("medical") || q.includes("sick")) {
      return {
        answer: "For planned leaves or medical emergencies, submit the Leave Application form on your dashboard. For medical leave exceeding 2 days, a valid doctor's prescription or fitness certificate must be produced upon return to your Class Advisor.",
        category: "Leave Policy"
      };
    }

    return {
      answer: "EPOCH Student Assistant is here to help with Academic OD procedures, Leave regulations, Bonafide requests, and Principal grievances. Please select one of the suggested topics or contact your Class Advisor for specific guidance.",
      category: "General Information"
    };
  },

  // ==================== Fee Management (Demo Mode) ====================
  getFeeAssignments(studentId) {
    const state = this.getState();
    return (state.feeAssignments || []).filter(fa => !studentId || fa.studentId === studentId);
  },

  getFeeAssignmentsForStudent(studentId) {
    return this.getFeeAssignments(studentId);
  },

  getAllFeeAssignments(section, category, status) {
    const state = this.getState();
    let items = state.feeAssignments || [];
    if (section && section !== "ALL") {
      items = items.filter(fa => fa.section && fa.section.toLowerCase() === section.toLowerCase());
    }
    if (category && category !== "ALL") {
      items = items.filter(fa => fa.category && fa.category.toLowerCase() === category.toLowerCase());
    }
    if (status && status !== "ALL") {
      items = items.filter(fa => fa.status && fa.status.toLowerCase() === status.toLowerCase());
    }
    return items;
  },

  getSectionStudentsWithFees(section) {
    const state = this.getState();
    const students = Object.values(state.users || {}).filter(u => u.role === "STUDENT" && (!section || section === "ALL" || (u.section && u.section.toLowerCase() === section.toLowerCase())));
    const assignments = state.feeAssignments || [];
    const payments = state.feePayments || [];
    const receipts = state.feeReceipts || [];

    return students.map(st => {
      const sId = st.identifier;
      const sAssignments = assignments.filter(a => a.studentId === sId);
      const sPayments = payments.filter(p => p.studentId === sId);
      const sReceipts = receipts.filter(r => r.studentId === sId);

      let totalAssigned = 0;
      let totalPaid = 0;
      let balance = 0;
      let nearestDueDate = "-";
      let hasPending = false;
      const categories = [];

      sAssignments.forEach(fa => {
        totalAssigned += (fa.totalAmount || 0);
        totalPaid += (fa.amountPaid || 0);
        balance += (fa.balance || 0);
        if (fa.category && !categories.includes(fa.category)) categories.push(fa.category);
        if (fa.balance > 0 && fa.dueDate) {
          if (nearestDueDate === "-" || fa.dueDate < nearestDueDate) nearestDueDate = fa.dueDate;
        }
        if (fa.status === "PENDING_VERIFICATION") hasPending = true;
      });

      sPayments.forEach(p => {
        if (p.status === "PENDING_VERIFICATION") hasPending = true;
      });

      let status = "NO_FEES";
      if (sAssignments.length > 0) {
        if (hasPending) status = "PENDING_VERIFICATION";
        else if (balance <= 0.01 && totalPaid > 0) status = "PAID";
        else if (totalPaid > 0) status = "PARTIALLY_PAID";
        else status = "UNPAID";
      }

      let lastPaymentDate = "-";
      sPayments.forEach(p => {
        if (p.paymentDate) lastPaymentDate = p.paymentDate;
      });

      let advisorName = "Mrs. P. Arularasi";
      const studentSec = (st.section || section || "CSE-A").toUpperCase();
      if (studentSec === "CSE-B") advisorName = "Dr. Divyabharathi";
      else if (studentSec === "CSE-C") advisorName = "Mrs. Rajavathi Jayapriya";

      return {
        studentId: sId,
        studentName: st.name,
        department: st.dept || "Computer Science & Engineering",
        section: st.section || section || "CSE-A",
        academicYear: st.year || "IV Year B.E.",
        advisorName,
        email: st.email || "",
        totalAssigned,
        amountPaid: totalPaid,
        balance,
        dueDate: nearestDueDate,
        status,
        lastPaymentDate,
        categories,
        categorySummary: categories.join(", "),
        feeAssignments: sAssignments,
        receiptCount: sReceipts.length,
        receipts: sReceipts
      };
    }).sort((a, b) => a.studentId.localeCompare(b.studentId));
  },

  getAdminDashboardSummary() {
    const state = this.getState();
    const students = Object.values(state.users || {}).filter(u => u.role === "STUDENT");
    let cseACount = students.filter(u => (u.section || "").toUpperCase() === "CSE-A").length;
    let cseBCount = students.filter(u => (u.section || "").toUpperCase() === "CSE-B").length;
    let cseCCount = students.filter(u => (u.section || "").toUpperCase() === "CSE-C").length;
    let totalStudents = students.length;

    // Use authoritative institutional numbers if in mock demo state
    if (totalStudents < 100) {
      cseACount = 61;
      cseBCount = 62;
      cseCCount = 52;
      totalStudents = 175;
    }

    const assignments = state.feeAssignments || [];
    let totalAssigned = 0;
    let totalPaid = 0;
    let totalBalance = 0;
    assignments.forEach(a => {
      totalAssigned += (a.totalAmount || 0);
      totalPaid += (a.amountPaid || 0);
      totalBalance += (a.balance || 0);
    });

    const pendingPaymentsCount = (state.feePayments || []).filter(p => p.status === "PENDING_VERIFICATION").length;

    return {
      totalStudents,
      cseACount,
      cseBCount,
      cseCCount,
      advisorCSE_A: "Mrs. P. Arularasi",
      advisorCSE_B: "Dr. Divyabharathi",
      advisorCSE_C: "Mrs. Rajavathi Jayapriya",
      totalAssigned,
      totalConfirmedPayments: totalPaid,
      totalOutstandingBalance: totalBalance,
      pendingPaymentsCount
    };
  },

  saveFeeAssignment(assignment) {
    const state = this.getState();
    if (!state.feeAssignments) state.feeAssignments = [];
    const idx = state.feeAssignments.findIndex(fa => fa.id === assignment.id);
    if (idx >= 0) {
      state.feeAssignments[idx] = assignment;
    } else {
      state.feeAssignments.unshift(assignment);
    }
    this.saveState(state);
    return assignment;
  },

  getFeePayments(studentId) {
    const state = this.getState();
    return (state.feePayments || []).filter(fp => !studentId || fp.studentId === studentId);
  },

  getFeePaymentsForStudent(studentId) {
    return this.getFeePayments(studentId);
  },

  getPendingFeePayments() {
    const state = this.getState();
    return (state.feePayments || []).filter(fp => fp.status === "PENDING_VERIFICATION");
  },

  submitFeePayment(payment) {
    const state = this.getState();
    if (!state.feePayments) state.feePayments = [];
    state.feePayments.unshift(payment);

    // Update assignment status
    if (state.feeAssignments) {
      const fa = state.feeAssignments.find(a => a.id === payment.feeAssignmentId);
      if (fa) {
        fa.status = "PENDING_VERIFICATION";
      }
    }
    this.saveState(state);
    return payment;
  },

  verifyFeePayment(paymentId, verifiedBy = "Dr. S. K. Ramesh (Accounts Directorate)") {
    const state = this.getState();
    const payment = (state.feePayments || []).find(p => p.id === paymentId);
    if (!payment) return null;

    payment.status = "CONFIRMED";
    payment.verifiedBy = verifiedBy;
    payment.verifiedAt = new Date().toLocaleString();

    let receipt = null;
    const fa = (state.feeAssignments || []).find(a => a.id === payment.feeAssignmentId);
    if (fa) {
      fa.amountPaid = (fa.amountPaid || 0) + payment.amount;
      fa.balance = Math.max(0, fa.totalAmount - fa.amountPaid);
      fa.status = (fa.balance <= 0.01) ? "PAID" : "PARTIALLY_PAID";

      const rId = "RCPT-" + new Date().getFullYear() + "-" + payment.studentId + "-" + Math.floor(100 + Math.random() * 900);
      receipt = {
        id: rId,
        paymentId: payment.id,
        feeAssignmentId: fa.id,
        studentId: payment.studentId,
        studentName: payment.studentName,
        department: payment.department || "Computer Science & Engineering",
        academicYear: fa.academicYear || "IV Year B.E.",
        section: payment.section || "CSE-A",
        category: payment.category,
        description: fa.description,
        amountReceived: payment.amount,
        remainingBalance: fa.balance,
        paymentMode: "UPI QR (Online)",
        utrNumber: payment.utrNumber,
        paymentDate: payment.paymentDate,
        verifiedDate: payment.verifiedAt,
        verifiedBy: verifiedBy,
        generatedAt: Date.now()
      };

      payment.receiptId = rId;
      if (!state.feeReceipts) state.feeReceipts = [];
      state.feeReceipts.unshift(receipt);

      // In-app notification delivery to student and assigned Class Advisor
      if (!state.notifications) state.notifications = [];
      state.notifications.unshift({
        id: "NOTIF-" + Date.now() + "-1",
        recipientId: payment.studentId,
        title: "Payment Confirmed: ₹" + payment.amount,
        message: "Your payment for " + payment.category + " (UTR: " + payment.utrNumber + ") is verified. Receipt " + rId + " is now available for download.",
        type: "PAYMENT_CONFIRMED",
        referenceId: rId,
        read: false,
        createdAt: new Date().toISOString()
      });

      const advMapping = { "CSE-A": "arularasi", "CSE-B": "divyabharathi", "CSE-C": "rajavathijayapriya" };
      const advId = advMapping[payment.section || "CSE-A"] || "arularasi";
      const advNotice = {
        id: "NOTIF-" + Date.now() + "-2",
        recipientId: advId,
        title: "Official Receipt: " + payment.studentName + " (" + (payment.section || 'CSE-A') + ")",
        message: "Verified fee receipt issued for " + payment.studentName + " (" + payment.studentId + ", " + (payment.section || 'CSE-A') + "). Amount received: ₹" + payment.amount + " for " + payment.category + " (UTR: " + payment.utrNumber + "). Confirmation Date: " + receipt.verifiedDate + ". Receipt ID: " + rId + ".",
        type: "ADVISOR_RECEIPT_DELIVERY",
        referenceId: rId,
        read: false,
        createdAt: new Date().toISOString()
      };
      state.notifications.unshift(advNotice);
      if (advId === "divyabharathi") {
        state.notifications.unshift({ ...advNotice, id: "NOTIF-" + Date.now() + "-3", recipientId: "dhivyabharathi" });
      }
    }

    this.saveState(state);
    return receipt;
  },

  rejectFeePayment(paymentId, reason, rejectedBy = "Dr. S. K. Ramesh") {
    const state = this.getState();
    const payment = (state.feePayments || []).find(p => p.id === paymentId);
    if (!payment) return null;

    payment.status = "REJECTED";
    payment.rejectionReason = reason;
    payment.verifiedBy = rejectedBy;
    payment.verifiedAt = new Date().toLocaleString();

    const fa = (state.feeAssignments || []).find(a => a.id === payment.feeAssignmentId);
    if (fa) {
      fa.status = (fa.amountPaid > 0) ? "PARTIALLY_PAID" : "UNPAID";
    }

    this.saveState(state);
    return payment;
  },

  getFeeReceipts(studentId) {
    const state = this.getState();
    return (state.feeReceipts || []).filter(fr => !studentId || fr.studentId === studentId);
  },

  getFeeReceiptsForStudent(studentId) {
    return this.getFeeReceipts(studentId);
  },

  getFeeReceipt(receiptId) {
    const state = this.getState();
    return (state.feeReceipts || []).find(fr => fr.id === receiptId) || null;
  },

  getFeeSettings() {
    const state = this.getState();
    return state.feeSettings || {
      merchantUpiId: "gnanamani.fees@sbi",
      merchantName: "Gnanamani College of Technology",
      contactEmail: "accounts@gct.ac.in",
      contactPhone: "+91 4286 293888",
      bankName: "State Bank of India (Namakkal Main Branch)",
      accountNumber: "39201948572",
      ifscCode: "SBIN0001234"
    };
  },

  updateFeeSettings(settings) {
    const state = this.getState();
    state.feeSettings = { ...state.feeSettings, ...settings };
    this.saveState(state);
    return state.feeSettings;
  },

  // ==================== Announcements (Demo Mode) ====================
  getAnnouncements(user) {
    const state = this.getState();
    const all = state.announcements || [];
    if (!user) return all;

    if (user.role === "ADMIN" || user.role === "PRINCIPAL") return all;

    return all.filter(a => {
      if (a.senderId === user.identifier) return true;
      if (a.targetAudience !== "ALL" && a.targetAudience !== user.role) return false;
      if (a.targetDept !== "ALL" && a.targetDept !== user.department) return false;
      if (a.targetSection !== "ALL" && a.targetSection !== user.section) return false;
      if (a.targetStudentId && a.targetStudentId !== user.identifier) return false;
      return true;
    });
  },

  saveAnnouncement(announcement) {
    const state = this.getState();
    if (!state.announcements) state.announcements = [];
    state.announcements.unshift(announcement);
    this.saveState(state);
    return announcement;
  },

  deleteAnnouncement(announcementId) {
    const state = this.getState();
    state.announcements = (state.announcements || []).filter(a => a.id !== announcementId);
    this.saveState(state);
  }
};

if (typeof window !== "undefined") {
  window.DemoStore = DemoStore;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = DemoStore;
}
