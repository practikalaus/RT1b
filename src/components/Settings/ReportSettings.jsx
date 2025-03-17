import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabase';
import './styles.css';

const ReportSettings = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('templates')
          .select('*')
          .order('name');

        if (error) throw error;
        setTemplates(data || []);
      } catch (error) {
        console.error('Error fetching templates:', error);
        setError('Failed to fetch templates');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  if (loading) {
    return <div className="settings-loading">Loading report templates...</div>;
  }

  return (
    <div className="settings-group">
      <h2>Report Templates</h2>
      {error && <div className="error-message">{error}</div>}
      
      <div className="report-templates-info">
        <p>
          Manage your report templates to customize how your audit reports and quotes look.
          You can create, edit, and manage templates from the template editor.
        </p>
        
        <div className="template-stats">
          <div className="template-stat">
            <span className="stat-value">{templates.length}</span>
            <span className="stat-label">Total Templates</span>
          </div>
          <div className="template-stat">
            <span className="stat-value">{templates.filter(t => !t.hidden).length}</span>
            <span className="stat-label">Active Templates</span>
          </div>
        </div>
        
        <div className="template-actions">
          <Link to="/templates" className="template-editor-link">
            Open Template Editor
          </Link>
        </div>
      </div>
      
      {templates.length > 0 && (
        <div className="template-list-preview">
          <h3>Available Templates</h3>
          <div className="template-grid">
            {templates.map(template => (
              <div key={template.id} className={`template-card ${template.hidden ? 'hidden' : ''}`}>
                <div className="template-card-header">
                  <h4>{template.name}</h4>
                  {template.hidden && <span className="hidden-badge">Hidden</span>}
                </div>
                <div className="template-card-footer">
                  <span className="template-updated">
                    Last updated: {new Date(template.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {templates.length === 0 && (
        <div className="no-templates">
          <p>No templates found. Create your first template in the template editor.</p>
        </div>
      )}
    </div>
  );
};

export default ReportSettings;
