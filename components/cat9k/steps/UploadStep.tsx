import React, { useRef, useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { parseCat9KConfig } from '../../../services/cat9kParser';
import { Cat9KData } from '../Cat9KMigrationWizard';

interface UploadStepProps {
  data: Cat9KData;
  onUpdate: (patch: Partial<Cat9KData>) => void;
}

export function UploadStep({ data, onUpdate }: UploadStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [parseError, setParseError] = useState('');

  const handleFileContent = (text: string, filename?: string) => {
    onUpdate({ rawConfig: text, parsedConfig: null });
    setParseError('');
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      handleFileContent(e.target?.result as string, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleParse = () => {
    if (!data.rawConfig.trim()) {
      setParseError('Please upload a file or paste a configuration first.');
      return;
    }
    try {
      const parsed = parseCat9KConfig(data.rawConfig);
      onUpdate({ parsedConfig: parsed });
      setParseError('');
    } catch (err) {
      setParseError('Failed to parse configuration. Please check the input format.');
    }
  };

  const parsed = data.parsedConfig;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
          Upload IOS-XE Running Configuration
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          Upload a <code>.txt</code> or <code>.cfg</code> file from your Cisco Catalyst 9000 switch, or paste the running-config directly.
          The parser will extract VLANs, switch port configurations, RADIUS servers, and ACLs.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? '#048a24' : 'var(--color-border-primary)'}`,
          borderRadius: '8px',
          padding: '28px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: dragging ? '#f0faf2' : 'var(--color-bg-secondary)',
          transition: 'border-color 150ms, background 150ms',
          marginBottom: '16px',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.cfg,.conf"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '8px',
            backgroundColor: dragging ? '#e8f5eb' : 'var(--color-bg-primary)',
            border: '1px solid var(--color-border-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Upload size={18} color={dragging ? '#048a24' : 'var(--color-text-tertiary)'} />
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {data.rawConfig ? 'File loaded — click to replace' : 'Drop file here or click to browse'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
            Accepts .txt, .cfg, .conf — or paste below
          </div>
        </div>
      </div>

      {/* Textarea */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Paste configuration
        </label>
        <textarea
          value={data.rawConfig}
          onChange={e => onUpdate({ rawConfig: e.target.value, parsedConfig: null })}
          placeholder="Paste IOS-XE running-config here..."
          rows={10}
          style={{
            width: '100%',
            padding: '12px',
            fontFamily: 'monospace',
            fontSize: '12px',
            lineHeight: 1.5,
            border: '1px solid var(--color-border-primary)',
            borderRadius: '6px',
            backgroundColor: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Parse button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={handleParse}
          disabled={!data.rawConfig.trim()}
          style={{
            padding: '9px 20px',
            backgroundColor: data.rawConfig.trim() ? '#048a24' : 'var(--color-bg-secondary)',
            color: data.rawConfig.trim() ? '#ffffff' : 'var(--color-text-tertiary)',
            border: `1px solid ${data.rawConfig.trim() ? '#048a24' : 'var(--color-border-primary)'}`,
            borderRadius: '5px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: data.rawConfig.trim() ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'background 120ms',
          }}
        >
          <FileText size={14} />
          Parse configuration
        </button>

        {parseError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#dc2626' }}>
            <AlertCircle size={14} />
            {parseError}
          </div>
        )}
      </div>

      {/* Parse result badge */}
      {parsed && (
        <div style={{
          marginTop: '16px',
          padding: '14px 16px',
          backgroundColor: '#f0faf2',
          border: '1px solid #bbdfc4',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
        }}>
          <CheckCircle2 size={16} color="#048a24" style={{ flexShrink: 0, marginTop: '1px' }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#025115', marginBottom: '6px' }}>
              Configuration parsed successfully
              {parsed.hostname && <span style={{ fontWeight: 400, marginLeft: '6px', color: '#048a24' }}>— {parsed.hostname}</span>}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {[
                { label: 'VLANs', count: parsed.vlans.length },
                { label: 'Interfaces', count: parsed.interfaces.length },
                { label: 'ACLs', count: parsed.acls.length },
                { label: 'RADIUS servers', count: parsed.radiusServers.length },
              ].map(item => (
                <span key={item.label} style={{
                  fontSize: '12px', fontWeight: 600,
                  padding: '2px 8px',
                  backgroundColor: '#e8f5eb',
                  border: '1px solid #bbdfc4',
                  borderRadius: '4px',
                  color: '#025115',
                }}>
                  {item.count} {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
