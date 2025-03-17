import React from 'react';
import TemplateUpload from './TemplateUpload';
import TemplateListItem from './components/TemplateListItem';

const TemplateList = ({ 
  templates, 
  selectedTemplate, 
  onSelect, 
  onDelete, 
  onCopy, 
  onUpload, 
  onToggleVisibility 
}) => (
  <div className="template-list">
    <div className="list-header">
      <h2>Templates</h2>
      <div className="list-actions">
        <TemplateUpload onUpload={onUpload} />
        <button 
          className="new-template-btn"
          onClick={() => onSelect({ name: 'New Template', content: '', hidden: false })}
          title="Create a new template"
        >
          New Template
        </button>
      </div>
    </div>

    <div className="template-items">
      {templates.length > 0 ? (
        templates.map(template => (
          <TemplateListItem
            key={template.id}
            template={template}
            isSelected={selectedTemplate?.id === template.id}
            onSelect={onSelect}
            onToggleVisibility={onToggleVisibility}
            onCopy={onCopy}
            onDelete={onDelete}
          />
        ))
      ) : (
        <div className="no-templates">
          <p>No templates found. Create a new template or upload one to get started.</p>
        </div>
      )}
    </div>
  </div>
);

export default TemplateList;
