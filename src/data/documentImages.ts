// Authentic Cambodia Healthcare Document Visual Renders (Letterheads, Stamps, Signatures, and Scans)

export const DOCUMENT_IMAGES = {
  // 1. Calmette Hospital - Prescription Slip (Rx)
  prescriptionCalmette: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1050" width="100%" height="100%">
  <defs>
    <filter id="paper-texture" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
      <feDiffuseLighting in="noise" lighting-color="#fffdf7" surfaceScale="2" result="light">
        <feDistantLight azimuth="45" elevation="60" />
      </feDiffuseLighting>
      <feBlend mode="multiply" in="SourceGraphic" in2="light" />
    </filter>
  </defs>
  
  <!-- Paper Background -->
  <rect width="800" height="1050" fill="#fcfbf7" rx="8" />
  <rect x="25" y="25" width="750" height="1000" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" rx="4" />
  
  <!-- Hospital Header -->
  <rect x="40" y="40" width="720" height="125" fill="#0d9488" rx="4" opacity="0.06" />
  <circle cx="85" cy="100" r="32" fill="#0d9488" />
  <path d="M85 80 L85 120 M65 100 L105 100" stroke="#ffffff" stroke-width="8" stroke-linecap="round" />
  
  <text x="135" y="80" font-family="'Kantumruy Pro', 'Khmer OS', sans-serif" font-size="20" font-weight="bold" fill="#0f766e">មន្ទីរពេទ្យកាល់ម៉ែត • CALMETTE HOSPITAL</text>
  <text x="135" y="102" font-family="sans-serif" font-size="13" font-weight="600" fill="#334155">DEPARTMENT OF GASTROENTEROLOGY &amp; HEPATOLOGY</text>
  <text x="135" y="122" font-family="sans-serif" font-size="11" fill="#64748b">#3 Monivong Blvd, Phnom Penh, Cambodia • Tel: +855 23 426 948</text>
  
  <!-- Prescription Header Banner -->
  <line x1="45" y1="175" x2="755" y2="175" stroke="#0d9488" stroke-width="2.5" />
  <text x="400" y="205" font-family="sans-serif" font-size="22" font-weight="bold" text-anchor="middle" fill="#0f172a" letter-spacing="2">MEDICAL PRESCRIPTION / វេជ្ជបញ្ជា</text>
  <text x="400" y="225" font-family="sans-serif" font-size="11" text-anchor="middle" fill="#0d9488" font-weight="bold">Rx Ref: CAL-RX-2025-88412</text>
  <line x1="250" y1="235" x2="550" y2="235" stroke="#cbd5e1" stroke-width="1" />

  <!-- Patient & Clinic Meta Grid -->
  <rect x="45" y="250" width="710" height="95" fill="#f8fafc" stroke="#e2e8f0" rx="6" />
  <text x="65" y="275" font-family="sans-serif" font-size="12" font-weight="bold" fill="#475569">PATIENT NAME:</text>
  <text x="180" y="275" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">Moli Keo (កែវ ម៉ូលី)</text>
  
  <text x="430" y="275" font-family="sans-serif" font-size="12" font-weight="bold" fill="#475569">DATE / កាលបរិច្ឆេទ:</text>
  <text x="560" y="275" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">18 / 10 / 2025</text>
  
  <text x="65" y="305" font-family="sans-serif" font-size="12" font-weight="bold" fill="#475569">AGE / GENDER:</text>
  <text x="180" y="305" font-family="sans-serif" font-size="13" fill="#1e293b">27 Yrs • Female (ស្រី)</text>
  
  <text x="430" y="305" font-family="sans-serif" font-size="12" font-weight="bold" fill="#475569">BLOOD GROUP:</text>
  <text x="560" y="305" font-family="sans-serif" font-size="14" font-weight="bold" fill="#e11d48">B+ (Rh Positive)</text>
  
  <text x="65" y="333" font-family="sans-serif" font-size="12" font-weight="bold" fill="#475569">DIAGNOSIS:</text>
  <text x="180" y="333" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f766e">Acute Gastritis &amp; Hyperacidity (រលាកក្រពះស្រួចស្រាវ)</text>

  <!-- Big Rx Symbol -->
  <text x="65" y="420" font-family="'Times New Roman', serif" font-size="64" font-weight="bold" font-style="italic" fill="#0d9488">Rx</text>
  
  <!-- Prescription Items -->
  <g transform="translate(65, 450)">
    <!-- Item 1 -->
    <rect x="0" y="0" width="670" height="75" fill="#f1f5f9" rx="6" />
    <text x="20" y="28" font-family="sans-serif" font-size="15" font-weight="bold" fill="#0f172a">1. Omeprazole 20 mg Capsules (AstraZeneca)</text>
    <text x="20" y="52" font-family="sans-serif" font-size="13" fill="#334155">• Dosage: 1 capsule daily in the morning (30 mins before breakfast) x 28 days</text>
    <text x="580" y="40" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f766e"># 28 Caps</text>
    
    <!-- Item 2 -->
    <rect x="0" y="90" width="670" height="75" fill="#f8fafc" stroke="#e2e8f0" rx="6" />
    <text x="20" y="118" font-family="sans-serif" font-size="15" font-weight="bold" fill="#0f172a">2. Gaviscon Double Action Oral Suspension</text>
    <text x="20" y="142" font-family="sans-serif" font-size="13" fill="#334155">• Dosage: 10 ml after meals and before bedtime as needed for reflux relief</text>
    <text x="580" y="130" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f766e"># 2 Bottles</text>
    
    <!-- Item 3 -->
    <rect x="0" y="180" width="670" height="65" fill="#f1f5f9" rx="6" />
    <text x="20" y="208" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">3. Domperidone 10 mg Tablets</text>
    <text x="20" y="230" font-family="sans-serif" font-size="13" fill="#334155">• Dosage: 1 tablet 15 mins before lunch and dinner (x 10 days only)</text>
    <text x="580" y="215" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f766e"># 20 Tabs</text>
  </g>

  <!-- Clinical Advice Box -->
  <rect x="65" y="730" width="670" height="75" fill="#fffbeb" stroke="#fde68a" rx="6" />
  <text x="85" y="755" font-family="sans-serif" font-size="12" font-weight="bold" fill="#92400e">⚠️ INSTRUCTIONS &amp; LIFESTYLE DIRECTIVES:</text>
  <text x="85" y="776" font-family="sans-serif" font-size="11" fill="#78350f">Avoid spicy food, caffeine, raw acid fruits, and late night dining. Return for endoscopy if symptoms persist.</text>

  <!-- Red Certified Official Stamp -->
  <g transform="translate(130, 890) rotate(-8)">
    <circle cx="0" cy="0" r="58" fill="none" stroke="#dc2626" stroke-width="3" stroke-dasharray="8,2" />
    <circle cx="0" cy="0" r="50" fill="none" stroke="#dc2626" stroke-width="1.5" />
    <text x="0" y="-22" font-family="sans-serif" font-size="9" font-weight="bold" text-anchor="middle" fill="#dc2626" letter-spacing="1">CALMETTE HOSPITAL</text>
    <text x="0" y="-3" font-family="sans-serif" font-size="12" font-weight="black" text-anchor="middle" fill="#dc2626">CERTIFIED</text>
    <text x="0" y="16" font-family="sans-serif" font-size="9" font-weight="bold" text-anchor="middle" fill="#dc2626">PHNOM PENH</text>
    <text x="0" y="32" font-family="sans-serif" font-size="8" text-anchor="middle" fill="#dc2626">18 OCT 2025</text>
  </g>

  <!-- Doctor Signature & Stamp -->
  <g transform="translate(480, 830)">
    <text x="80" y="20" font-family="sans-serif" font-size="12" font-weight="bold" fill="#475569">ATTENDING PHYSICIAN:</text>
    <!-- Doctor Signature Path -->
    <path d="M 40,55 Q 65,30 90,60 T 130,45 Q 160,80 180,40 T 210,65" fill="none" stroke="#1e3a8a" stroke-width="2.5" stroke-linecap="round" />
    <line x1="20" y1="85" x2="240" y2="85" stroke="#94a3b8" stroke-width="1" />
    <text x="130" y="105" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="#0f172a">Dr. Chea Vanna, MD</text>
    <text x="130" y="122" font-family="sans-serif" font-size="11" text-anchor="middle" fill="#64748b">Lic: #CAM-MED-04921 • Gastroenterology</text>
  </g>

  <!-- Bottom Digital QR Security Bar -->
  <rect x="40" y="990" width="720" height="25" fill="#f1f5f9" />
  <text x="50" y="1007" font-family="monospace" font-size="10" fill="#64748b">SOKHAPHEAP DIGITAL VERIFIED RECORD • REF: SKP-DOC-CAL-88412 • CONFIDENTIAL MEDICAL DATA</text>
</svg>
`)}`,

  // 2. Institut Pasteur du Cambodge - Blood & Biochemistry Lab Sheet
  labPasteur: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1050" width="100%" height="100%">
  <!-- Paper Sheet -->
  <rect width="800" height="1050" fill="#f8fafc" />
  <rect x="25" y="25" width="750" height="1000" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="6" />

  <!-- Pasteur Header -->
  <rect x="40" y="40" width="720" height="110" fill="#0284c7" opacity="0.05" rx="4" />
  <rect x="60" y="55" width="55" height="55" rx="10" fill="#0369a1" />
  <text x="87" y="92" font-family="sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">IP</text>
  
  <text x="130" y="75" font-family="sans-serif" font-size="18" font-weight="bold" fill="#0369a1">INSTITUT PASTEUR DU CAMBODGE</text>
  <text x="130" y="95" font-family="sans-serif" font-size="13" font-weight="bold" fill="#334155">LABORATOIRE DE BIOLOGIE MÉDICALE / CLINICAL BIOLOGY LAB</text>
  <text x="130" y="115" font-family="sans-serif" font-size="11" fill="#64748b">ISO 15189 Accredited Laboratory • 5 Blvd Monivong, Phnom Penh</text>

  <!-- Title Strip -->
  <rect x="45" y="160" width="710" height="35" fill="#0369a1" rx="4" />
  <text x="400" y="184" font-family="sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="1">LABORATORY INVESTIGATION REPORT / លទ្ធផលវិភាគឈាម</text>

  <!-- Patient Details Grid -->
  <rect x="45" y="205" width="710" height="85" fill="#f1f5f9" rx="4" stroke="#e2e8f0" />
  <text x="65" y="230" font-family="sans-serif" font-size="11" font-weight="bold" fill="#64748b">PATIENT NAME:</text>
  <text x="175" y="230" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">Moli Keo (ស្រី - 27 Yrs)</text>
  
  <text x="430" y="230" font-family="sans-serif" font-size="11" font-weight="bold" fill="#64748b">SAMPLE ID / REF:</text>
  <text x="560" y="230" font-family="monospace" font-size="12" font-weight="bold" fill="#0369a1">IPC-LAB-2025-99381</text>

  <text x="65" y="258" font-family="sans-serif" font-size="11" font-weight="bold" fill="#64748b">COLLECTION DATE:</text>
  <text x="175" y="258" font-family="sans-serif" font-size="12" font-weight="semibold" fill="#0f172a">02 / 11 / 2025 - 08:30 AM</text>

  <text x="430" y="258" font-family="sans-serif" font-size="11" font-weight="bold" fill="#64748b">VALIDATION DATE:</text>
  <text x="560" y="258" font-family="sans-serif" font-size="12" font-weight="semibold" fill="#0f172a">02 / 11 / 2025 - 04:15 PM</text>

  <!-- Test Results Table -->
  <g transform="translate(45, 305)">
    <!-- Header -->
    <rect x="0" y="0" width="710" height="32" fill="#0f172a" rx="4" />
    <text x="20" y="21" font-family="sans-serif" font-size="12" font-weight="bold" fill="#ffffff">TEST DESCRIPTION</text>
    <text x="280" y="21" font-family="sans-serif" font-size="12" font-weight="bold" fill="#ffffff">RESULT</text>
    <text x="420" y="21" font-family="sans-serif" font-size="12" font-weight="bold" fill="#ffffff">REFERENCE RANGE</text>
    <text x="610" y="21" font-family="sans-serif" font-size="12" font-weight="bold" fill="#ffffff">STATUS</text>

    <!-- Row 1: Hemoglobin -->
    <rect x="0" y="36" width="710" height="36" fill="#f8fafc" />
    <text x="20" y="60" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">Hemoglobin (Hb)</text>
    <text x="280" y="60" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0369a1">13.4 g/dL</text>
    <text x="420" y="60" font-family="sans-serif" font-size="12" fill="#64748b">12.0 – 15.5 g/dL</text>
    <rect x="600" y="44" width="75" height="20" fill="#dcfce7" rx="4" />
    <text x="637" y="58" font-family="sans-serif" font-size="11" font-weight="bold" fill="#166534" text-anchor="middle">NORMAL</text>

    <!-- Row 2: WBC -->
    <rect x="0" y="74" width="710" height="36" fill="#ffffff" />
    <text x="20" y="98" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">White Blood Count (WBC)</text>
    <text x="280" y="98" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0369a1">6.8 x10³/µL</text>
    <text x="420" y="98" font-family="sans-serif" font-size="12" fill="#64748b">4.5 – 11.0 x10³/µL</text>
    <rect x="600" y="82" width="75" height="20" fill="#dcfce7" rx="4" />
    <text x="637" y="96" font-family="sans-serif" font-size="11" font-weight="bold" fill="#166534" text-anchor="middle">NORMAL</text>

    <!-- Row 3: Platelets -->
    <rect x="0" y="112" width="710" height="36" fill="#f8fafc" />
    <text x="20" y="136" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">Platelet Count (PLT)</text>
    <text x="280" y="136" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0369a1">245 x10³/µL</text>
    <text x="420" y="136" font-family="sans-serif" font-size="12" fill="#64748b">150 – 450 x10³/µL</text>
    <rect x="600" y="120" width="75" height="20" fill="#dcfce7" rx="4" />
    <text x="637" y="134" font-family="sans-serif" font-size="11" font-weight="bold" fill="#166534" text-anchor="middle">NORMAL</text>

    <!-- Section Header: Biochemistry -->
    <rect x="0" y="152" width="710" height="28" fill="#e0f2fe" />
    <text x="20" y="171" font-family="sans-serif" font-size="11" font-weight="bold" fill="#0369a1">SERUM BIOCHEMISTRY &amp; METABOLIC PANEL</text>

    <!-- Row 4: Glucose -->
    <rect x="0" y="182" width="710" height="36" fill="#ffffff" />
    <text x="20" y="206" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">Fasting Blood Glucose</text>
    <text x="280" y="206" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0369a1">88 mg/dL</text>
    <text x="420" y="206" font-family="sans-serif" font-size="12" fill="#64748b">70 – 99 mg/dL</text>
    <rect x="600" y="190" width="75" height="20" fill="#dcfce7" rx="4" />
    <text x="637" y="204" font-family="sans-serif" font-size="11" font-weight="bold" fill="#166534" text-anchor="middle">NORMAL</text>

    <!-- Row 5: HbA1c -->
    <rect x="0" y="220" width="710" height="36" fill="#f8fafc" />
    <text x="20" y="244" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">Glycated Hemoglobin (HbA1c)</text>
    <text x="280" y="244" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0369a1">5.2 %</text>
    <text x="420" y="244" font-family="sans-serif" font-size="12" fill="#64748b">&lt; 5.7 % (Normal)</text>
    <rect x="600" y="228" width="75" height="20" fill="#dcfce7" rx="4" />
    <text x="637" y="242" font-family="sans-serif" font-size="11" font-weight="bold" fill="#166534" text-anchor="middle">NORMAL</text>

    <!-- Row 6: Creatinine -->
    <rect x="0" y="258" width="710" height="36" fill="#ffffff" />
    <text x="20" y="282" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">Serum Creatinine</text>
    <text x="280" y="282" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0369a1">0.82 mg/dL</text>
    <text x="420" y="282" font-family="sans-serif" font-size="12" fill="#64748b">0.50 – 0.90 mg/dL</text>
    <rect x="600" y="266" width="75" height="20" fill="#dcfce7" rx="4" />
    <text x="637" y="280" font-family="sans-serif" font-size="11" font-weight="bold" fill="#166534" text-anchor="middle">NORMAL</text>

    <!-- Row 7: ALT -->
    <rect x="0" y="296" width="710" height="36" fill="#f8fafc" />
    <text x="20" y="320" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">Liver Enzyme ALT (SGPT)</text>
    <text x="280" y="320" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0369a1">19 U/L</text>
    <text x="420" y="320" font-family="sans-serif" font-size="12" fill="#64748b">7 – 35 U/L</text>
    <rect x="600" y="304" width="75" height="20" fill="#dcfce7" rx="4" />
    <text x="637" y="318" font-family="sans-serif" font-size="11" font-weight="bold" fill="#166534" text-anchor="middle">NORMAL</text>
  </g>

  <!-- Lab Conclusion Note -->
  <rect x="45" y="700" width="710" height="70" fill="#f0fdf4" stroke="#bbf7d0" rx="6" />
  <text x="65" y="725" font-family="sans-serif" font-size="12" font-weight="bold" fill="#166534">LABORATORY IMPRESSION / សេចក្តីសន្និដ្ឋាន:</text>
  <text x="65" y="748" font-family="sans-serif" font-size="12" fill="#15803d">All hematological and serum biochemistry parameters demonstrate healthy baseline function with no acute pathology detected.</text>

  <!-- Blue Pasteur Official Stamp -->
  <g transform="translate(140, 875) rotate(-5)">
    <circle cx="0" cy="0" r="54" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-dasharray="6,2" />
    <circle cx="0" cy="0" r="46" fill="none" stroke="#0284c7" stroke-width="1.5" />
    <text x="0" y="-20" font-family="sans-serif" font-size="8" font-weight="bold" text-anchor="middle" fill="#0284c7" letter-spacing="1">INSTITUT PASTEUR</text>
    <text x="0" y="-3" font-family="sans-serif" font-size="11" font-weight="black" text-anchor="middle" fill="#0284c7">BIO-CLINICAL LAB</text>
    <text x="0" y="14" font-family="sans-serif" font-size="8" font-weight="bold" text-anchor="middle" fill="#0284c7">APPROVED</text>
    <text x="0" y="28" font-family="sans-serif" font-size="7" text-anchor="middle" fill="#0284c7">02 NOV 2025</text>
  </g>

  <!-- Pathologist Signatures -->
  <g transform="translate(480, 810)">
    <text x="80" y="20" font-family="sans-serif" font-size="11" font-weight="bold" fill="#64748b">VALIDATED BY PATHOLOGIST:</text>
    <path d="M 30,55 Q 70,25 110,65 T 160,40 Q 190,75 220,50" fill="none" stroke="#0369a1" stroke-width="2.5" stroke-linecap="round" />
    <line x1="20" y1="80" x2="240" y2="80" stroke="#cbd5e1" stroke-width="1" />
    <text x="130" y="100" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">Dr. Kim Serey, MD</text>
    <text x="130" y="117" font-family="sans-serif" font-size="11" text-anchor="middle" fill="#64748b">Clinical Biology Specialist</text>
  </g>

  <!-- Footer -->
  <rect x="40" y="990" width="720" height="25" fill="#f8fafc" />
  <text x="50" y="1007" font-family="monospace" font-size="10" fill="#64748b">IPC LAB DIGITAL ARCHIVE • TOKEN REF: SKP-LAB-99381 • DIGITALLY ENCRYPTED</text>
</svg>
`)}`,

  // 3. Royal Phnom Penh Hospital - Medical Examination & Clearance Report
  reportRoyalPP: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1050" width="100%" height="100%">
  <rect width="800" height="1050" fill="#fafafa" />
  <rect x="25" y="25" width="750" height="1000" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" rx="6" />

  <!-- Royal PP Header -->
  <rect x="40" y="40" width="720" height="110" fill="#6b21a8" opacity="0.06" rx="4" />
  <rect x="60" y="55" width="55" height="55" rx="8" fill="#7e22ce" />
  <path d="M72 82 L87 68 L102 82 L97 97 L77 97 Z" fill="#ffffff" />
  
  <text x="130" y="75" font-family="sans-serif" font-size="18" font-weight="bold" fill="#6b21a8">ROYAL PHNOM PENH HOSPITAL</text>
  <text x="130" y="95" font-family="sans-serif" font-size="13" font-weight="bold" fill="#334155">EXECUTIVE HEALTH &amp; WELLNESS CENTER</text>
  <text x="130" y="115" font-family="sans-serif" font-size="11" fill="#64748b">No. 888, Russian Confederation Blvd, Phnom Penh • JCI Accredited</text>

  <line x1="45" y1="165" x2="755" y2="165" stroke="#7e22ce" stroke-width="2" />
  <text x="400" y="195" font-family="sans-serif" font-size="20" font-weight="bold" fill="#0f172a" text-anchor="middle" letter-spacing="1.5">ANNUAL MEDICAL CLEARANCE CERTIFICATE</text>

  <!-- Patient Demographic Strip -->
  <rect x="45" y="220" width="710" height="75" fill="#f8fafc" stroke="#e2e8f0" rx="6" />
  <text x="65" y="245" font-family="sans-serif" font-size="12" font-weight="bold" fill="#64748b">PATIENT:</text>
  <text x="150" y="245" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">Moli Keo (ID: SKP-2026-8812)</text>
  
  <text x="450" y="245" font-family="sans-serif" font-size="12" font-weight="bold" fill="#64748b">EXAM DATE:</text>
  <text x="560" y="245" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">20 / 06 / 2025</text>

  <text x="65" y="275" font-family="sans-serif" font-size="12" font-weight="bold" fill="#64748b">DOB &amp; GENDER:</text>
  <text x="150" y="275" font-family="sans-serif" font-size="13" fill="#334155">14 May 1998 • Female</text>

  <text x="450" y="275" font-family="sans-serif" font-size="12" font-weight="bold" fill="#64748b">REPORT NO:</text>
  <text x="560" y="275" font-family="monospace" font-size="13" font-weight="bold" fill="#7e22ce">RPPH-MED-7741</text>

  <!-- Physical Exam Vitals Grid -->
  <g transform="translate(45, 315)">
    <rect x="0" y="0" width="710" height="135" fill="#faf5ff" stroke="#e9d5ff" rx="6" />
    <text x="20" y="28" font-family="sans-serif" font-size="13" font-weight="bold" fill="#6b21a8">PHYSICAL EXAMINATION &amp; VITAL SIGNS:</text>
    
    <text x="20" y="60" font-family="sans-serif" font-size="12" fill="#334155">• Blood Pressure: <tspan font-weight="bold" fill="#0f172a">118 / 76 mmHg</tspan> (Normal)</text>
    <text x="260" y="60" font-family="sans-serif" font-size="12" fill="#334155">• Heart Rate: <tspan font-weight="bold" fill="#0f172a">72 bpm</tspan> (Regular sinus rhythm)</text>
    <text x="500" y="60" font-family="sans-serif" font-size="12" fill="#334155">• SpO2: <tspan font-weight="bold" fill="#0f172a">99%</tspan> on ambient air</text>

    <text x="20" y="90" font-family="sans-serif" font-size="12" fill="#334155">• Height: <tspan font-weight="bold" fill="#0f172a">162 cm</tspan> | Weight: <tspan font-weight="bold" fill="#0f172a">56 kg</tspan></text>
    <text x="260" y="90" font-family="sans-serif" font-size="12" fill="#334155">• BMI: <tspan font-weight="bold" fill="#0f172a">21.3 kg/m²</tspan> (Optimal)</text>
    <text x="500" y="90" font-family="sans-serif" font-size="12" fill="#334155">• Vision: <tspan font-weight="bold" fill="#0f172a">20/20 corrected</tspan></text>

    <text x="20" y="118" font-family="sans-serif" font-size="12" fill="#334155">• Cardiovascular: Normal S1/S2 heart sounds, no murmurs detected.</text>
  </g>

  <!-- Clinical Systems Review -->
  <g transform="translate(45, 470)">
    <text x="0" y="18" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">SYSTEMIC MEDICAL FINDINGS:</text>
    
    <rect x="0" y="30" width="710" height="40" fill="#f8fafc" stroke="#e2e8f0" rx="4" />
    <text x="15" y="55" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a">1. Respiratory &amp; Chest:</text>
    <text x="200" y="55" font-family="sans-serif" font-size="12" fill="#334155">Lungs clear to auscultation bilaterally. No wheezes or crackles.</text>

    <rect x="0" y="80" width="710" height="40" fill="#f8fafc" stroke="#e2e8f0" rx="4" />
    <text x="15" y="105" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a">2. Gastrointestinal:</text>
    <text x="200" y="105" font-family="sans-serif" font-size="12" fill="#334155">Soft, non-tender, active bowel sounds. History of mild episodic gastritis noted.</text>

    <rect x="0" y="130" width="710" height="40" fill="#f8fafc" stroke="#e2e8f0" rx="4" />
    <text x="15" y="155" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a">3. Musculoskeletal:</text>
    <text x="200" y="155" font-family="sans-serif" font-size="12" fill="#334155">Full range of motion in all joints, spine aligned, gait normal.</text>
  </g>

  <!-- Clearance Statement -->
  <rect x="45" y="670" width="710" height="75" fill="#f5f3ff" stroke="#ddd6fe" rx="6" />
  <text x="65" y="698" font-family="sans-serif" font-size="13" font-weight="bold" fill="#5b21b6">FINAL PHYSICIAN CLEARANCE OPINION:</text>
  <text x="65" y="722" font-family="sans-serif" font-size="12" fill="#4c1d95">The patient has undergone comprehensive physical and clinical screening and is certified to be in EXCELLENT overall health for professional and personal duties.</text>

  <!-- Royal PP Gold/Purple Stamp -->
  <g transform="translate(130, 870) rotate(-6)">
    <circle cx="0" cy="0" r="54" fill="none" stroke="#7e22ce" stroke-width="2.5" stroke-dasharray="6,2" />
    <circle cx="0" cy="0" r="46" fill="none" stroke="#7e22ce" stroke-width="1.5" />
    <text x="0" y="-18" font-family="sans-serif" font-size="8" font-weight="bold" text-anchor="middle" fill="#7e22ce">ROYAL PHNOM PENH</text>
    <text x="0" y="-1" font-family="sans-serif" font-size="11" font-weight="black" text-anchor="middle" fill="#7e22ce">MEDICALLY CLEARED</text>
    <text x="0" y="16" font-family="sans-serif" font-size="8" font-weight="bold" text-anchor="middle" fill="#7e22ce">JCI ACCREDITED</text>
    <text x="0" y="30" font-family="sans-serif" font-size="7" text-anchor="middle" fill="#7e22ce">20 JUN 2025</text>
  </g>

  <!-- Doctor Signature Block -->
  <g transform="translate(480, 805)">
    <text x="80" y="20" font-family="sans-serif" font-size="11" font-weight="bold" fill="#64748b">CONSULTANT PHYSICIAN:</text>
    <path d="M 40,55 Q 75,20 115,65 T 165,45 Q 195,80 225,50" fill="none" stroke="#581c87" stroke-width="2.5" stroke-linecap="round" />
    <line x1="20" y1="80" x2="240" y2="80" stroke="#cbd5e1" stroke-width="1" />
    <text x="130" y="100" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">Dr. Dara Meng, MD</text>
    <text x="130" y="117" font-family="sans-serif" font-size="11" text-anchor="middle" fill="#64748b">Head of Internal Medicine</text>
  </g>

  <rect x="40" y="990" width="720" height="25" fill="#f8fafc" />
  <text x="50" y="1007" font-family="monospace" font-size="10" fill="#64748b">RPPH DIGITAL MEDICAL RECORD • VERIFIED AUTHENTIC • SOKHAPHEAP DIGITAL</text>
</svg>
`)}`,

  // 4. Chest X-Ray Radiograph Imaging Scan (High contrast radiologic view)
  xrayRadiology: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1050" width="100%" height="100%">
  <!-- Dark Radiology Film Canvas -->
  <rect width="800" height="1050" fill="#090d16" />
  <rect x="25" y="25" width="750" height="1000" fill="#050811" stroke="#1e293b" stroke-width="2" rx="8" />

  <!-- Radiology Film Overlay Header -->
  <rect x="40" y="40" width="720" height="75" fill="#0f172a" rx="4" />
  <text x="60" y="68" font-family="monospace" font-size="16" font-weight="bold" fill="#38bdf8">KHMER-SOVIET FRIENDSHIP HOSPITAL • RADIOLOGY</text>
  <text x="60" y="92" font-family="monospace" font-size="12" fill="#94a3b8">PATIENT: MOLI KEO (27F) | ID: SKP-2026-8812 | STUDY: CXR PA VIEW | DATE: 14-AUG-2024</text>
  
  <text x="730" y="80" font-family="sans-serif" font-size="32" font-weight="black" fill="#e2e8f0" text-anchor="end">R</text>

  <!-- Simulated High-Fidelity Chest X-Ray Graphics -->
  <g transform="translate(100, 140)">
    <!-- Thoracic rib cage & spine shadows -->
    <!-- Spine column -->
    <rect x="285" y="30" width="30" height="480" fill="#334155" opacity="0.75" rx="4" />
    <line x1="300" y1="30" x2="300" y2="510" stroke="#cbd5e1" stroke-width="3" stroke-dasharray="12,6" opacity="0.8" />

    <!-- Clavicles (Collar bones) -->
    <path d="M 80,60 Q 200,85 285,75 M 520,60 Q 400,85 315,75" fill="none" stroke="#e2e8f0" stroke-width="14" stroke-linecap="round" opacity="0.85" />
    <path d="M 80,60 Q 200,85 285,75 M 520,60 Q 400,85 315,75" fill="none" stroke="#94a3b8" stroke-width="6" stroke-linecap="round" opacity="0.9" />

    <!-- Left & Right Ribs Arc Structures -->
    <!-- Rib 1 -->
    <path d="M 285,110 Q 150,115 110,180 Q 80,240 100,290" fill="none" stroke="#64748b" stroke-width="9" stroke-linecap="round" opacity="0.6" />
    <path d="M 315,110 Q 450,115 490,180 Q 520,240 500,290" fill="none" stroke="#64748b" stroke-width="9" stroke-linecap="round" opacity="0.6" />

    <!-- Rib 2 -->
    <path d="M 285,150 Q 140,165 95,230 Q 75,300 95,360" fill="none" stroke="#64748b" stroke-width="8" stroke-linecap="round" opacity="0.55" />
    <path d="M 315,150 Q 460,165 505,230 Q 525,300 505,360" fill="none" stroke="#64748b" stroke-width="8" stroke-linecap="round" opacity="0.55" />

    <!-- Rib 3 -->
    <path d="M 285,190 Q 130,220 90,290 Q 70,360 90,430" fill="none" stroke="#64748b" stroke-width="8" stroke-linecap="round" opacity="0.5" />
    <path d="M 315,190 Q 470,220 510,290 Q 530,360 510,430" fill="none" stroke="#64748b" stroke-width="8" stroke-linecap="round" opacity="0.5" />

    <!-- Rib 4 -->
    <path d="M 285,240 Q 125,270 85,350 Q 70,420 85,480" fill="none" stroke="#64748b" stroke-width="7" stroke-linecap="round" opacity="0.45" />
    <path d="M 315,240 Q 475,270 515,350 Q 530,420 515,480" fill="none" stroke="#64748b" stroke-width="7" stroke-linecap="round" opacity="0.45" />

    <!-- Lung Fields (Dark translucent airspace) -->
    <path d="M 120,80 Q 260,90 280,140 L 280,480 Q 180,510 100,480 Q 70,300 120,80 Z" fill="#030712" opacity="0.9" />
    <path d="M 480,80 Q 340,90 320,140 L 320,480 Q 420,510 500,480 Q 530,300 480,80 Z" fill="#030712" opacity="0.9" />

    <!-- Cardiac Silhouette (Heart shadow) -->
    <path d="M 270,240 Q 320,230 330,300 Q 360,400 410,450 Q 350,480 270,480 Q 230,460 240,360 Q 245,280 270,240 Z" fill="#475569" opacity="0.85" />
    <path d="M 270,270 Q 310,260 325,320 Q 345,410 390,445 Q 340,465 270,465 Z" fill="#94a3b8" opacity="0.75" />

    <!-- Diaphragm Domes -->
    <path d="M 80,490 Q 180,450 285,490" fill="none" stroke="#cbd5e1" stroke-width="8" stroke-linecap="round" opacity="0.8" />
    <path d="M 520,490 Q 420,450 315,490" fill="none" stroke="#cbd5e1" stroke-width="8" stroke-linecap="round" opacity="0.8" />

    <!-- Vascular lung markings -->
    <path d="M 250,220 Q 180,240 140,280 M 260,260 Q 190,300 150,340 M 350,220 Q 420,240 460,280 M 340,260 Q 410,300 450,340" fill="none" stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round" opacity="0.4" />
  </g>

  <!-- Radiology Report Strip -->
  <g transform="translate(45, 720)">
    <rect x="0" y="0" width="710" height="240" fill="#0f172a" stroke="#334155" rx="6" />
    <text x="20" y="30" font-family="sans-serif" font-size="14" font-weight="bold" fill="#38bdf8">RADIOLOGICAL REPORT &amp; CLINICAL FINDINGS</text>
    
    <text x="20" y="60" font-family="sans-serif" font-size="12" fill="#e2e8f0">• Examination: Posteroanterior (PA) view of the chest</text>
    <text x="20" y="85" font-family="sans-serif" font-size="12" fill="#cbd5e1">• Lungs: Clear lung fields without focal consolidation, pleural effusion, or pneumothorax.</text>
    <text x="20" y="110" font-family="sans-serif" font-size="12" fill="#cbd5e1">• Heart: Cardiothoracic ratio is within normal limits (CTR &lt; 0.48).</text>
    <text x="20" y="135" font-family="sans-serif" font-size="12" fill="#cbd5e1">• Costophrenic Angles &amp; Diaphragm: Both sharp and clear bilaterally.</text>
    <text x="20" y="160" font-family="sans-serif" font-size="12" fill="#cbd5e1">• Bony Thorax: Ribs, clavicles, and visualized vertebrae are intact with no acute fracture.</text>
    
    <line x1="20" y1="180" x2="690" y2="180" stroke="#1e293b" stroke-width="1" />
    <text x="20" y="205" font-family="sans-serif" font-size="13" font-weight="bold" fill="#4ade80">IMPRESSION: Normal and unremarkable PA chest radiograph. No active cardiopulmonary lesion.</text>
    <text x="690" y="225" font-family="sans-serif" font-size="11" fill="#94a3b8" text-anchor="end">Signed: Dr. Heng Buntheun, Consultant Radiologist</text>
  </g>

  <!-- Bottom Scan Metadata -->
  <rect x="40" y="990" width="720" height="25" fill="#090d16" />
  <text x="50" y="1007" font-family="monospace" font-size="10" fill="#64748b">DICOM/PACS INTEGRATED ARCHIVE • KS-HOSPITAL • REF: CXR-20240814-PA</text>
</svg>
`)}`
};
