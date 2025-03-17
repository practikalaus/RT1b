import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import './styles.css';

const DAMAGE_TYPES = [
  'Beam Safety Clips Missing',
  'Upright Damaged',
  'Upright/Footplate Twisted',
  'Footplate Damaged/Missing',
  'Floor Fixing Damaged/Missing',
  'Horizontal Brace Damaged',
  'Diagonal Brace Damaged',
  'Beam Damaged',
  'Beam Dislodged',
  'Row Spacer Damaged/Missing',
  'Mesh Deck missing/damaged',
  'Barrier/Guard Damaged/Missing',
  'Load Sign Incorrect/Missing',
  'Splice Incorrect/Poor Quality',
  'Frames not compatible with Beam',
  'Other'
];

const RISK_LEVELS = ['RED', 'AMBER', 'GREEN'];

const FormFieldsEditor = () => {
  const [formFields, setFormFields] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [editingField, setEditingField] = useState(null);
  const [editingOption, setEditingOption] = useState(null);
  const [newOption, setNewOption] = useState('');
  const [customDamageTypes, setCustomDamageTypes] = useState([]);

  useEffect(() => {
    fetchFormFields();
  }, []);

  const fetchFormFields = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'formFields')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.value) {
        setFormFields(data.value);
      } else {
        // Default form fields if none exist
        setFormFields({
          auditorName: {
            type: "text",
            label: "Auditor Name",
            required: true
          },
          siteName: {
            type: "text",
            label: "Site Name",
            required: true
          },
          companyName: {
            type: "text",
            label: "Company Name",
            required: true
          },
          auditDate: {
            type: "date",
            label: "Audit Date",
            required: true
          },
          damageType: {
            type: "select",
            label: "Damage Type",
            required: true,
            options: DAMAGE_TYPES
          },
          riskLevel: {
            type: "select",
            label: "Risk Level",
            required: true,
            options: RISK_LEVELS
          },
          locationDetails: {
            type: "text",
            label: "Location Details",
            required: true,
            placeholder: "Aisle-Bay-Level-Side"
          },
          notes: {
            type: "textarea",
            label: "Notes",
            required: false
          },
          recommendation: {
            type: "text",
            label: "Recommendation",
            required: true
          }
        });
      }

      // Fetch custom damage types
      try {
        const { data: customTypes, error: customTypesError } = await supabase
          .from('settings')
          .select('*')
          .eq('key', 'customDamageTypes')
          .single();

        if (customTypesError) {
          if (customTypesError.code === 'PGRST116') {
            // Create the setting if it doesn't exist
            await supabase
              .from('settings')
              .upsert({
                key: 'customDamageTypes',
                value: [],
                updated_at: new Date().toISOString()
              });
            setCustomDamageTypes([]);
          } else {
            throw customTypesError;
          }
        } else if (customTypes?.value) {
          setCustomDamageTypes(customTypes.value);
        }
      } catch (customError) {
        console.error('Error fetching custom damage types:', customError);
        // Initialize with empty array if there's an error
        setCustomDamageTypes([]);
      }

    } catch (error) {
      console.error('Error fetching form fields:', error);
      setMessage({ text: 'Error loading form fields', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const saveFormFields = async () => {
    try {
      setSaving(true);
      setMessage({ text: '', type: '' });

      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'formFields',
          value: formFields,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Save custom damage types
      await supabase
        .from('settings')
        .upsert({
          key: 'customDamageTypes',
          value: customDamageTypes,
          updated_at: new Date().toISOString()
        });

      setMessage({ text: 'Form fields saved successfully', type: 'success' });
    } catch (error) {
      console.error('Error saving form fields:', error);
      setMessage({ text: 'Error saving form fields: ' + error.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleFieldLabelChange = (fieldName, newLabel) => {
    setFormFields(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        label: newLabel
      }
    }));
  };

  const handleFieldRequiredChange = (fieldName, required) => {
    setFormFields(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        required
      }
    }));
  };

  const handleAddOption = (fieldName) => {
    if (!newOption.trim()) return;

    if (fieldName === 'damageType') {
      // Add to custom damage types
      setCustomDamageTypes(prev => [...prev, newOption.trim()]);
      
      // Update the options in the form field
      setFormFields(prev => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          options: [...DAMAGE_TYPES, ...customDamageTypes, newOption.trim()]
        }
      }));
    } else {
      setFormFields(prev => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          options: [...(prev[fieldName].options || []), newOption.trim()]
        }
      }));
    }
    
    setNewOption('');
    setEditingOption(null);
  };

  const handleUpdateOption = (fieldName, index, newValue) => {
    if (fieldName === 'damageType') {
      // For damage types, we need to check if it's a custom type
      const standardTypesCount = DAMAGE_TYPES.length;
      
      if (index >= standardTypesCount) {
        // It's a custom type
        const customIndex = index - standardTypesCount;
        const updatedCustomTypes = [...customDamageTypes];
        updatedCustomTypes[customIndex] = newValue;
        setCustomDamageTypes(updatedCustomTypes);
        
        // Update the options in the form field
        setFormFields(prev => ({
          ...prev,
          [fieldName]: {
            ...prev[fieldName],
            options: [...DAMAGE_TYPES, ...updatedCustomTypes]
          }
        }));
      }
      // We don't allow editing standard damage types
    } else {
      // For other fields, update normally
      setFormFields(prev => {
        const options = [...prev[fieldName].options];
        options[index] = newValue;
        return {
          ...prev,
          [fieldName]: {
            ...prev[fieldName],
            options
          }
        };
      });
    }
    
    setEditingOption(null);
  };

  const handleRemoveOption = (fieldName, index) => {
    if (fieldName === 'damageType') {
      // For damage types, we need to check if it's a custom type
      const standardTypesCount = DAMAGE_TYPES.length;
      
      if (index >= standardTypesCount) {
        // It's a custom type
        const customIndex = index - standardTypesCount;
        const updatedCustomTypes = customDamageTypes.filter((_, i) => i !== customIndex);
        setCustomDamageTypes(updatedCustomTypes);
        
        // Update the options in the form field
        setFormFields(prev => ({
          ...prev,
          [fieldName]: {
            ...prev[fieldName],
            options: [...DAMAGE_TYPES, ...updatedCustomTypes]
          }
        }));
      }
      // We don't allow removing standard damage types
    } else if (fieldName === 'riskLevel') {
      // Don't allow removing risk levels
      return;
    } else {
      // For other fields, remove normally
      setFormFields(prev => {
        const options = prev[fieldName].options.filter((_, i) => i !== index);
        return {
          ...prev,
          [fieldName]: {
            ...prev[fieldName],
            options
          }
        };
      });
    }
  };

  const resetToDefaults = async () => {
    if (window.confirm('Are you sure you want to reset all form fields to defaults? This cannot be undone.')) {
      try {
        setSaving(true);
        
        // Delete the settings entry
        const { error } = await supabase
          .from('settings')
          .delete()
          .eq('key', 'formFields');
          
        if (error) throw error;
        
        // Also reset custom damage types
        await supabase
          .from('settings')
          .delete()
          .eq('key', 'customDamageTypes');
          
        setCustomDamageTypes([]);
        
        // Fetch default settings
        await fetchFormFields();
        
        setMessage({ text: 'Form fields reset to defaults', type: 'success' });
      } catch (error) {
        console.error('Error resetting form fields:', error);
        setMessage({ text: 'Error resetting form fields: ' + error.message, type: 'error' });
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading) {
    return <div className="settings-loading">Loading form fields...</div>;
  }

  return (
    <div className="form-fields-editor">
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      
      <div className="editor-header">
        <h2>Edit Rack Audit Form Fields</h2>
        <div className="editor-actions">
          <button 
            className="reset-btn" 
            onClick={resetToDefaults}
            disabled={saving}
          >
            Reset to Defaults
          </button>
          <button 
            className="save-btn" 
            onClick={saveFormFields}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
      
      <div className="fields-container">
        <div className="field-group">
          <h3>Basic Information Fields</h3>
          <div className="field-list">
            {['auditorName', 'siteName', 'companyName', 'auditDate'].map(fieldName => (
              <div key={fieldName} className="field-item">
                <div className="field-header">
                  <h4>{formFields[fieldName]?.label || fieldName}</h4>
                  <button 
                    className="edit-btn"
                    onClick={() => setEditingField(fieldName)}
                  >
                    Edit
                  </button>
                </div>
                
                {editingField === fieldName ? (
                  <div className="field-edit-form">
                    <div className="form-row">
                      <label>Field Label:</label>
                      <input 
                        type="text" 
                        value={formFields[fieldName]?.label || ''} 
                        onChange={(e) => handleFieldLabelChange(fieldName, e.target.value)}
                      />
                    </div>
                    <div className="form-row">
                      <label>Required:</label>
                      <input 
                        type="checkbox" 
                        checked={formFields[fieldName]?.required || false} 
                        onChange={(e) => handleFieldRequiredChange(fieldName, e.target.checked)}
                      />
                    </div>
                    <div className="edit-actions">
                      <button 
                        className="cancel-btn"
                        onClick={() => setEditingField(null)}
                      >
                        Cancel
                      </button>
                      <button 
                        className="done-btn"
                        onClick={() => setEditingField(null)}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="field-details">
                    <p><strong>Type:</strong> {formFields[fieldName]?.type || 'text'}</p>
                    <p><strong>Required:</strong> {formFields[fieldName]?.required ? 'Yes' : 'No'}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="field-group">
          <h3>Damage Record Fields</h3>
          <div className="field-list">
            {['damageType', 'riskLevel', 'locationDetails', 'notes', 'recommendation'].map(fieldName => (
              <div key={fieldName} className="field-item">
                <div className="field-header">
                  <h4>{formFields[fieldName]?.label || fieldName}</h4>
                  <button 
                    className="edit-btn"
                    onClick={() => setEditingField(fieldName)}
                  >
                    Edit
                  </button>
                </div>
                
                {editingField === fieldName ? (
                  <div className="field-edit-form">
                    <div className="form-row">
                      <label>Field Label:</label>
                      <input 
                        type="text" 
                        value={formFields[fieldName]?.label || ''} 
                        onChange={(e) => handleFieldLabelChange(fieldName, e.target.value)}
                      />
                    </div>
                    <div className="form-row">
                      <label>Required:</label>
                      <input 
                        type="checkbox" 
                        checked={formFields[fieldName]?.required || false} 
                        onChange={(e) => handleFieldRequiredChange(fieldName, e.target.checked)}
                      />
                    </div>
                    
                    {(fieldName === 'damageType' || fieldName === 'riskLevel') && (
                      <div className="options-editor">
                        <h5>Options:</h5>
                        <ul className="options-list">
                          {formFields[fieldName]?.options?.map((option, index) => (
                            <li key={index} className="option-item">
                              {editingOption === `${fieldName}-${index}` ? (
                                <div className="option-edit">
                                  <input 
                                    type="text" 
                                    value={newOption} 
                                    onChange={(e) => setNewOption(e.target.value)}
                                  />
                                  <div className="option-actions">
                                    <button 
                                      onClick={() => {
                                        handleUpdateOption(fieldName, index, newOption);
                                        setEditingOption(null);
                                      }}
                                    >
                                      Save
                                    </button>
                                    <button onClick={() => setEditingOption(null)}>
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="option-display">
                                  <span>{option}</span>
                                  <div className="option-actions">
                                    {/* Only allow editing/removing custom damage types or non-risk levels */}
                                    {((fieldName === 'damageType' && index >= DAMAGE_TYPES.length) || 
                                       (fieldName !== 'damageType' && fieldName !== 'riskLevel')) && (
                                      <>
                                        <button 
                                          onClick={() => {
                                            setEditingOption(`${fieldName}-${index}`);
                                            setNewOption(option);
                                          }}
                                        >
                                          Edit
                                        </button>
                                        <button onClick={() => handleRemoveOption(fieldName, index)}>
                                          Remove
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                        
                        {/* Only allow adding custom damage types */}
                        {fieldName === 'damageType' && (
                          <div className="add-option">
                            <input 
                              type="text" 
                              placeholder="New damage type..." 
                              value={newOption} 
                              onChange={(e) => setNewOption(e.target.value)}
                            />
                            <button onClick={() => handleAddOption(fieldName)}>
                              Add
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="edit-actions">
                      <button 
                        className="cancel-btn"
                        onClick={() => setEditingField(null)}
                      >
                        Cancel
                      </button>
                      <button 
                        className="done-btn"
                        onClick={() => setEditingField(null)}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="field-details">
                    <p><strong>Type:</strong> {formFields[fieldName]?.type || 'text'}</p>
                    <p><strong>Required:</strong> {formFields[fieldName]?.required ? 'Yes' : 'No'}</p>
                    
                    {(fieldName === 'damageType' || fieldName === 'riskLevel') && (
                      <div className="options-summary">
                        <p><strong>Options:</strong> {formFields[fieldName]?.options?.length || 0}</p>
                        {fieldName === 'damageType' && customDamageTypes.length > 0 && (
                          <p><strong>Custom Types:</strong> {customDamageTypes.length}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormFieldsEditor;
