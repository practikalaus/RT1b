import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import './styles.css';

const AuditorSettings = () => {
  const [auditors, setAuditors] = useState([]);
  const [newAuditor, setNewAuditor] = useState({ 
    name: '', 
    color: '#ffffff',
    email: '',
    phone: '' 
  });
  const [loading, setLoading] = useState(true);
  const [editingAuditor, setEditingAuditor] = useState(null);
  const [error, setError] = useState(null);

  const fetchAuditors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('auditors')
        .select('*')
        .order('name');

      if (error) throw error;
      setAuditors(data || []);
    } catch (error) {
      console.error('Error fetching auditors:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditors();
  }, []);

  const handleAddAuditor = async () => {
    if (!newAuditor.name.trim()) {
      setError("Auditor name is required");
      return;
    }

    try {
      setError(null);
      console.log('Adding auditor:', newAuditor);
      const { data, error } = await supabase
        .from('auditors')
        .insert({
          name: newAuditor.name.trim(),
          color: newAuditor.color,
          email: newAuditor.email.trim(),
          phone: newAuditor.phone.trim()
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding auditor to Supabase:', error);
        setError('Failed to add auditor: ' + error.message);
        return;
      }
      console.log('Auditor added successfully:', data);
      await fetchAuditors();
      setNewAuditor({ 
        name: '', 
        color: '#ffffff',
        email: '',
        phone: '' 
      });
    } catch (error) {
      console.error('Error adding auditor:', error);
      setError('Failed to add auditor: ' + error.message);
    }
  };

  const handleRemoveAuditor = async (id) => {
    try {
      setError(null);
      console.log('Removing auditor with id:', id);
      const { error } = await supabase
        .from('auditors')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error removing auditor from Supabase:', error);
        setError('Failed to remove auditor: ' + error.message);
        return;
      }
      console.log('Auditor removed successfully');
      await fetchAuditors();
    } catch (error) {
      console.error('Error removing auditor:', error);
      setError('Failed to remove auditor: ' + error.message);
    }
  };

  const handleUpdateAuditor = async () => {
    if (!editingAuditor || !editingAuditor.name.trim()) {
      setError("Auditor name is required");
      return;
    }

    try {
      setError(null);
      const { error } = await supabase
        .from('auditors')
        .update({
          name: editingAuditor.name.trim(),
          color: editingAuditor.color,
          email: editingAuditor.email.trim(),
          phone: editingAuditor.phone.trim()
        })
        .eq('id', editingAuditor.id);

      if (error) {
        console.error('Error updating auditor in Supabase:', error);
        setError('Failed to update auditor: ' + error.message);
        return;
      }
      
      await fetchAuditors();
      setEditingAuditor(null);
    } catch (error) {
      console.error('Error updating auditor:', error);
      setError('Failed to update auditor: ' + error.message);
    }
  };

  const handleColorChange = async (e, id) => {
    if (editingAuditor && editingAuditor.id === id) {
      setEditingAuditor({
        ...editingAuditor,
        color: e.target.value
      });
      return;
    }

    try {
      setError(null);
      console.log('Updating color for auditor with id:', id, 'New color:', e.target.value);
      const { data, error } = await supabase
        .from('auditors')
        .update({ color: e.target.value })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating auditor color in Supabase:', error);
        setError('Failed to update auditor color: ' + error.message);
        return;
      }
      console.log('Auditor color updated successfully:', data);
      await fetchAuditors();
    } catch (error) {
      console.error('Error updating auditor color:', error);
      setError('Failed to update auditor color: ' + error.message);
    }
  };

  const handleEditAuditor = (auditor) => {
    setEditingAuditor({...auditor});
  };

  const handleCancelEdit = () => {
    setEditingAuditor(null);
    setError(null);
  };

  const handleInputChange = (e, field) => {
    if (editingAuditor) {
      setEditingAuditor({
        ...editingAuditor,
        [field]: e.target.value
      });
    } else {
      setNewAuditor({
        ...newAuditor,
        [field]: e.target.value
      });
    }
  };

  if (loading) {
    return <div className="settings-loading">Loading auditors...</div>;
  }

  return (
    <div className="settings-group">
      <h2>Manage Auditors</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="auditor-list">
        {auditors.map((auditor) => (
          <div key={auditor.id} className="auditor-item">
            {editingAuditor && editingAuditor.id === auditor.id ? (
              <div className="auditor-edit-form">
                <div className="auditor-edit-field">
                  <label>Name:</label>
                  <input
                    type="text"
                    value={editingAuditor.name}
                    onChange={(e) => handleInputChange(e, 'name')}
                    required
                  />
                </div>
                <div className="auditor-edit-field">
                  <label>Email:</label>
                  <input
                    type="email"
                    value={editingAuditor.email || ''}
                    onChange={(e) => handleInputChange(e, 'email')}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="auditor-edit-field">
                  <label>Phone:</label>
                  <input
                    type="tel"
                    value={editingAuditor.phone || ''}
                    onChange={(e) => handleInputChange(e, 'phone')}
                    placeholder="(123) 456-7890"
                  />
                </div>
                <div className="auditor-edit-field">
                  <label>Color:</label>
                  <input
                    type="color"
                    value={editingAuditor.color}
                    onChange={(e) => handleInputChange(e, 'color')}
                  />
                </div>
                <div className="auditor-edit-actions">
                  <button
                    type="button"
                    onClick={handleUpdateAuditor}
                    className="save-auditor-btn"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="cancel-edit-btn"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="auditor-info">
                  <span className="auditor-color-indicator" style={{ backgroundColor: auditor.color }}></span>
                  <div className="auditor-details">
                    <span className="auditor-name">{auditor.name}</span>
                    {auditor.email && <span className="auditor-email">{auditor.email}</span>}
                    {auditor.phone && <span className="auditor-phone">{auditor.phone}</span>}
                  </div>
                  <div className="auditor-actions">
                    <input
                      type="color"
                      value={auditor.color}
                      onChange={(e) => handleColorChange(e, auditor.id)}
                      title="Change color"
                      className="color-picker"
                    />
                    <button
                      type="button"
                      onClick={() => handleEditAuditor(auditor)}
                      className="edit-auditor-btn"
                      title="Edit auditor"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveAuditor(auditor.id)}
                      className="remove-option"
                      title="Remove auditor"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      
      <div className="add-auditor-section">
        <h3>Add New Auditor</h3>
        <div className="add-auditor-form">
          <div className="auditor-field">
            <label>Name:</label>
            <input
              type="text"
              value={newAuditor.name}
              onChange={(e) => handleInputChange(e, 'name')}
              placeholder="Auditor Name"
              required
            />
          </div>
          <div className="auditor-field">
            <label>Email:</label>
            <input
              type="email"
              value={newAuditor.email}
              onChange={(e) => handleInputChange(e, 'email')}
              placeholder="email@example.com"
            />
          </div>
          <div className="auditor-field">
            <label>Phone:</label>
            <input
              type="tel"
              value={newAuditor.phone}
              onChange={(e) => handleInputChange(e, 'phone')}
              placeholder="(123) 456-7890"
            />
          </div>
          <div className="auditor-field">
            <label>Color:</label>
            <input
              type="color"
              value={newAuditor.color}
              onChange={(e) => handleInputChange(e, 'color')}
            />
          </div>
          <button
            type="button"
            onClick={handleAddAuditor}
            className="add-option"
          >
            Add Auditor
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditorSettings;
