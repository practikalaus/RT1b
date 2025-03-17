import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import './styles.css';

const BrandSettings = () => {
  const [brands, setBrands] = useState([]);
  const [newBrand, setNewBrand] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name');

      if (error) throw error;
      setBrands(data || []);
    } catch (err) {
      console.error('Error fetching brands:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBrand = async () => {
    if (!newBrand.trim()) return;

    try {
      const { error } = await supabase
        .from('brands')
        .insert({ name: newBrand.trim() });

      if (error) throw error;

      setNewBrand('');
      await fetchBrands();
    } catch (err) {
      console.error('Error adding brand:', err);
      setError(err.message);
    }
  };

  const handleRemoveBrand = async (id) => {
    try {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchBrands();
    } catch (err) {
      console.error('Error removing brand:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="settings-loading">Loading brands...</div>;
  }

  return (
    <div className="settings-group">
      <h2>Manage Brands</h2>
      {error && <div className="error-message">{error}</div>}
      
      <div className="brand-list">
        {brands.map(brand => (
          <div key={brand.id} className="brand-item">
            <span>{brand.name}</span>
            <button
              onClick={() => handleRemoveBrand(brand.id)}
              className="remove-option"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="add-brand">
        <input
          type="text"
          value={newBrand}
          onChange={(e) => setNewBrand(e.target.value)}
          placeholder="New Brand Name"
          className="setting-input"
        />
        <button
          onClick={handleAddBrand}
          className="add-option"
        >
          Add Brand
        </button>
      </div>
    </div>
  );
};

export default BrandSettings;
