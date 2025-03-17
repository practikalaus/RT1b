import React, { useState, useEffect } from 'react';
import './styles.css';

const DamageList = ({ records, onRemove, onEdit }) => {
  const [processedRecords, setProcessedRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPhoto, setExpandedPhoto] = useState(null);

  const processRecord = async (record) => {
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
        return { ...record, photo_url: base64 };
      } catch (error) {
        console.error('Error fetching or converting image:', error);
        return record;
      }
    }
    return record;
  };

  useEffect(() => {
    const processAllRecords = async () => {
      setLoading(true);
      try {
        const updatedRecords = await Promise.all(records.map(processRecord));
        setProcessedRecords(updatedRecords);
      } catch (error) {
        console.error('Error refreshing damage records:', error);
      } finally {
        setLoading(false);
      }
    };

    processAllRecords();
  }, [records]);

  const handlePhotoClick = (photoUrl) => {
    setExpandedPhoto(photoUrl);
  };

  const handleClosePhoto = () => {
    setExpandedPhoto(null);
  };

  if (loading) {
    return <div className="loading">Loading damage records...</div>;
  }

  if (!processedRecords.length) {
    return (
      <div className="no-damages">
        No damage records added yet
      </div>
    );
  }

  return (
    <div className="damage-list">
      {processedRecords.map((record) => (
        <div key={record.id} className={`damage-record ${record.risk_level.toLowerCase()}`}>
          <div className="damage-header">
            <div className="damage-header-content">
              <div className="damage-title-row">
                <h3>{record.damage_type}</h3>
                <span className={`risk-badge ${record.risk_level.toLowerCase()}`}>
                  {record.risk_level}
                </span>
              </div>
              <span className="reference-number">
                <strong>Reference:</strong> {record.reference_number || 'Will be assigned on save'}
              </span>
            </div>
          </div>
          
          <div className="damage-content">
            <div className="damage-details">
              <p><strong>Location:</strong> {record.location_details}</p>
              {record.building_area && (
                <p><strong>Building/Area:</strong> {record.building_area}</p>
              )}
              <p><strong>Brand:</strong> {record.brand || 'Not specified'}</p>
              <p><strong>Recommendation:</strong> {record.recommendation}</p>
              {record.notes && <p><strong>Notes:</strong> {record.notes}</p>}
            </div>

            {record.photo_url && (
              <div className="damage-photo">
                <div className="thumbnail-container" onClick={() => handlePhotoClick(record.photo_url)}>
                  <img 
                    src={record.photo_url} 
                    alt="Damage" 
                    className="damage-thumbnail"
                  />
                  <div className="thumbnail-overlay">
                    <span>Click to enlarge</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="damage-actions">
            <button
              onClick={() => onEdit(record)}
              className="edit-record-btn"
            >
              Edit
            </button>
            <button
              onClick={() => onRemove(record.id)}
              className="remove-record-btn"
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      {expandedPhoto && (
        <div className="photo-modal" onClick={handleClosePhoto}>
          <div className="photo-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={handleClosePhoto}>×</button>
            <img src={expandedPhoto} alt="Enlarged damage" className="enlarged-photo" />
          </div>
        </div>
      )}
    </div>
  );
};

export default DamageList;
