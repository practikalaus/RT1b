import React from 'react';

const TemplateListItem = ({ 
  template, 
  isSelected, 
  onSelect, 
  onToggleVisibility, 
  onCopy, 
  onDelete 
}) => {
  // Format the date nicely
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'Invalid Date') {
      return 'Recently added';
    }
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Recently added';
    }
  };

  return (
    <div 
      className={`template-item ${isSelected ? 'selected' : ''} ${!template.hidden ? 'visible' : 'hidden'}`}
    >
      <div 
        className="template-info"
        onClick={() => onSelect(template)}
      >
        <h3>{template.name}</h3>
        <p>Last modified: {formatDate(template.updated_at)}</p>
      </div>
      <div className="template-actions">
        <button 
          className="edit-btn"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(template);
          }}
          title="Edit this template"
        >
          Edit
        </button>
        <button 
          className={`visibility-btn ${template.hidden ? 'show' : 'hide'}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility(template);
          }}
          title={template.hidden ? "Show template" : "Hide template"}
        >
          {template.hidden ? 'Show' : 'Hide'}
        </button>
        <button 
          className="copy-btn"
          onClick={(e) => {
            e.stopPropagation();
            onCopy(template);
          }}
          title="Create a copy of this template"
        >
          Copy
        </button>
        <button 
          className="delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(`Are you sure you want to delete "${template.name}"?`)) {
              onDelete(template.id);
            }
          }}
          title="Delete this template"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default TemplateListItem;
