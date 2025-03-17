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
  'Frames not compatible with Beam'
];

const BrandPriceSettings = () => {
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      fetchPrices(selectedBrand.id);
    }
  }, [selectedBrand]);

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name');

      if (error) throw error;
      setBrands(data || []);
      if (data?.length > 0) {
        setSelectedBrand(data[0]);
      }
    } catch (err) {
      console.error('Error fetching brands:', err);
      setError(err.message);
    }
  };

  const fetchPrices = async (brandId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('brand_prices')
        .select('*')
        .eq('brand_id', brandId);

      if (error) throw error;

      // Convert array to object for easier access
      const priceObj = {};
      data.forEach(item => {
        priceObj[item.damage_type] = {
          product_cost: item.product_cost || '',
          installation_cost: item.installation_cost || ''
        };
      });
      setPrices(priceObj);
    } catch (err) {
      console.error('Error fetching prices:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = async (damageType, field, value) => {
    if (!selectedBrand) return;

    try {
      // Allow empty string for clearing the input
      if (value === '') {
        setPrices(prev => ({
          ...prev,
          [damageType]: {
            ...prev[damageType],
            [field]: ''
          }
        }));
        return;
      }

      // Only allow numbers and validate the input
      if (!/^\d*\.?\d*$/.test(value)) return;

      const numericValue = parseFloat(value);
      if (isNaN(numericValue)) return;

      // Update local state immediately for responsive UI
      setPrices(prev => ({
        ...prev,
        [damageType]: {
          ...prev[damageType],
          [field]: value
        }
      }));

      // Debounce the API call
      const timeoutId = setTimeout(async () => {
        const currentPrices = prices[damageType] || {};
        const updateData = {
          brand_id: selectedBrand.id,
          damage_type: damageType,
          product_cost: field === 'product_cost' ? numericValue : (parseFloat(currentPrices.product_cost) || 0),
          installation_cost: field === 'installation_cost' ? numericValue : (parseFloat(currentPrices.installation_cost) || 0)
        };

        const { error } = await supabase
          .from('brand_prices')
          .upsert(updateData, {
            onConflict: 'brand_id,damage_type'
          });

        if (error) {
          console.error('Error updating price:', error);
          setError(error.message);
          // Revert local state on error
          fetchPrices(selectedBrand.id);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    } catch (err) {
      console.error('Error updating price:', err);
      setError(err.message);
    }
  };

  if (loading && !selectedBrand) {
    return <div className="settings-loading">Loading brands...</div>;
  }

  return (
    <div className="settings-group">
      <h2>Brand-Specific Pricing</h2>
      {error && <div className="error-message">{error}</div>}

      <div className="brand-selector">
        <label>Select Brand:</label>
        <select
          value={selectedBrand?.id || ''}
          onChange={(e) => {
            const brand = brands.find(b => b.id === e.target.value);
            setSelectedBrand(brand);
          }}
        >
          {brands.map(brand => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>

      {selectedBrand && (
        <div className="damage-prices-grid">
          {DAMAGE_TYPES.map(damageType => {
            const priceData = prices[damageType] || {};
            return (
              <div key={damageType} className="damage-price-item">
                <label>{damageType}</label>
                <div className="price-inputs">
                  <div className="price-input-group">
                    <label>Product Cost</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={priceData.product_cost || ''}
                      onChange={(e) => handlePriceChange(damageType, 'product_cost', e.target.value)}
                      className="setting-input"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="price-input-group">
                    <label>Installation Cost</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={priceData.installation_cost || ''}
                      onChange={(e) => handlePriceChange(damageType, 'installation_cost', e.target.value)}
                      className="setting-input"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BrandPriceSettings;
