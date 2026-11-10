package com.epoch.epoch_backend.service;

import com.epoch.epoch_backend.model.UserProfile;
import com.epoch.epoch_backend.model.UserRole;
import java.util.*;

public class InstitutionalRoster {

    private static final Map<String, UserProfile> ROSTER_BY_ID = new LinkedHashMap<>();
    private static final Map<String, List<UserProfile>> ROSTER_BY_SECTION = new LinkedHashMap<>();

    static {
        ROSTER_BY_SECTION.put("CSE-A", new ArrayList<>());
        ROSTER_BY_SECTION.put("CSE-B", new ArrayList<>());
        ROSTER_BY_SECTION.put("CSE-C", new ArrayList<>());

        addStudent("620823104002", "ABINAYA G", "abinayagopi3052006@gmail.com", "9487784237", "CSE-A");
        addStudent("620823104003", "ABINAYA P", "aabikutty827@gmail.com", "9363623761", "CSE-A");
        addStudent("620823104004", "ABINAYA S", "abinayasureshkumar04@gmail.com", "9944484347", "CSE-A");
        addStudent("620823104005", "ABIRAMI P", "abirami3@gmail.com", "8675384915", "CSE-A");
        addStudent("620823104007", "ADONIYA N P", "npadoniya@gmail.com", "8667541092", "CSE-A");
        addStudent("620823104008", "AJINA S", "ajinasaids@gmail.com", "9344417778", "CSE-A");
        addStudent("620823104009", "AKASH V", "avs629372@gmail.com", "6374876743", "CSE-A");
        addStudent("620823104010", "AMARNATH R", "amar14052005@gmail.com", "9842097353", "CSE-A");
        addStudent("620823104011", "AMIT KUMAR", "amitsiwan5038@gmail.com", "8207854340", "CSE-A");
        addStudent("620823104012", "ANKIT KUMAR", "ankit43751@gmail.com", "9113457529", "CSE-A");
        addStudent("620823104013", "ANUSIYA D", "anusanusiya300@gmail.com", "8883171137", "CSE-A");
        addStudent("620823104014", "ARIYA K", "kandhasamyariya480@gmail.com", "9585325221", "CSE-A");
        addStudent("620823104015", "ARUNACHALAM M", "arun2005ar@gmail.com", "8489375273", "CSE-A");
        addStudent("620823104017", "AVANTHIKA V", "dd9871116@gmail.com", "8903743433", "CSE-A");
        addStudent("620823104018", "AVULA KISHORE", "kishorchinna03@eamil.com", "8897511258", "CSE-A");
        addStudent("620823104019", "BALACHANDAR M", "chandarb401@gmail.com", "9786865403", "CSE-A");
        addStudent("620823104020", "BALAMURUGAN C", "ranibalam853@gmail.com", "9787286154", "CSE-A");
        addStudent("620823104021", "BALAMURUGAN P", "balap20055@gmail.com", "9486661885", "CSE-A");
        addStudent("620823104022", "BALASUBRAMANI M", "balasubramanikantha@gmail.com", "9003846098", "CSE-A");
        addStudent("620823104023", "BHARANIDHARAN S", "bharanid292@gmail.com", "6383223099", "CSE-A");
        addStudent("620823104024", "BHAVADHARSHANA U", "sanjeevsamsung4312@gmail.com", "9994734312", "CSE-A");
        addStudent("620823104025", "CHEREDDY UDAY", "udaygaming743@gmail.com", "8096369184", "CSE-A");
        addStudent("620823104026", "CHEREDDY UPENDRA", "upendrareddy1017@gmali.com", "8096369184", "CSE-A");
        addStudent("620823104027", "CHILAKALA SRIHARI REDDY", "Chilakalasrihari7@gmail.com", "7993145603", "CSE-A");
        addStudent("620823104028", "DEEPA S", "durgadeepa67@gmail.com", "8056984090", "CSE-A");
        addStudent("620823104029", "DEEPAN M A", "deepandeepan67037@gmail.com", "9789119789", "CSE-A");
        addStudent("620823104030", "DEEPIKA T", "t.deepika28032006@gmail.com", "9095389053", "CSE-A");
        addStudent("620823104031", "DEVA P", "devapalanisamy2005@gmail.com", "8300137703", "CSE-A");
        addStudent("620823104032", "DEVADHARSHINI S", "kalaidevaa9@gmail.com", "9677750715", "CSE-A");
        addStudent("620823104033", "DEVARAJ KAMARAJ", "devakd2603@gmail.com", "9095679603", "CSE-A");
        addStudent("620823104034", "DEVISRI A", "arivalazhandevisri@gmail.com", "8124187047", "CSE-A");
        addStudent("620823104035", "DHANUSHIYA M", "dhanushiya132@gmail.com", "8825530890", "CSE-A");
        addStudent("620823104036", "DHARSHINI K", "kumardharshini498@gmail.com", "9487506558", "CSE-A");
        addStudent("620823104037", "DHARSHINI K", "mkdharshini23@gmail.com", "9994897321", "CSE-A");
        addStudent("620823104038", "DINESH KUMAR S", "lovlydinesh64@gmail.com", "8925709599", "CSE-A");
        addStudent("620823104039", "DIVYA V T", "divyavt202006@gmail.com", "8248219435", "CSE-A");
        addStudent("620823104040", "ELAKKIYA E", "eelakkiyaelangovan2006@gmail.com", "9976627072", "CSE-A");
        addStudent("620823104041", "ELAVARASAN S", "es9991288@gmail.com", "7639217478", "CSE-A");
        addStudent("620823104042", "EZHILMATHI K", "ezhil7579@gmail.com", "6379616618", "CSE-A");
        addStudent("620823104044", "GANGA K", "g8382315@gmail.com", "9585506303", "CSE-A");
        addStudent("620823104045", "GAYAM SAIKUMAR REDDY", "saikumarreddygayam68@gmail.com", "9985535937", "CSE-A");
        addStudent("620823104046", "GAYATHRI B", "gayujala@gmail.com", "9443273366", "CSE-A");
        addStudent("620823104047", "GIRINATH R", "GirinathGirinath028@gmail.om", "6383895767", "CSE-A");
        addStudent("620823104048", "GOKUL K", "gokulperumalgokul@gmail.com", "8248258849", "CSE-A");
        addStudent("620823104049", "GOKUL M", "gokulmurugesan9356@gmail.com", "9445848183", "CSE-A");
        addStudent("620823104050", "GOKUL N", "gokulgokuljnp2005@gmail.com", "9487210625", "CSE-A");
        addStudent("620823104051", "GOKULADHARSHINI S", "gokuladharshini2415@gmail.com", "9790627462", "CSE-A");
        addStudent("620823104052", "GOKULAPRIYAN M A", "magokulapriyanpacschemb@gmail.com", "7010745018", "CSE-A");
        addStudent("620823104053", "GOKULNATH M", "sridharamudha78@gmail.com", "9025985322", "CSE-A");
        addStudent("620823104054", "GOKULNATHAN A", "agokul6442@gmail.com", "8883320046", "CSE-A");
        addStudent("620823104055", "GORANTLA BHAVITHA", "gorantlabhavitha2005@gmail.com", "8247402007", "CSE-A");
        addStudent("620823104056", "GOWSHICKRAJA V", "gowshicklite@gmail.com", "9488411557", "CSE-A");
        addStudent("620823104057", "GOWTHAMAN K M", "gowtham2507.mcg@gmail.com", "8667702642", "CSE-A");
        addStudent("620823104058", "GUNAVATHI S", "gunavathiselvam06@gmail.com", "9597519383", "CSE-A");
        addStudent("620823104059", "HARIHARAN N", "hariharannandha2005@gmail.com", "9786032831", "CSE-A");
        addStudent("620823104060", "HARI KRISHNA R", "harikrishnakannaiya@gmail.com", "9606554211", "CSE-A");
        addStudent("620823104061", "HARIRAGUL R", "hariragul088@gmail.com", "9751767503", "CSE-A");
        addStudent("620823104062", "HARISHRAJ J", "harishrajj2005@gmail.com", "8760626164", "CSE-A");
        addStudent("620823104063", "JAISHREE R", "jaishreeramesh792@gamil.com", "8610947596", "CSE-A");
        addStudent("620823104064", "JANA S", "janasakthivel333@gmail.com", "7373907849", "CSE-A");
        addStudent("620823104065", "JANANI S", "janjanani0808@gmail.com", "8098789696", "CSE-A");
        addStudent("620823104066", "JANSI G", "gjansi2005@gmail.com", "7539901345", "CSE-B");
        addStudent("620823104067", "JAYA SURIYA S", "jayasuriya0702@gmail.com", "6383078552", "CSE-B");
        addStudent("620823104068", "JEEVANANTHAN S", "jeevananthanjii@gmail.com", "9600994661", "CSE-B");
        addStudent("620823104069", "JIJITH P", "palanisamyjijith@gmail.com", "9600569421", "CSE-B");
        addStudent("620823104071", "JOJI SUNNY", "jojisunny0317@gmail.com", "6282653781", "CSE-B");
        addStudent("620823104072", "JOTHI EAASWARAN S", "jothishsasii@gmail.com", "8610762819", "CSE-B");
        addStudent("620823104073", "KAAVIYA S", "Kaviyak494@gmail.com", "9353136192", "CSE-B");
        addStudent("620823104074", "KALAIYARASAN P", "kpgkalai2004@gmail.com", "6381143502", "CSE-B");
        addStudent("620823104075", "KARTHIK K", "ksanjaiksanjai86@gmail.com", "9786972473", "CSE-B");
        addStudent("620823104076", "KASIRAJAN J", "kasirajan11172005@gmail.com", "9342174755", "CSE-B");
        addStudent("620823104077", "KATHIRVEL M", "mkathir989@gmail.com", "9894212249", "CSE-B");
        addStudent("620823104078", "KAVINKUMAR V", "Kavin5714@gmail.com", "8754120203", "CSE-B");
        addStudent("620823104079", "KAVIPRAKASH R", "pkavi8972@gmail.com", "9025154860", "CSE-B");
        addStudent("620823104080", "KAVIRAJA K", "Kavirajak201@gmail.com", "9361004632", "CSE-B");
        addStudent("620823104081", "KAVIYA R", "kaviya28209@gmail.com", "8438819526", "CSE-B");
        addStudent("620823104082", "KEVINSAMUVELS L", "kevinsamuvels29@gmail.com", "8489854003", "CSE-B");
        addStudent("620823104083", "KIRAN K", "kiran.k29012005@gmail.com", "9942264603", "CSE-B");
        addStudent("620823104084", "KIRUTHIK M", "kiruthikmohan205@gmail.com", "8428486779", "CSE-B");
        addStudent("620823104085", "KIRUTHIKA K", "abinrajkathiresan@gmail.com", "9384756563", "CSE-B");
        addStudent("620823104086", "KISORE VIGNESWARAN R", "Kisore771@gmail.com", "9042441049", "CSE-B");
        addStudent("620823104087", "KONDURU DIVYA", "kondurudivya85@gmail.com", "7416283255", "CSE-B");
        addStudent("620823104089", "LAKESHSHEKE L", "lakeshsheke05@gmail.com", "8610899421", "CSE-B");
        addStudent("620823104090", "LALITHKUMAR R", "rrlalithkumarrr@gmail.com", "9790313670", "CSE-B");
        addStudent("620823104091", "MADHANKUMAR S", "Madhankumar5231@gmail.com", "6383242425", "CSE-B");
        addStudent("620823104092", "MAHALAKSHMI P", "mahalakshmipasupuathy@gmail.com", "9677329810", "CSE-B");
        addStudent("620823104093", "MAHENDHIRAN E", "mahedhiraneswaran@gmail.com", "7418096719", "CSE-B");
        addStudent("620823104094", "MAHIMA M", "mahima29062006@gmail.com", "6362853869", "CSE-B");
        addStudent("620823104095", "MANAV SHARMA", "manav34352@gmail.com", "7739034352", "CSE-B");
        addStudent("620823104096", "MANIVEL D", "Manivel922006@gmail.com", "9952339417", "CSE-B");
        addStudent("620823104097", "MANO S", "Sekarmano9342@Gmail.com", "7603871156", "CSE-B");
        addStudent("620823104098", "MD ASAD ANSARI", "alimdsaif9314@gmail.com", "9031409314", "CSE-B");
        addStudent("620823104099", "MD KAIF ALI KHAN", "kaif14515@gmail.com", "8114523312", "CSE-B");
        addStudent("620823104100", "MD TAUKIR ANSARI", "taukirbhai572@gmail.com", "9304311146", "CSE-B");
        addStudent("620823104101", "MITRRA S K", "Mithramithra242@gmail.com", "9698816931", "CSE-B");
        addStudent("620823104103", "MOHAMMED SIDDIQ M", "Mohammedsiddiq8080@gmail.com", "6369385104", "CSE-B");
        addStudent("620823104104", "MOHANAPRIYA V", "priyavsm2007@gmail.com", "8056739908", "CSE-B");
        addStudent("620823104105", "MONASH R", "monashravi2006@gmail.com", "9600378748", "CSE-B");
        addStudent("620823104106", "MOULISHWARAN S", "mouli5017@gmail.com", "8838143122", "CSE-B");
        addStudent("620823104107", "MUGUNTHAN A", "mmugunthansuriya@gmail.com", "8056597525", "CSE-B");
        addStudent("620823104108", "MUTHARASAN P", "mutharasanarasan9@gmail.com", "8270974640", "CSE-B");
        addStudent("620823104109", "MUTHU PANDI M", "muthupandip354@gmail.com", "9361368559", "CSE-B");
        addStudent("620823104110", "NATHANI SOWKYA", "sowkhyanathani@gmail.com", "8147843619", "CSE-B");
        addStudent("620823104111", "NAVASRI S", "navasrisaravanan@gmail.com", "8122115889", "CSE-B");
        addStudent("620823104112", "NAVEENKUMAR G", "naveenkumar1456@gmail.com", "9940046857", "CSE-B");
        addStudent("620823104113", "NAVEENKUMAR K", "nishanthinaveen861@gmail.com", "9789253071", "CSE-B");
        addStudent("620823104114", "NAVIN KUMAR S", "navindhanu2023@gmail.com", "8778235393", "CSE-B");
        addStudent("620823104115", "NETTAM UDAY KIRAN", "nudaykirannuday@gmail.com", "6304945209", "CSE-B");
        addStudent("620823104116", "NISHA P", "nishaprakash142006@gmail.com", "6382756327", "CSE-B");
        addStudent("620823104118", "NITHYADHARSHINI S", "snithyadharshinisnithya@gmail.com", "9345200213", "CSE-B");
        addStudent("620823104119", "OVIYASRI P", "reetairudhayam@gmail.comC", "9750330939", "CSE-B");
        addStudent("620823104120", "PALA ABHILASH", "abhilashpala41@gmail.com", "7816070540", "CSE-B");
        addStudent("620823104121", "PANKAJ KUMAR YADAV", "pankajydv787074@gmail.com", "7870748165", "CSE-B");
        addStudent("620823104122", "PARKAVIN L", "parkavin7373@gmail.com", "6381390388", "CSE-B");
        addStudent("620823104123", "PAVITHRA J", "pavithrajaganathan2436@gmail.com", "7904925127", "CSE-B");
        addStudent("620823104124", "PONSANKAR K", "ponsankar2605@gmail.com", "9345317058", "CSE-B");
        addStudent("620823104126", "POORVASH S", "Poorvashrichie32@gmail.com", "9345881678", "CSE-B");
        addStudent("620823104127", "PRADEEP S", "pradeep1752006@gmail.com", "6380340495", "CSE-B");
        addStudent("620823104128", "PRADEEPKUMAR M", "attupradeeppradeep@gmail.com", "7418877938", "CSE-B");
        addStudent("620823104129", "PRAJITKUMAR V S", "vstarmeshvstarmesh@gmail.com", "6385533689", "CSE-B");
        addStudent("620823104130", "PRASANNA R", "prasannarajapriya@gmail.com", "6383847466", "CSE-B");
        addStudent("620823104131", "PRASATH B", "Prasathprince276@gmail.com", "8122050270", "CSE-B");
        addStudent("620823104132", "PRAVEEN A", "praveenapraveen104@gmail.com", "9566937837", "CSE-B");
        addStudent("620823104133", "PRAVEENA B", "praveena90613@gmail.com", "9043840935", "CSE-C");
        addStudent("620823104134", "PRAVEENA C", "praveenachinnusamy006@gmail.com", "7604864152", "CSE-C");
        addStudent("620823104135", "PRIYADHARSHINI M", "priyadharshinimohanraj5080@gmail.com", "9943163226", "CSE-C");
        addStudent("620823104137", "PUGAZHENTHI S", "jayapugazh947@gmail.com", "9943205075", "CSE-C");
        addStudent("620823104138", "R RAM MOORTHY", "rammoorthyram83@gmail.com", "8019862077", "CSE-C");
        addStudent("620823104139", "RACHANA N", "rachanamylu12@gmail.com", "6379380557", "CSE-C");
        addStudent("620823104140", "RAHUL KUMAR CHAUPAL", "chaupalrahul000@gmailcom", "8002545435", "CSE-C");
        addStudent("620823104141", "RAJA M", "tamilan8487@gmail.com", "9345726855", "CSE-C");
        addStudent("620823104142", "RASANI MEHA", "rasaniramesh@gmail.com", "9121105135", "CSE-C");
        addStudent("620823104143", "RAVI D", "raviravi44012@gmail.com", "8098200749", "CSE-C");
        addStudent("620823104145", "SACHIN YADAV", "seemasachin979@gmail.com", "6387605916", "CSE-C");
        addStudent("620823104146", "SAKTHIVEL S", "sakthiselva62@gmail.com", "6379888531", "CSE-C");
        addStudent("620823104147", "SAMUVEL D", "samuvelsamuvel@gmail.com", "9345222979", "CSE-C");
        addStudent("620823104148", "SANJAI K", "k.sanjaisanjai33@gmail.com", "9597419578", "CSE-C");
        addStudent("620823104149", "SANJAI S", "sanjaisankar049@gmail.com", "6381055294", "CSE-C");
        addStudent("620823104150", "SANJAY A", "sanjayarul705@gmail.com", "9043215573", "CSE-C");
        addStudent("620823104151", "SANJAY P", "sanjayp132005@gmail.com", "8940509032", "CSE-C");
        addStudent("620823104152", "SANJAYKISHORE M", "deenusanjay10@gmail.com", "7010326679", "CSE-C");
        addStudent("620823104153", "SANTHIYA V", "santhiyavnkl@gmail.com", "9790159848", "CSE-C");
        addStudent("620823104154", "SANTHOSHKUMAR M", "santhoshkumar160706@gmail.com", "9345402493", "CSE-C");
        addStudent("620823104156", "SARANG K", "kSarang600@gmail.com", "9495006186", "CSE-C");
        addStudent("620823104157", "SARAVANAKUMAR R", "saravanakumar12032005@gmail.com", "6379598677", "CSE-C");
        addStudent("620823104158", "SARAVANAVEL M", "vel793028@gmail.com", "7806940773", "CSE-C");
        addStudent("620823104159", "SASIKUMAR R", "r.sasikumar016@gmail.com", "9345726098", "CSE-C");
        addStudent("620823104160", "SATYAM KUMAR SINGH", "satyamsinghrajput01778@gmail.com", "8541823196", "CSE-C");
        addStudent("620823104161", "SHAIK MOHAMMED", "shaikmohammed44926@gmail.com", "9515585943", "CSE-C");
        addStudent("620823104162", "SHAKILA T", "shakilathangarasubecse@gmail.com", "8220195892", "CSE-C");
        addStudent("620823104164", "SNEKA S", "snekapappu7695@gmail.com", "8248567695", "CSE-C");
        addStudent("620823104165", "SOWMIYA L", "sowmiyalogu2006@gmail.com", "9345302588", "CSE-C");
        addStudent("620823104166", "SUBHASH KUMAR", "subhashkumar8873670435@gmail.com", "8873670435", "CSE-C");
        addStudent("620823104167", "SUBISRI S", "subisriselvakumar@gmail.com", "9080402566", "CSE-C");
        addStudent("620823104168", "SUDHARSAN S", "ipssudharsan2@gmail.com", "6374435625", "CSE-C");
        addStudent("620823104169", "SUJITH S", "sujithff123@gmail.com", "6381357523", "CSE-C");
        addStudent("620823104170", "SUMITHRA K", "kumaresanparimala104@gmail.com", "9342928248", "CSE-C");
        addStudent("620823104171", "SURENDHAR R", "surendhar738@gmail.com", "6382339698", "CSE-C");
        addStudent("620823104172", "SWETHA R", "ariyaramesh0@gmail.com", "9042903821", "CSE-C");
        addStudent("620823104173", "SYED UMAR FAROOQ", "usyed7208@gmail.com", "9966992615", "CSE-C");
        addStudent("620823104174", "TAMIZHARASAN P", "ta6705869@gmail.com", "9843544369", "CSE-C");
        addStudent("620823104175", "THANIGAIVELAN S", "amuthanthangai143@gmail.com", "9442487157", "CSE-C");
        addStudent("620823104176", "THILAKESWARAN B", "thilakesb@gmail.com", "7904865511", "CSE-C");
        addStudent("620823104177", "VAITHISWARAN P", "vaithiswaranp@gmail.com", "8778328194", "CSE-C");
        addStudent("620823104178", "VEEMARASU M", "veemarasu12@gmail.com", "8098435255", "CSE-C");
        addStudent("620823104179", "VIKRAM S", "vikram20063206@gmail.com", "9788893709", "CSE-C");
        addStudent("620823104180", "VINOTHINI C", "vinothinichinnadurai13@gmail.com", "9629701776", "CSE-C");
        addStudent("620823104181", "VISHVA V", "vishvavimal376@gmail.com", "6381088434", "CSE-C");
        addStudent("620823104182", "VISWANATHAN S", "viswavickysrs@gmail.com", "9629001066", "CSE-C");
        addStudent("620823104183", "YAMUNASRI V", "yammunasri324@gmail.com", "7200501665", "CSE-C");
        addStudent("620823104184", "YKUNTAM MANOJ YADAV", "manojmanum740@gmail.com", "9391400508", "CSE-C");
        addStudent("620823104185", "YUKESH S", "yukesh1825@gmail.com", "8220385712", "CSE-C");
        addStudent("620823104301", "AJITHKUMAR M", "ajithrrk25@gmail.com", "6369317787", "CSE-C");
        addStudent("620823104302", "KOPALA HARIKA", "kharika0606@gmail.com", "8186963882", "CSE-C");
        addStudent("620823104303", "THANIYA S", "thaniya1009son@gmail.com", "8610326637", "CSE-C");
    }

