export const processVariables = (content, fields) => {
  let processedContent = content;

  // Process damage records first to calculate totals
  if (content.includes('{{#each damage_records}}')) {
    let totalMaterialsCost = 0;
    let totalInstallationCost = 0;
    
    const records = fields.damage_records || [];
    let damageContent = '';
    
    records.forEach(record => {
      let recordTemplate = content.match(/{{#each damage_records}}([\s\S]*?){{\/each}}/)[1];
      
      // Get costs from brand prices
      const productCost = parseFloat(record.product_cost) || 0;
      const installationCost = parseFloat(record.installation_cost) || 0;
      const totalCost = productCost + installationCost;
      
      totalMaterialsCost += productCost;
      totalInstallationCost += installationCost;

      // Replace record fields
      const recordFields = {
        reference_number: record.reference_number || 'Not assigned',
        damage_type: record.damage_type || '',
        risk_level: record.risk_level?.toLowerCase() || '',
        location_details: record.location_details || '',
        building_area: record.building_area || '',
        brand: record.brand || 'Not specified',
        recommendation: record.recommendation || '',
        notes: record.notes || '',
        photo_url: record.photo_url || '',
        product_cost: productCost.toFixed(2),
        installation_cost: installationCost.toFixed(2),
        total_cost: totalCost.toFixed(2)
      };

      // Replace all fields in the record template
      Object.entries(recordFields).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        recordTemplate = recordTemplate.replace(regex, value);
      });

      // Process photo conditional
      if (record.photo_url) {
        recordTemplate = recordTemplate.replace(
          /{{#if photo_url}}([\s\S]*?){{\/if}}/g,
          `<div class="damage-photo"><img src="${record.photo_url}" alt="Damage Photo" style="width: 300px; height: 225px; object-fit: contain; border: 1px solid #e2e8f0; border-radius: 4px; background-color: #f8fafc; margin: 10px auto; display: block;" /></div>`
        );
      } else {
        recordTemplate = recordTemplate.replace(/{{#if photo_url}}[\s\S]*?{{\/if}}/g, '');
      }

      // Process notes conditional
      if (record.notes) {
        recordTemplate = recordTemplate.replace(
          /{{#if notes}}([\s\S]*?){{\/if}}/g,
          (_, content) => content.replace(/{{notes}}/g, record.notes)
        );
      } else {
        recordTemplate = recordTemplate.replace(/{{#if notes}}[\s\S]*?{{\/if}}/g, '');
      }

      damageContent += recordTemplate;
    });

    // Calculate totals
    const subtotal = totalMaterialsCost + totalInstallationCost;
    const gst = subtotal * 0.1;
    const totalWithGst = subtotal + gst;

    // Replace damage records section
    processedContent = processedContent.replace(
      /{{#each damage_records}}[\s\S]*?{{\/each}}/,
      damageContent
    );

    // Replace total fields
    processedContent = processedContent.replace(/{{totalMaterialsCost}}/g, totalMaterialsCost.toFixed(2));
    processedContent = processedContent.replace(/{{totalInstallationCost}}/g, totalInstallationCost.toFixed(2));
    processedContent = processedContent.replace(/{{subtotal}}/g, subtotal.toFixed(2));
    processedContent = processedContent.replace(/{{gst}}/g, gst.toFixed(2));
    processedContent = processedContent.replace(/{{totalWithGst}}/g, totalWithGst.toFixed(2));
    
    // Add calculated fields
    processedContent = processedContent.replace(/{{total_damages}}/g, records.length.toString());
    
    // Calculate compliance rating (if not provided)
    if (!fields.compliance_rating && records.length > 0) {
      const totalIssues = records.length;
      const redWeight = 3; // Red issues count 3x
      const amberWeight = 2; // Amber issues count 2x
      const greenWeight = 1; // Green issues count 1x
      
      const redCount = records.filter(r => r.risk_level?.toLowerCase() === 'red').length;
      const amberCount = records.filter(r => r.risk_level?.toLowerCase() === 'amber').length;
      const greenCount = records.filter(r => r.risk_level?.toLowerCase() === 'green').length;
      
      const weightedIssues = (redCount * redWeight) + (amberCount * amberWeight) + (greenCount * greenWeight);
      const maxPossibleScore = totalIssues * redWeight; // Worst case: all issues are red
      
      // Higher score = worse condition, so we invert for compliance rating
      const complianceRating = Math.round(100 - ((weightedIssues / maxPossibleScore) * 100));
      
      processedContent = processedContent.replace(/{{compliance_rating}}/g, complianceRating.toString());
    }
  }

  // Replace other fields
  Object.entries(fields).forEach(([key, field]) => {
    if (key === 'damage_records') return; // Skip damage records as they're already processed
    
    const value = field?.value || field || '';
    const regex = new RegExp(`{{${key}}}`, 'g');
    processedContent = processedContent.replace(regex, value);
  });

  // Set default values for missing fields
  processedContent = processedContent.replace(/{{total_racks}}/g, '0');
  processedContent = processedContent.replace(/{{compliance_rating}}/g, '100');
  processedContent = processedContent.replace(/{{next_audit_due}}/g, '');
  processedContent = processedContent.replace(/{{address}}/g, '');
  processedContent = processedContent.replace(/{{contact_person}}/g, '');
  processedContent = processedContent.replace(/{{contact_email}}/g, '');
  processedContent = processedContent.replace(/{{contact_phone}}/g, '');
  processedContent = processedContent.replace(/{{auditor_email}}/g, '');
  processedContent = processedContent.replace(/{{auditor_phone}}/g, '');

  return processedContent;
};
