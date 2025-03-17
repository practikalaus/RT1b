export const boxedDamageRecordsTemplate = {
  name: "Boxed Damage Records Template",
  content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    /* Cover page styles */
    .cover-page {
      position: relative;
      height: 297mm; /* A4 height */
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
      color: white;
      page-break-after: always;
      overflow: hidden;
    }

    .cover-header {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 120px;
      background: linear-gradient(90deg, #ffffff 0%, #f8fafc 100%);
      clip-path: polygon(0 0, 100% 0, 100% 70%, 0% 100%);
    }

    .cover-header-accent {
      position: absolute;
      top: 0;
      right: 0;
      width: 35%;
      height: 120px;
      background: #fb923c;
      clip-path: polygon(30% 0, 100% 0, 100% 100%, 0% 100%);
    }

    .cover-content {
      position: relative;
      z-index: 3;
      padding: 40px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .cover-logo {
      width: 200px;
      height: auto;
      margin: 40px;
    }

    .cover-title {
      font-size: 64px;
      font-weight: 700;
      margin: auto 0;
      padding: 0 40px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .cover-image {
      position: absolute;
      right: 40px;
      top: 50%;
      transform: translateY(-50%);
      width: 400px;
      height: 400px;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    }

    .cover-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .cover-footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(90deg, #fb923c 0%, #f97316 100%);
      padding: 20px 40px;
      clip-path: polygon(0 30%, 100% 0, 100% 100%, 0 100%);
      height: 100px;
      display: flex;
      align-items: flex-end;
    }

    .cover-contact {
      color: white;
      font-size: 14px;
      margin-bottom: 10px;
    }

    .cover-contact a {
      color: white;
      text-decoration: none;
    }

    /* Rest of the existing styles */
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      max-width: 210mm; /* A4 width */
      margin: 0 auto;
      padding: 20mm;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 20px;
    }

    .header img {
      max-width: 200px;
      height: auto;
      margin-bottom: 20px;
    }

    .header h1 {
      color: #2563eb;
      margin: 0 0 10px;
      font-size: 28px;
    }

    .meta {
      color: #64748b;
      margin-top: 1rem;
    }

    .section {
      margin-bottom: 30px;
    }

    .section h2 {
      color: #2563eb;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 8px;
      margin-bottom: 16px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }

    th, td {
      padding: 12px;
      border: 1px solid #e2e8f0;
      text-align: left;
    }

    th {
      background-color: #f8fafc;
      font-weight: 500;
      width: 30%;
    }

    .damage-record {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }

    .damage-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .damage-header-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .damage-header-content h3 {
      margin: 0;
      color: #1e293b;
      font-size: 18px;
    }

    .reference-number {
      font-size: 0.875rem;
      color: #64748b;
      font-family: monospace;
    }

    .risk-badge {
      font-size: 14px;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 500;
    }

    .risk-badge.red { background: #fee2e2; color: #dc2626; }
    .risk-badge.amber { background: #fef3c7; color: #d97706; }
    .risk-badge.green { background: #d1fae5; color: #059669; }

    .damage-photo {
      margin-top: 12px;
      text-align: center;
    }

    .damage-photo img {
      max-width: 100%;
      height: auto;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      background-color: #f8fafc;
    }

    .classification-section {
      margin: 40px 0;
      padding: 20px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .classification-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }

    .classification-table th,
    .classification-table td {
      padding: 12px;
      border: 1px solid #e2e8f0;
      text-align: left;
    }

    .classification-table th {
      background-color: #f8fafc;
      font-weight: 500;
    }

    .risk-red {
      color: #dc2626;
      font-weight: 600;
    }

    .risk-amber {
      color: #d97706;
      font-weight: 600;
    }

    .risk-green {
      color: #059669;
      font-weight: 600;
    }

    .closing-section {
      margin-top: 40px;
      padding: 20px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .signature-section {
      margin-top: 30px;
    }

    .auditor-details {
      margin-top: 20px;
    }

    .auditor-details p {
      margin: 5px 0;
    }

    @media print {
      body { 
        margin: 0;
        padding: 20mm;
      }

      .cover-page {
        background: #1e3a8a !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .cover-header {
        background: #ffffff !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .cover-header-accent {
        background: #fb923c !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .cover-footer {
        background: #fb923c !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .header h1 { 
        color: #2563eb !important;
      }
      
      .section h2 { 
        color: #2563eb !important;
      }

      .damage-record {
        break-inside: avoid;
      }

      .classification-section,
      .closing-section {
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover-page">
    <div class="cover-header">
      <div class="cover-header-accent"></div>
    </div>
    <div class="cover-content">
      <img src="/assets/images/logo1.png" alt="DMD Storage Group" class="cover-logo">
      <h1 class="cover-title">AUDIT REPORT</h1>
      <div class="cover-image">
        <img src="https://i.ibb.co/Qj9Nt9L/rack-inspection.jpg" alt="Rack Inspection">
      </div>
    </div>
    <div class="cover-footer">
      <div class="cover-contact">
        6 Renewable Chase Bibra Lake WA 6163 | 9410 9400 | 
        <a href="mailto:sales@dmd.com.au">sales@dmd.com.au</a> | 
        <a href="https://dmd.com.au">dmd.com.au</a>
      </div>
    </div>
  </div>

  <!-- Report Content -->
  <div class="header">
    <img src="/assets/images/logo1.png" alt="Company Logo">
    <h1>Rack Audit Report</h1>
    <div class="meta">
      <p><strong>Reference:</strong> {{reference_number}}</p>
      <p><strong>Date:</strong> {{audit_date}}</p>
      <p><strong>Auditor:</strong> {{auditor_name}}</p>
      {{#if auditor_email}}
      <p><strong>Email:</strong> {{auditor_email}}</p>
      {{/if}}
      {{#if auditor_phone}}
      <p><strong>Phone:</strong> {{auditor_phone}}</p>
      {{/if}}
    </div>
  </div>

  <div class="section">
    <h2>Site Information</h2>
    <table>
      <tr>
        <th>Site Name</th>
        <td>{{site_name}}</td>
      </tr>
      <tr>
        <th>Company</th>
        <td>{{company_name}}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <h2>Audit Summary</h2>
    <table>
      <tr>
        <th>Red Risks</th>
        <td>{{red_risks}}</td>
      </tr>
      <tr>
        <th>Amber Risks</th>
        <td>{{amber_risks}}</td>
      </tr>
      <tr>
        <th>Green Risks</th>
        <td>{{green_risks}}</td>
      </tr>
    </table>
    
    {{#if notes}}
    <div class="audit-notes">
      <h3>Audit Notes</h3>
      <p>{{notes}}</p>
    </div>
    {{/if}}
  </div>

  <div class="classification-section">
    <h2>Damage Classification Overview</h2>
    <p>Based on Australian Standard AS 4084-2012: Steel Storage Racking, the damage observed during the inspection has been categorised as follows:</p>
    
    <table class="classification-table">
      <tr>
        <th>Risk Level</th>
        <th>Description</th>
        <th>Actions Required</th>
      </tr>
      <tr>
        <td class="risk-red">Critical Damage<br>DANGER / RED RISK</td>
        <td>Damage exceeds limits by more than 2x; poses immediate risk to safety.</td>
        <td>Unload and isolate damaged sections immediately. Repairs must be completed before resuming use.</td>
      </tr>
      <tr>
        <td class="risk-amber">Hazardous Damage<br>CAUTION / ORANGE RISK</td>
        <td>Damage exceeds permissible limits up to 2x; safety is compromised but not critical.</td>
        <td>Mark and isolate the section. Complete repairs before reloading the racking.</td>
      </tr>
      <tr>
        <td class="risk-green">Acceptable Damage<br>CAREFUL / GREEN RISK</td>
        <td>Damage is within permissible limits and poses no immediate risk to safety.</td>
        <td>No immediate action required, but continued monitoring and preventive maintenance are recommended.</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <h2>Identified Issues & Recommendations</h2>
    {{#each damage_records}}
    <div class="damage-record">
      <div class="damage-header">
        <div class="damage-header-content">
          <h3>{{damage_type}}</h3>
          <span class="reference-number">{{reference_number}}</span>
        </div>
        <span class="risk-badge {{risk_level}}">{{risk_level}}</span>
      </div>
      <table>
        <tr>
          <th>Location</th>
          <td>{{location_details}}</td>
        </tr>
        {{#if building_area}}
        <tr>
          <th>Building/Area</th>
          <td>{{building_area}}</td>
        </tr>
        {{/if}}
        <tr>
          <th>Brand</th>
          <td>{{brand}}</td>
        </tr>
        <tr>
          <th>Recommendation</th>
          <td>{{recommendation}}</td>
        </tr>
        {{#if notes}}
        <tr>
          <th>Notes</th>
          <td>{{notes}}</td>
        </tr>
        {{/if}}
      </table>
      {{#if photo_url}}
      <div class="damage-photo">
        <img src="{{photo_url}}" alt="Damage Photo">
      </div>
      {{/if}}
    </div>
    {{/each}}
  </div>

  <div class="closing-section">
    <h2>Closing Statement</h2>
    
    <p>We trust that you will carefully consider the issues and recommendations outlined in this report. Your commitment to addressing these findings demonstrates your dedication to maintaining a safe and compliant workplace.</p>
    
    <p>At DMD Storage Group, we appreciate your knowledge and understanding of the importance of workplace safety and compliance. Please note that it is the responsibility of {{company_name}} to ensure that all findings and recommendations are acted upon within the stipulated time frames to uphold the safety and structural integrity of your racking systems.</p>
    
    <p>Whilst the highest level of care has been taken to ensure the accuracy of the information provided, the report is supplied on the understanding that DMD Storage Group shall under no circumstances be liable for any injuries, expenses or other losses which may in any way be attributed to the use or adoption of such information.</p>
    
    <p>Thank you once again for entrusting DMD Storage Group with your annual racking inspection. Should you have any questions or require further clarification, please do not hesitate to contact us. We look forward to assisting you in maintaining a safe and efficient workplace.</p>
    
    <p>Any further queries please do not hesitate to contact me.</p>
    
    <div class="signature-section">
      <p>Regards,</p>
      <div class="auditor-details">
        <p class="auditor-title">{{auditor_name}}</p>
        <p>Rack Auditor</p>
        {{#if auditor_email}}
        <p class="contact-details">Email: {{auditor_email}}</p>
        {{/if}}
        {{#if auditor_phone}}
        <p class="contact-details">Mobile: {{auditor_phone}}</p>
        {{/if}}
      </div>
    </div>
  </div>

  <div class="appendix">
    <h2>Appendix</h2>
    
    <h3>Referenced Material:</h3>
    <ul>
      <li>Australian Standard AS 4084.1.2023 & AS 4084.2.2023</li>
      <li>Australian Standard AS 4084.2012</li>
      <li>Australian Standard AS 4084.1993</li>
    </ul>
  </div>
</body>
</html>`
};
