import React, { useState, useEffect, useRef } from 'react';
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

const RECOMMENDATIONS = {
  'Beam Safety Clips Missing': 'Replace Safety Beam Clip',
  'Upright Damaged': 'Replace Upright',
  'Upright/Footplate Twisted': 'Straighten Upright/Footplate',
  'Footplate Damaged/Missing': 'Replace Footplate',
  'Floor Fixing Damaged/Missing': 'Replace Floor Fixing',
  'Horizontal Brace Damaged': 'Replace Horizontal Brace',
  'Diagonal Brace Damaged': 'Replace Diagonal Brace',
  'Beam Damaged': 'Replace Beam',
  'Beam Dislodged': 'Re-Engage Dislodged Beam',
  'Row Spacer Damaged/Missing': 'Replace Row Spacer',
  'Mesh Deck missing/damaged': 'Replace Mesh Deck',
  'Barrier/Guard Damaged/Missing': 'Replace Barrier/Guard',
  'Load Sign Incorrect/Missing': 'Replace Load Sign',
  'Splice Incorrect/Poor Quality': 'Replace Splice',
  'Frames not compatible with Beam': 'Unload and replace Frames and or beams'
};

const DamageRecordForm = ({ onSubmit, onCancel, initialData, lastUsedBrand, lastUsedBuildingArea }) => {
  const [formData, setFormData] = useState({
    damage_type: initialData?.damage_type || '',
    risk_level: initialData?.risk_level || '',
    location_details: initialData?.location_details || '',
    building_area: initialData?.building_area || lastUsedBuildingArea || '',
    photo_url: initialData?.photo_url || null,
    notes: initialData?.notes || '',
    recommendation: initialData?.recommendation || '',
    brand: initialData?.brand || lastUsedBrand || '',
    reference_number: initialData?.reference_number || ''
  });

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [customDamageType, setCustomDamageType] = useState('');
  const [customRecommendation, setCustomRecommendation] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [brands, setBrands] = useState([]);
  const formRef = useRef(null);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const { data, error } = await supabase
          .from('brands')
          .select('*')
          .order('name');

        if (error) throw error;
        
        // Add "Other" option to the brands list if it doesn't exist
        const brandsWithOther = [...(data || [])];
        if (!brandsWithOther.some(brand => brand.name === 'Other')) {
          brandsWithOther.push({ id: 'other', name: 'Other' });
        }
        
        setBrands(brandsWithOther);
      } catch (err) {
        console.error('Error fetching brands:', err);
      }
    };

    fetchBrands();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'risk_level' && value === 'GREEN') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        recommendation: "Continue to monitor"
      }));
    } else if (name === 'damage_type') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        recommendation: prev.risk_level === 'GREEN' 
          ? "Continue to monitor" 
          : (value === 'Other' ? '' : RECOMMENDATIONS[value])
      }));
      
      if (value === 'Other') {
        setCustomDamageType('');
        setCustomRecommendation('');
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Reset custom brand when brand changes
    if (name === 'brand' && value !== 'Other') {
      setCustomBrand('');
    }
  };

  const handleCustomChange = (e) => {
    const { name, value } = e.target;
    if (name === 'customDamageType') {
      setCustomDamageType(value);
    } else if (name === 'customRecommendation') {
      setCustomRecommendation(value);
    } else if (name === 'customBrand') {
      setCustomBrand(value);
    }
  };

  const handlePhotoChange = async (e) => {
    try {
      setUploading(true);
      setUploadError(null);
      const file = e.target.files[0];
      if (!file) return;

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }

      const fileExt = file.name.split('.').pop();
      const allowedTypes = ['jpg', 'jpeg', 'png'];
      if (!allowedTypes.includes(fileExt.toLowerCase())) {
        throw new Error('Only JPG and PNG files are allowed');
      }

      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `damage-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('audit-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('audit-photos')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        photo_url: publicUrl
      }));
    } catch (error) {
      console.error('Error uploading photo:', error);
      setUploadError(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalDamageType = formData.damage_type === 'Other' ? customDamageType : formData.damage_type;
    const finalRecommendation = formData.risk_level === 'GREEN' 
      ? "Continue to monitor" 
      : (formData.damage_type === 'Other' ? customRecommendation : formData.recommendation);
    
    // Handle custom brand
    let finalBrand = formData.brand;
    if (formData.brand === 'Other' && customBrand.trim()) {
      finalBrand = customBrand.trim();
      
      // Add the new brand to the database if it doesn't exist
      try {
        // Check if brand already exists
        const { data: existingBrands, error: checkError } = await supabase
          .from('brands')
          .select('*')
          .eq('name', finalBrand);
          
        if (checkError) throw checkError;
        
        // If brand doesn't exist, add it
        if (!existingBrands || existingBrands.length === 0) {
          const { error: insertError } = await supabase
            .from('brands')
            .insert({ name: finalBrand });
            
          if (insertError) throw insertError;
        }
      } catch (error) {
        console.error('Error adding new brand:', error);
        // Continue with submission even if brand creation fails
      }
    }
    
    onSubmit({ 
      ...formData, 
      damage_type: finalDamageType, 
      recommendation: finalRecommendation,
      brand: finalBrand,
      building_area: formData.building_area.trim() // Ensure building_area is included
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="damage-record-form">
      <div className="form-grid">
        <div className="form-field">
          <label>Reference Number</label>
          {initialData?.reference_number ? (
            <input
              type="text"
              value={initialData.reference_number}
              disabled
              className="reference-input"
            />
          ) : (
            <>
              <input
                type="text"
                value="Will be assigned on save"
                disabled
                className="reference-input"
              />
              <span className="generating-reference">A unique reference number will be assigned when you save this record</span>
            </>
          )}
        </div>

        <div className="form-field">
          <label>Brand</label>
          <select
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            required
          >
            <option value="">Select Brand</option>
            {brands.map(brand => (
              <option key={brand.id} value={brand.name}>{brand.name}</option>
            ))}
          </select>
          
          {formData.brand === 'Other' && (
            <div className="custom-brand-input">
              <input
                type="text"
                name="customBrand"
                value={customBrand}
                onChange={handleCustomChange}
                placeholder="Enter brand name"
                required
                className="custom-input"
              />
            </div>
          )}
        </div>

        <div className="form-field">
          <label>Building/Area</label>
          <input
            type="text"
            name="building_area"
            value={formData.building_area}
            onChange={handleChange}
            placeholder="Enter building or area name"
            className="custom-input"
          />
        </div>

        <div className="form-field">
          <label>Damage Type</label>
          <select
            name="damage_type"
            value={formData.damage_type}
            onChange={handleChange}
            required
          >
            <option value="">Select Damage Type</option>
            {DAMAGE_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          {formData.damage_type === 'Other' && (
            <>
              <div className="custom-input-container">
                <input
                  type="text"
                  name="customDamageType"
                  value={customDamageType}
                  onChange={handleCustomChange}
                  placeholder="Enter damage type"
                  required
                  className="custom-input"
                />
              </div>
              <div className="custom-input-container">
                <input
                  type="text"
                  name="customRecommendation"
                  value={customRecommendation}
                  onChange={handleCustomChange}
                  placeholder="Enter recommendation"
                  required
                  className="custom-input"
                />
              </div>
            </>
          )}
        </div>

        <div className="form-field">
          <label>Risk Level</label>
          <select
            name="risk_level"
            value={formData.risk_level}
            onChange={handleChange}
            required
          >
            <option value="">Select Risk Level</option>
            <option value="RED">Red Risk</option>
            <option value="AMBER">Amber Risk</option>
            <option value="GREEN">Green Risk</option>
          </select>
        </div>

        <div className="form-field">
          <label>Location Details</label>
          <input
            type="text"
            name="location_details"
            value={formData.location_details}
            onChange={handleChange}
            placeholder="Aisle-Bay-Level-Side"
            required
          />
        </div>

        <div className="form-field">
          <label>Photo</label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
            disabled={uploading}
          />
          {uploading && <span className="upload-status">Uploading...</span>}
          {uploadError && <span className="upload-error">{uploadError}</span>}
          {formData.photo_url && <span className="upload-success">Photo uploaded successfully</span>}
        </div>

        <div className="form-field full-width">
          <label>Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
          />
        </div>

        <div className="form-field full-width">
          <label>Recommendation</label>
          <input
            type="text"
            name="recommendation"
            value={formData.risk_level === 'GREEN' ? "Continue to monitor" : formData.recommendation}
            onChange={handleChange}
            required
            disabled={formData.risk_level === 'GREEN'}
          />
          {formData.risk_level === 'GREEN' && (
            <span className="recommendation-note">Recommendation is automatically set for Green risk level</span>
          )}
        </div>
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="cancel-btn">
          Cancel
        </button>
        <button type="submit" className="submit-btn" disabled={uploading}>
          {initialData ? 'Update Record' : 'Add Record'}
        </button>
      </div>
    </form>
  );
};

export default DamageRecordForm;
