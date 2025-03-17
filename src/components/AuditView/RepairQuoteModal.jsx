import React, { useState, useEffect } from 'react';
import './styles.css';
import { supabase } from '../../supabase';
import { processTemplate } from '../../utils/templateProcessor';
import { generatePDF } from '../QuoteTemplates/utils/pdfGenerator';
import { imageToBase64 } from '../../utils/assetPaths';

const RepairQuoteModal = ({ audit, damageRecords, auditorDetails, onClose }) => {
  const [processedContent, setProcessedContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [brandPrices, setBrandPrices] = useState({});

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from('templates')
          .select('*')
          .eq('hidden', false)
          .order('name');

        if (error) {
          console.error('Error fetching templates:', error);
          setTemplates([]);
          return;
        }
        
        setTemplates(data || []);
        if (data && data.length > 0) {
          setSelectedTemplate(data[0]);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
        setTemplates([]);
      }
    };

    const fetchBrandPrices = async () => {
      try {
        // Get unique brands from damage records
        const brands = [...new Set(damageRecords.map(record => record.brand))];
        
        if (brands.length === 0) {
          setBrandPrices({});
          return;
        }
        
        // Fetch prices for all brands
        const { data: brandsData, error: brandsError } = await supabase
          .from('brands')
          .select('id, name')
          .in('name', brands);

        if (brandsError) {
          console.error('Error fetching brands:', brandsError);
          setBrandPrices({});
          return;
        }

        // Create a map of brand names to IDs
        const brandMap = {};
        brandsData.forEach(brand => {
          brandMap[brand.name] = brand.id;
        });

        // Fetch prices for all relevant brands and damage types
        const { data: pricesData, error: pricesError } = await supabase
          .from('brand_prices')
          .select('*')
          .in('brand_id', brandsData.map(b => b.id));

        if (pricesError) {
          console.error('Error fetching brand prices:', pricesError);
          setBrandPrices({});
          return;
        }

        // Create a lookup object for prices
        const prices = {};
        pricesData.forEach(price => {
          const brandName = brandsData.find(b => b.id === price.brand_id)?.name;
          if (brandName) {
            if (!prices[brandName]) {
              prices[brandName] = {};
            }
            prices[brandName][price.damage_type] = {
              product_cost: price.product_cost || 0,
              installation_cost: price.installation_cost || 0
            };
          }
        });

        setBrandPrices(prices);
      } catch (error) {
        console.error('Error fetching brand prices:', error);
        setBrandPrices({});
      }
    };

    fetchTemplates();
    fetchBrandPrices();
  }, [damageRecords]);

  useEffect(() => {
    const generateQuote = async () => {
      setLoading(true);
      try {
        if (!selectedTemplate) {
          setProcessedContent('<div class="no-preview">Select a template to preview the quote.</div>');
          setLoading(false);
          return;
        }

        // Process damage records with brand prices
        const processedRecords = damageRecords.map(record => {
          const prices = brandPrices[record.brand]?.[record.damage_type] || { product_cost: 0, installation_cost: 0 };
          return {
            ...record,
            product_cost: prices.product_cost,
            installation_cost: prices.installation_cost,
            total_cost: prices.product_cost + prices.installation_cost
          };
        });

        // Add auditor details to the audit object
        const auditWithDetails = {
          ...audit,
          auditor_email: auditorDetails?.email || '',
          auditor_phone: auditorDetails?.phone || ''
        };

        let content = await processTemplate(selectedTemplate, auditWithDetails, processedRecords);
        
        // Convert logo to base64 for PDF generation
        try {
          const logoUrl = new URL('/assets/images/logo1.png', window.location.origin);
          const logoBase64 = await imageToBase64(logoUrl);
          if (logoBase64) {
            content = content.replace(/src="\/assets\/images\/logo1\.png"/g, `src="${logoBase64}"`);
          }
        } catch (error) {
          console.error('Error converting logo to base64:', error);
        }

        // Add consistent image styling
        content = content.replace(
          /<img src="(.*?)" alt="Damage Photo">/g,
          '<img src="$1" alt="Damage Photo" style="width: 300px; height: 225px; object-fit: contain; border: 1px solid #e2e8f0; border-radius: 4px; background-color: #f8fafc; margin: 10px auto; display: block;">'
        );

        setProcessedContent(content);
      } catch (error) {
        console.error('Error generating repair quote:', error);
        setProcessedContent('<div class="error">Error generating repair quote.</div>');
      } finally {
        setLoading(false);
      }
    };

    generateQuote();
  }, [audit, damageRecords, selectedTemplate, brandPrices, auditorDetails]);

  const handleDownload = async () => {
    if (!processedContent || !audit) return;
    try {
      await generatePDF({
        content: processedContent,
        filename: `repair-quote-${audit.reference_number}.pdf`
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  if (loading) {
    return <div className="loading">Generating repair quote...</div>;
  }

  return (
    <div className="repair-quote-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Repair Quote</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="template-selector">
            <label>Select Template:</label>
            <select
              value={selectedTemplate?.id || ''}
              onChange={(e) => setSelectedTemplate(templates.find(t => t.id === e.target.value))}
            >
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
          {processedContent ? (
            <div dangerouslySetInnerHTML={{ __html: processedContent }} />
          ) : (
            <div className="no-preview">No repair quote available.</div>
          )}
        </div>
        <div className="modal-actions">
          <button onClick={handleDownload} className="print-btn" disabled={!processedContent}>
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default RepairQuoteModal;