    private static void addStudent(String regNo, String name, String email, String contact, String section) {
        UserProfile p = new UserProfile();
        p.setId(regNo);
        p.setIdentifier(regNo);
        p.setName(name);
        p.setEmail(email != null && !email.isEmpty() ? email : (regNo + "@gct.ac.in"));
        p.setContact(contact != null && !contact.isEmpty() ? ("+91 " + contact) : "+91 98765 00000");
        p.setSection(section);
        p.setDepartment("CSE");
        p.setRole(UserRole.STUDENT);
        p.setAcademicYear(UserService.CURRENT_ACADEMIC_YEAR);
        p.setYear("IV Year");
        p.setStudentType("Day Scholar");
        p.setAdvisor(UserService.resolveClassAdvisorForSection(section));
        p.setBio("Authorized student record enrolled in " + UserService.CURRENT_ACADEMIC_YEAR + " at Gnanamani College of Technology.");
        ROSTER_BY_ID.put(regNo.trim(), p);
        ROSTER_BY_SECTION.computeIfAbsent(section.toUpperCase(), k -> new ArrayList<>()).add(p);
    }

    public static List<UserProfile> getStudentsForSection(String section) {
        if (section == null || section.trim().isEmpty() || "ALL".equalsIgnoreCase(section)) {
            return new ArrayList<>(ROSTER_BY_ID.values());
        }
        List<UserProfile> list = ROSTER_BY_SECTION.get(section.trim().toUpperCase());
        return list != null ? new ArrayList<>(list) : Collections.emptyList();
    }

    public static UserProfile findStudent(String regNoOrEmail) {
        if (regNoOrEmail == null) return null;
        String clean = regNoOrEmail.trim().toLowerCase();
        if ("student".equals(clean) || "student.demo@epoch.edu".equals(clean) || "student@epoch.edu".equals(clean) || "student@gct.ac.in".equals(clean)) {
            clean = "620823104002";
        }
        for (UserProfile p : ROSTER_BY_ID.values()) {
            if (p.getIdentifier().equalsIgnoreCase(clean) || (p.getEmail() != null && p.getEmail().equalsIgnoreCase(clean))) {
                return p;
            }
        }
        return null;
    }

    public static Map<String, UserProfile> getAllStudents() {
        return Collections.unmodifiableMap(ROSTER_BY_ID);
    }

    public static int getCountForSection(String section) {
        return getStudentsForSection(section).size();
    }

    public static int getTotalCount() {
        return ROSTER_BY_ID.size();
    }
}
