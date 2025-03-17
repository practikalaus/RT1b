import React, { useState } from 'react';
import TemplateList from './TemplateList';
import TemplateForm from './TemplateForm';
import { useTemplates } from './useTemplates';
import { useTemplateVisibility } from './hooks/useTemplateVisibility';
import './styles.css';

const TemplateEditor = () => {
  const { 
    templates, 
    selectedTemplate,
    setSelectedTemplate,
    saveTemplate,
    copyTemplate,
    deleteTemplate,
    uploadTemplate,
    handleTemplateUpdate,
    loading
  } = useTemplates();

  const { toggleVisibility } = useTemplateVisibility(handleTemplateUpdate);
  const [activeTab, setActiveTab] = useState('templates');

  if (loading) {
    return <div className="loading">Loading templates...</div>;
  }

  return (
    <div className="template-editor">
      <h1>Report Templates</h1>
      
      <div className="template-tabs">
        <button 
          className={activeTab === 'templates' ? 'active' : ''}
          onClick={() => setActiveTab('templates')}
        >
          Templates
        </button>
        <button 
          className={activeTab === 'variables' ? 'active' : ''}
          onClick={() => setActiveTab('variables')}
        >
          Available Variables
        </button>
      </div>
      
      {activeTab === 'templates' ? (
        <div className="template-container">
          <TemplateList 
            templates={templates}
            selectedTemplate={selectedTemplate}
            onSelect={setSelectedTemplate}
            onCopy={copyTemplate}
            onDelete={deleteTemplate}
            onUpload={uploadTemplate}
            onToggleVisibility={toggleVisibility}
          />
          
          {selectedTemplate && (
            <TemplateForm 
              template={selectedTemplate}
              onSave={saveTemplate}
            />
          )}
        </div>
      ) : (
        <div className="variables-reference">
          <h2>Available Template Variables</h2>
          
          <div className="variable-section">
            <h3>Audit Information</h3>
            <ul className="variable-list">
              <li><code>{"{{reference_number}}"}</code> - Audit reference number</li>
              <li><code>{"{{audit_date}}"}</code> - Date of audit</li>
              <li><code>{"{{auditor_name}}"}</code> - Name of auditor</li>
              <li><code>{"{{auditor_email}}"}</code> - Email of auditor</li>
              <li><code>{"{{auditor_phone}}"}</code> - Phone number of auditor</li>
              <li><code>{"{{site_name}}"}</code> - Site name</li>
              <li><code>{"{{company_name}}"}</code> - Company name</li>
              <li><code>{"{{address}}"}</code> - Site address</li>
              <li><code>{"{{contact_person}}"}</code> - Contact person name</li>
              <li><code>{"{{contact_email}}"}</code> - Contact email</li>
              <li><code>{"{{contact_phone}}"}</code> - Contact phone number</li>
              <li><code>{"{{notes}}"}</code> - Audit notes</li>
            </ul>
          </div>
          
          <div className="variable-section">
            <h3>Risk Summary</h3>
            <ul className="variable-list">
              <li><code>{"{{red_risks}}"}</code> - Number of red risks</li>
              <li><code>{"{{amber_risks}}"}</code> - Number of amber risks</li>
              <li><code>{"{{green_risks}}"}</code> - Number of green risks</li>
              <li><code>{"{{total_racks}}"}</code> - Total racks inspected</li>
              <li><code>{"{{total_damages}}"}</code> - Total damage records</li>
              <li><code>{"{{compliance_rating}}"}</code> - Compliance rating percentage</li>
              <li><code>{"{{next_audit_due}}"}</code> - Next audit due date</li>
            </ul>
          </div>
          
          <div className="variable-section">
            <h3>Damage Records (Inside Loop)</h3>
            <p>Use these variables inside the <code>{"{{#each damage_records}}...{{/each}}"}</code> loop:</p>
            <ul className="variable-list">
              <li><code>{"{{reference_number}}"}</code> - Damage record reference number</li>
              <li><code>{"{{damage_type}}"}</code> - Type of damage</li>
              <li><code>{"{{risk_level}}"}</code> - Risk level (RED/AMBER/GREEN)</li>
              <li><code>{"{{location_details}}"}</code> - Location details</li>
              <li><code>{"{{building_area}}"}</code> - Building/Area name</li>
              <li><code>{"{{brand}}"}</code> - Rack brand</li>
              <li><code>{"{{recommendation}}"}</code> - Recommended action</li>
              <li><code>{"{{notes}}"}</code> - Additional notes</li>
              <li><code>{"{{photo_url}}"}</code> - URL of damage photo</li>
              <li><code>{"{{product_cost}}"}</code> - Materials cost</li>
              <li><code>{"{{installation_cost}}"}</code> - Installation cost</li>
              <li><code>{"{{total_cost}}"}</code> - Total cost for this item</li>
            </ul>
          </div>
          
          <div className="variable-section">
            <h3>Pricing Summary</h3>
            <ul className="variable-list">
              <li><code>{"{{totalMaterialsCost}}"}</code> - Total materials cost</li>
              <li><code>{"{{totalInstallationCost}}"}</code> - Total installation cost</li>
              <li><code>{"{{subtotal}}"}</code> - Subtotal (excl. GST)</li>
              <li><code>{"{{gst}}"}</code> - GST amount</li>
              <li><code>{"{{totalWithGst}}"}</code> - Total including GST</li>
            </ul>
          </div>
          
          <div className="variable-section">
            <h3>Conditional Blocks</h3>
            <p>Use these to conditionally show content:</p>
            <ul className="variable-list">
              <li><code>{"{{#if notes}}...{{/if}}"}</code> - Show content if notes exist</li>
              <li><code>{"{{#if photo_url}}...{{/if}}"}</code> - Show content if photo exists</li>
              <li><code>{"{{#if building_area}}...{{/if}}"}</code> - Show content if building/area is specified</li>
              <li><code>{"{{#if auditor_email}}...{{/if}}"}</code> - Show content if auditor email exists</li>
              <li><code>{"{{#if auditor_phone}}...{{/if}}"}</code> - Show content if auditor phone exists</li>
            </ul>
          </div>
          
          <div className="variable-section">
            <h3>Loop Blocks</h3>
            <p>Use this to iterate through damage records:</p>
            <pre><code>{"{{#each damage_records}}\n  // Content for each damage record\n  // Use damage record variables here\n{{/each}}"}</code></pre>
          </div>

          <div className="variable-section">
            <h3>Example Usage</h3>
            <pre><code>{`{{#each damage_records}}
  <div class="damage-record">
    <h3>{{damage_type}}</h3>
    <p>Location: {{location_details}}</p>
    {{#if building_area}}
      <p>Building/Area: {{building_area}}</p>
    {{/if}}
    <p>Risk Level: {{risk_level}}</p>
    {{#if photo_url}}
      <img src="{{photo_url}}" alt="Damage Photo">
    {{/if}}
  </div>
{{/each}}`}</code></pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateEditor;
