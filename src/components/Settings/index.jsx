import React, { useState } from 'react';
import FieldSettings from './FieldSettings';
import { useFieldSettings } from './hooks/useFieldSettings';
import AuditorSettings from './AuditorSettings';
import DamagePriceSettings from './DamagePriceSettings';
import BrandSettings from './BrandSettings';
import BrandPriceSettings from './BrandPriceSettings';
import FormFieldsEditor from './FormFieldsEditor';
import './styles.css';
import ReportSettings from './ReportSettings';

const Settings = () => {
  const { settings, loading, error, updateField, updateDamagePrices } = useFieldSettings();
  const [activeTab, setActiveTab] = useState('form');

  if (loading) {
    return <div className="settings-loading">Loading settings...</div>;
  }

  if (error) {
    return <div className="settings-error">Error: {error}</div>;
  }

  return (
    <div className="settings">
      <div className="settings-header">
        <h1>Settings</h1>
      </div>

      <div className="settings-tabs">
        <button
          className={activeTab === 'form' ? 'active' : ''}
          onClick={() => setActiveTab('form')}
        >
          Form Fields
        </button>
        <button
          className={activeTab === 'auditors' ? 'active' : ''}
          onClick={() => setActiveTab('auditors')}
        >
          Auditors
        </button>
        <button
          className={activeTab === 'brands' ? 'active' : ''}
          onClick={() => setActiveTab('brands')}
        >
          Brands
        </button>
        <button
          className={activeTab === 'brand-prices' ? 'active' : ''}
          onClick={() => setActiveTab('brand-prices')}
        >
          Brand Prices
        </button>
        <button
          className={activeTab === 'prices' ? 'active' : ''}
          onClick={() => setActiveTab('prices')}
        >
          Default Prices
        </button>
        <button
          className={activeTab === 'reports' ? 'active' : ''}
          onClick={() => setActiveTab('reports')}
        >
          Reports
        </button>
      </div>

      {activeTab === 'form' && <FormFieldsEditor />}
      {activeTab === 'auditors' && <AuditorSettings />}
      {activeTab === 'brands' && <BrandSettings />}
      {activeTab === 'brand-prices' && <BrandPriceSettings />}
      {activeTab === 'prices' && (
        <DamagePriceSettings
          damagePrices={settings.damagePrices}
          onUpdate={updateDamagePrices}
        />
      )}
      {activeTab === 'reports' && <ReportSettings />}
    </div>
  );
};

export default Settings;
