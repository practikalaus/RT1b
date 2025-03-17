import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './styles.css';

const TemplateForm = ({ template, onSave }) => {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editorMode, setEditorMode] = useState('code'); // 'code' or 'wysiwyg'
  const quillRef = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setContent(template.content);
    }
  }, [template]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    try {
      setIsSaving(true);
      await onSave({ ...template, name, content });
      alert('Template saved successfully!');
    } catch (error) {
      alert('Error saving template: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image', 'code-block', 'blockquote'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'align',
    'link', 'image', 'code-block', 'blockquote'
  ];

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const insertVariable = (variable) => {
    if (editorMode === 'code' && editorRef.current) {
      const editor = editorRef.current;
      const selection = editor.getSelection();
      const id = { major: 1, minor: 1 };
      const op = {
        identifier: id,
        range: selection,
        text: variable,
        forceMoveMarkers: true
      };
      editor.executeEdits('my-source', [op]);
      editor.focus();
    } else if (editorMode === 'wysiwyg' && quillRef.current) {
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection(true);
      quill.insertText(range.index, variable);
      quill.setSelection(range.index + variable.length);
    }
  };

  if (!template) {
    return (
      <div className="no-template">
        <p>Select a template to edit or create a new one</p>
        <p className="hint">Available variables:</p>
        <ul className="variable-list">
          <li><code>{"{{reference_number}}"}</code> - Audit reference number</li>
          <li><code>{"{{audit_date}}"}</code> - Date of audit</li>
          <li><code>{"{{auditor_name}}"}</code> - Name of auditor</li>
          <li><code>{"{{site_name}}"}</code> - Site name</li>
          <li><code>{"{{company_name}}"}</code> - Company name</li>
          <li><code>{"{{red_risks}}"}</code> - Number of red risks</li>
          <li><code>{"{{amber_risks}}"}</code> - Number of amber risks</li>
          <li><code>{"{{green_risks}}"}</code> - Number of green risks</li>
          <li><code>{"{{notes}}"}</code> - Audit notes</li>
        </ul>
        <p className="hint">Damage record fields (in loop):</p>
        <ul className="variable-list">
          <li><code>{"{{damage_type}}"}</code> - Type of damage</li>
          <li><code>{"{{risk_level}}"}</code> - Risk level (RED/AMBER/GREEN)</li>
          <li><code>{"{{location_details}}"}</code> - Location details</li>
          <li><code>{"{{building_area}}"}</code> - Building/Area</li>
          <li><code>{"{{recommendation}}"}</code> - Recommended action</li>
          <li><code>{"{{notes}}"}</code> - Additional notes</li>
          <li><code>{"{{photo_url}}"}</code> - URL of damage photo</li>
        </ul>
      </div>
    );
  }

  return (
    <form className="template-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Template Name"
          required
          className="template-name-input"
        />
        <div className="editor-mode-toggle">
          <button 
            type="button"
            className={`mode-btn ${editorMode === 'code' ? 'active' : ''}`}
            onClick={() => setEditorMode('code')}
          >
            Code
          </button>
          <button 
            type="button"
            className={`mode-btn ${editorMode === 'wysiwyg' ? 'active' : ''}`}
            onClick={() => setEditorMode('wysiwyg')}
          >
            Visual
          </button>
        </div>
        <button 
          type="submit" 
          className="save-button"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Template'}
        </button>
      </div>

      <div className="variable-toolbar">
        <span className="variable-label">Insert Variable:</span>
        <div className="variable-buttons">
          <button 
            type="button" 
            onClick={() => insertVariable('{{reference_number}}')}
            className="variable-btn"
          >
            Reference #
          </button>
          <button 
            type="button" 
            onClick={() => insertVariable('{{audit_date}}')}
            className="variable-btn"
          >
            Date
          </button>
          <button 
            type="button" 
            onClick={() => insertVariable('{{auditor_name}}')}
            className="variable-btn"
          >
            Auditor
          </button>
          <button 
            type="button" 
            onClick={() => insertVariable('{{site_name}}')}
            className="variable-btn"
          >
            Site
          </button>
          <button 
            type="button" 
            onClick={() => insertVariable('{{company_name}}')}
            className="variable-btn"
          >
            Company
          </button>
          <button 
            type="button" 
            onClick={() => insertVariable('{{#each damage_records}}{{/each}}')}
            className="variable-btn loop-btn"
          >
            Damage Records Loop
          </button>
        </div>
      </div>

      <div className="editor-container">
        {editorMode === 'code' ? (
          <Editor
            height="70vh"
            language="html"
            value={content}
            onChange={setContent}
            onMount={handleEditorDidMount}
            theme="vs-light"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              lineNumbers: 'on',
              formatOnPaste: true,
              formatOnType: true,
              renderWhitespace: 'boundary',
              suggest: {
                showVariables: true,
                showFunctions: true
              }
            }}
          />
        ) : (
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={content}
            onChange={setContent}
            modules={modules}
            formats={formats}
            className="wysiwyg-editor"
          />
        )}
      </div>
    </form>
  );
};

export default TemplateForm;
