import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import DOMPurify from 'dompurify';
import { printHTMLContent } from '../../utils/printUtils';
import './styles.css';
import { useSettings } from '../../contexts/SettingsContext';
import { boxedDamageRecordsTemplate } from '../QuoteTemplates/templates/boxedDamageRecordsTemplate';
import { imageToBase64 } from '../../utils/assetPaths';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType } from 'docx';

const PrintableAudit = ({ audit, damageRecords, onClose, auditorDetails }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(boxedDamageRecordsTemplate);
  const [processedContent, setProcessedContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();
  const [localPrices, setLocalPrices] = useState({});

  useEffect(() => {
    if (settings?.damagePrices) {
      setLocalPrices(settings.damagePrices);
    }
  }, [settings]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('templates')
          .select('*')
          .eq('hidden', false)
          .order('name');

        if (error) throw error;

        const allTemplates = [boxedDamageRecordsTemplate];

        if (data?.length) {
          allTemplates.push(...data);
        }

        setTemplates(allTemplates);
        setSelectedTemplate(boxedDamageRecordsTemplate);
      } catch (error) {
        console.error('Error fetching templates:', error);
        setTemplates([boxedDamageRecordsTemplate]);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const processDamageRecord = async (record) => {
    let recordTemplate = selectedTemplate.content.match(/{{#each damage_records}}([\s\S]*?){{\/each}}/)[1];

    const recordFields = {
      damage_type: record.damage_type,
      risk_level: record.risk_level,
      location_details: record.location_details,
      building_area: record.building_area || '',
      recommendation: record.recommendation,
      notes: record.notes || '',
      reference_number: record.reference_number || 'Not assigned',
      brand: record.brand || 'Not specified',
      price: localPrices[record.damage_type] || 0
    };

    Object.entries(recordFields).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      recordTemplate = recordTemplate.replace(regex, value);
    });

    if (record.photo_url) {
      try {
        const response = await fetch(record.photo_url);
        const blob = await response.blob();
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        recordTemplate = recordTemplate.replace(
          /{{#if photo_url}}([\s\S]*?){{\/if}}/g,
          `<div class="damage-photo"><img src="${base64}" alt="Damage" style="width: 300px; height: 225px; object-fit: contain; border: 1px solid #e2e8f0; border-radius: 4px; background-color: #f8fafc; margin: 10px auto; display: block;" /></div>`
        );
      } catch (error) {
        console.error('Error fetching or converting image:', error);
        recordTemplate = recordTemplate.replace(
          /{{#if photo_url}}[\s\S]*?{{\/if}}/g,
          ''
        );
      }
    } else {
      recordTemplate = recordTemplate.replace(
        /{{#if photo_url}}[\s\S]*?{{\/if}}/g,
        ''
      );
    }

    if (record.notes) {
      recordTemplate = recordTemplate.replace(
        /{{#if notes}}([\s\S]*?){{\/if}}/g,
        (_, content) => content.replace(/{{notes}}/g, record.notes)
      );
    } else {
      recordTemplate = recordTemplate.replace(
        /{{#if notes}}[\s\S]*?{{\/if}}/g,
        ''
      );
    }

    if (record.building_area) {
      recordTemplate = recordTemplate.replace(
        /{{#if building_area}}([\s\S]*?){{\/if}}/g,
        (_, content) => content.replace(/{{building_area}}/g, record.building_area)
      );
    } else {
      recordTemplate = recordTemplate.replace(
        /{{#if building_area}}[\s\S]*?{{\/if}}/g,
        ''
      );
    }

    return recordTemplate;
  };

  useEffect(() => {
    const processTemplate = async () => {
      if (!selectedTemplate || !audit) return;

      try {
        let content = selectedTemplate.content;

        try {
          const logoUrl = new URL('/assets/images/logo1.png', window.location.origin);
          const logoBase64 = await imageToBase64(logoUrl);
          if (logoBase64) {
            content = content.replace(/src="\/assets\/images\/logo1\.png"/g, `src="${logoBase64}"`);
          }
        } catch (error) {
          console.error('Error converting logo to base64:', error);
        }

        const auditFields = {
          reference_number: audit.reference_number,
          audit_date: new Date(audit.audit_date).toLocaleDateString(),
          auditor_name: audit.auditor_name,
          auditor_email: auditorDetails?.email || '',
          auditor_phone: auditorDetails?.phone || '',
          site_name: audit.site_name,
          company_name: audit.company_name,
          red_risks: audit.red_risks || 0,
          amber_risks: audit.amber_risks || 0,
          green_risks: audit.green_risks || 0,
          notes: audit.notes || ''
        };

        Object.entries(auditFields).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          content = content.replace(regex, value);
        });

        if (auditorDetails?.email) {
          content = content.replace(
            /{{#if auditor_email}}([\s\S]*?){{\/if}}/g,
            (_, innerContent) => innerContent.replace(/{{auditor_email}}/g, auditorDetails.email)
          );
        } else {
          content = content.replace(/{{#if auditor_email}}[\s\S]*?{{\/if}}/g, '');
        }

        if (auditorDetails?.phone) {
          content = content.replace(
            /{{#if auditor_phone}}([\s\S]*?){{\/if}}/g,
            (_, innerContent) => innerContent.replace(/{{auditor_phone}}/g, auditorDetails.phone)
          );
        } else {
          content = content.replace(/{{#if auditor_phone}}[\s\S]*?{{\/if}}/g, '');
        }

        if (content.includes('{{#each damage_records}}')) {
          let damageContent = '';
          const processedRecords = await Promise.all(damageRecords.map(processDamageRecord));
          damageContent = processedRecords.join('');

          content = content.replace(
            /{{#each damage_records}}[\s\S]*?{{\/each}}/,
            damageContent
          );
        }

        if (audit.notes) {
          content = content.replace(
            /{{#if notes}}([\s\S]*?){{\/if}}/g,
            (_, innerContent) => innerContent.replace(/{{notes}}/g, audit.notes)
          );
        } else {
          content = content.replace(/{{#if notes}}[\s\S]*?{{\/if}}/g, '');
        }

        content = content.replace(/{{#if\s+.*?}}.*?{{\/if}}/gs, '');
        content = content.replace(/{{.*?}}/g, '');

        const sanitizedContent = DOMPurify.sanitize(content);
        setProcessedContent(sanitizedContent);
      } catch (error) {
        console.error('Error processing template:', error);
        setProcessedContent('<div class="error">Error processing template</div>');
      }
    };

    processTemplate();
  }, [selectedTemplate, audit, damageRecords, settings, auditorDetails]);

  const handleDownload = async () => {
    if (!processedContent || !audit) return;
  
    const date = new Date(audit.audit_date);
    const formattedDate = `${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
    const filename = `${formattedDate}-${audit.company_name.replace(/[^a-zA-Z0-9]/g, '')}.pdf`;
  
    // Extract and combine CSS styles
    let combinedStyles = '';
    const styleSheets = document.styleSheets;
    for (let i = 0; i < styleSheets.length; i++) {
      try {
        const rules = styleSheets[i].cssRules || styleSheets[i].rules; // For cross-browser compatibility
        if (rules) {
          for (let j = 0; j < rules.length; j++) {
            combinedStyles += rules[j].cssText + '\n';
          }
        }
      } catch (e) {
        // Skip cross-origin stylesheets and other errors
        if (e.name !== 'SecurityError') {
          console.error("Error reading stylesheet:", e);
        }
        continue;
      }
    }
  
    try {
      printHTMLContent(`<style>${combinedStyles}</style>${processedContent}`, filename, combinedStyles);
    } catch (error) {
       console.error('Error generating print preview:', error);
      alert('Failed to open print preview. Please try again.');
    }
  };
  

  const handleExportWord = async () => {
    if (!audit) return;

    const date = new Date(audit.audit_date);
    const formattedDate = `${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
    const filename = `${formattedDate}-${audit.company_name.replace(/[^a-zA-Z0-9]/g, '')}.docx`;

    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Rack Audit Report",
                  bold: true,
                  size: 36,
                  font: "Calibri",
                }),
              ],
              spacing: {
                after: 400,
              },
            }),
            new Paragraph({
              children: [
                new TextRun(`Reference: ${audit.reference_number}`),
                new TextRun({
                  text: `Date: ${new Date(audit.audit_date).toLocaleDateString()}`,
                  break: 1,
                }),
                new TextRun({
                  text: `Auditor: ${audit.auditor_name}`,
                  break: 1,
                }),
                auditorDetails?.email ? new TextRun({ text: `Email: ${auditorDetails.email}`, break: 1 }) : undefined,
                auditorDetails?.phone ? new TextRun({ text: `Phone: ${auditorDetails.phone}`, break: 1 }) : undefined,
              ].filter(Boolean),
              spacing: {
                after: 200,
              },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Site Information",
                  bold: true,
                  size: 28,
                  font: 'Calibri'
                }),
              ],
              spacing: {
                after: 200,
              },
            }),
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph("Site Name")],
                      width: { size: 30, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph(audit.site_name)],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph("Company")],
                    }),
                    new TableCell({
                      children: [new Paragraph(audit.company_name)],
                    }),
                  ],
                }),
              ],
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);

      alert("Due to WebContainer limitations, automatic Word document download isn't possible.  Please use a different environment for this feature.");

    } catch (error) {
      console.error('Error exporting to Word:', error);
      alert('Failed to export to Word. Please try again.');
    }
  };


  if (loading) {
    return <div className="loading">Loading templates...</div>;
  }

  return (
    <div className="print-preview">
      <div className="preview-header no-print">
        <div className="preview-controls">
          <h2>Print Preview</h2>
          <div className="template-selector">
            <label>Select Template:</label>
            <select
              value={selectedTemplate?.id || 'boxed'}
              onChange={(e) => {
                const template = templates.find(t => t.id === e.target.value);
                setSelectedTemplate(template || boxedDamageRecordsTemplate);
              }}
            >
              <option value="boxed">Boxed Damage Records (Default)</option>
              {templates.filter(t => t.id).map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="preview-actions">
          <button
            onClick={handleDownload}
            className="print-btn"
            disabled={!processedContent}
          >
            Download PDF
          </button>
          <button
            onClick={handleExportWord}
            className="export-word-btn"
            disabled={!processedContent}
          >
            Export to Word
          </button>
          <button onClick={onClose} className="close-btn">
            Close Preview
          </button>
        </div>
      </div>

      <div className="preview-container">
        {processedContent ? (
          <div
            className="printable-content"
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        ) : (
          <div className="no-preview">
            {templates.length ?
              'Processing template...' :
              'No templates available. Please create a template first.'
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintableAudit;
