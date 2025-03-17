import React, { useRef } from 'react';

const TemplateUpload = ({ onUpload }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const templateName = file.name.replace(/\.(html|htm)$/, '');
      
      onUpload({
        name: templateName,
        content,
        updated_at: new Date().toISOString()
      });
      
      fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="template-upload">
      <input
        ref={fileInputRef}
        type="file"
        accept=".html,.htm"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <button 
        className="upload-btn"
        onClick={() => fileInputRef.current.click()}
        title="Upload an HTML template file"
      >
        Upload
      </button>
    </div>
  );
};

export default TemplateUpload;
