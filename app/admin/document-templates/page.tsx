'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Plus, 
  Trash2, 
  FileCode, 
  Loader2, 
  UploadCloud, 
  Save, 
  AlertCircle 
} from 'lucide-react'
import { extractPdfFieldsAction, saveFieldMappingsAction } from '@/app/actions/document'
import { uploadFileAction } from '@/app/actions/storage'
import { DocumentTemplate, DocumentField } from '@/lib/types'

export default function DocumentTemplatesPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)
  const [fields, setFields] = useState<DocumentField[]>([])
  const [pdfFields, setPdfFields] = useState<Array<{ name: string; type: string }>>([])
  
  // Loading states
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [loadingFields, setLoadingFields] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [savingMapping, setSavingMapping] = useState(false)
  const [creatingTemplate, setCreatingTemplate] = useState(false)
  
  // Modals / forms states
  const [showAddTemplate, setShowAddTemplate] = useState(false)
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldType, setNewFieldType] = useState('text')
  
  // Mappings tracking state
  const [mappings, setMappings] = useState<Record<string, string>>({}) // fieldId -> pdfFieldName

  async function fetchTemplates() {
    try {
      setLoadingTemplates(true)
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (e: unknown) {
      alert(`Error fetching templates: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setLoadingTemplates(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  async function handleSelectTemplate(tpl: DocumentTemplate) {
    setSelectedTemplate(tpl)
    setFields([])
    setPdfFields([])
    setMappings({})
    
    // Fetch template fields
    try {
      setLoadingFields(true)
      const { data, error } = await supabase
        .from('document_fields')
        .select('*')
        .eq('template_id', tpl.id)
        .order('sort_order', { ascending: true })

      if (error) throw error
      setFields(data || [])

      // Prep current mappings state
      const currentMappings: Record<string, string> = {}
      data?.forEach(f => {
        if (f.pdf_field_name) {
          currentMappings[f.id] = f.pdf_field_name
        }
      })
      setMappings(currentMappings)

      // If template already has a PDF form uploaded, read its AcroForm fields
      if (tpl.file_path) {
        await loadPdfFields(tpl.file_path)
      }
    } catch (e: unknown) {
      alert(`Error loading fields: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setLoadingFields(false)
    }
  }

  async function loadPdfFields(filePath: string) {
    try {
      setLoadingPdf(true)
      const res = await extractPdfFieldsAction(filePath)
      if (res.success && res.fields) {
        setPdfFields(res.fields)
      } else {
        console.warn("Could not extract pdf fields:", res.error)
      }
    } catch (e: unknown) {
      console.error(e)
    } finally {
      setLoadingPdf(false)
    }
  }

  async function handleCreateTemplate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const visa_subclass = formData.get('visa_subclass') as string

    try {
      setCreatingTemplate(true)
      const { data, error } = await supabase
        .from('document_templates')
        .insert([{ name, description, visa_subclass, is_active: true }])
        .select('*')
        .single()

      if (error) throw error
      
      setTemplates([data, ...templates])
      setShowAddTemplate(false)
      handleSelectTemplate(data)
    } catch (e: unknown) {
      alert(`Failed to create template: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setCreatingTemplate(false)
    }
  }

  async function handleAddField(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTemplate || !newFieldName || !newFieldLabel) return

    try {
      const { data, error } = await supabase
        .from('document_fields')
        .insert([{
          template_id: selectedTemplate.id,
          field_name: newFieldName.trim().toLowerCase().replace(/\s+/g, '_'),
          field_label: newFieldLabel.trim(),
          field_type: newFieldType,
          sort_order: fields.length + 1
        }])
        .select('*')
        .single()

      if (error) throw error
      
      setFields([...fields, data])
      setNewFieldName('')
      setNewFieldLabel('')
    } catch (e: unknown) {
      alert(`Failed to add field: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  async function handleDeleteField(id: string) {
    try {
      const { error } = await supabase
        .from('document_fields')
        .delete()
        .eq('id', id)

      if (error) throw error
      setFields(fields.filter(f => f.id !== id))
    } catch (e: unknown) {
      alert(`Failed to delete field: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  async function handleUploadPdfTemplate(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedTemplate) return

    try {
      setLoadingPdf(true)
      const fileExt = file.name.split('.').pop()
      const filePath = `${selectedTemplate.id}_form.${fileExt}`

      // Convert file to Base64 to send safely to upload Server Action
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1]
          
          const uploadRes = await uploadFileAction({
            bucket: 'templates',
            path: filePath,
            base64Data,
            mimeType: file.type
          })

          if (!uploadRes.success) {
            throw new Error(uploadRes.error || "Upload failed")
          }

          // Update template file_path in DB
          const { error: updateError } = await supabase
            .from('document_templates')
            .update({ file_path: filePath })
            .eq('id', selectedTemplate.id)

          if (updateError) throw updateError

          // Update selectedTemplate state
          const updatedTemplate = { ...selectedTemplate, file_path: filePath }
          setSelectedTemplate(updatedTemplate)
          setTemplates(templates.map(t => t.id === selectedTemplate.id ? updatedTemplate : t))

          // Trigger automatic field extraction
          await loadPdfFields(filePath)
        } catch (innerError: unknown) {
          alert(`Failed to complete template upload: ${innerError instanceof Error ? innerError.message : String(innerError)}`)
        } finally {
          setLoadingPdf(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (e: unknown) {
      alert(`Failed to upload PDF template: ${e instanceof Error ? e.message : String(e)}`)
      setLoadingPdf(false)
    }
  }

  async function handleSaveMappings() {
    if (!selectedTemplate) return

    try {
      setSavingMapping(true)
      
      const payload = Object.entries(mappings).map(([fieldId, pdfFieldName]) => ({
        fieldId,
        pdfFieldName
      }))

      const res = await saveFieldMappingsAction({
        templateId: selectedTemplate.id,
        mappings: payload
      })

      if (res.success) {
        alert("Field mappings saved successfully!")
      } else {
        throw new Error(res.error)
      }
    } catch (e: unknown) {
      alert(`Failed to save field mappings: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setSavingMapping(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="admin-heading">Document Templates</h1>
          <p className="admin-subheading">Configure visa subclass compliance checklists and map fillable PDF form fields.</p>
        </div>
        <button 
          onClick={() => setShowAddTemplate(true)}
          className="admin-btn-gold"
        >
          <Plus className="w-4 h-4" /> Add Template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Templates List */}
        <div className="admin-card-padded lg:col-span-1 h-fit">
          <h2 className="admin-section-title pb-3 border-b" style={{ borderColor: 'var(--color-admin-card-border)' }}>
            <FileCode className="w-5 h-5" style={{ color: 'var(--color-admin-gold)' }} /> Active Templates
          </h2>
          
          {loadingTemplates ? (
            <div className="admin-loader py-8">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-admin-navy)' }} />
            </div>
          ) : templates.length === 0 ? (
            <p className="admin-cell-muted text-center py-8">No templates configured yet.</p>
          ) : (
            <div className="space-y-2">
              {templates.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedTemplate?.id === tpl.id 
                      ? 'border-[#012269] bg-[#012269]/5' 
                      : 'border-gray-200 bg-[#F9FAFC] hover:border-[#012269]/30'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="admin-cell-primary">{tpl.name}</span>
                    <span className="admin-badge admin-badge-navy">Subclass {tpl.visa_subclass}</span>
                  </div>
                  {tpl.description && <p className="admin-cell-muted mt-1.5 line-clamp-2">{tpl.description}</p>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right / Center Columns: Selected Template Configurations */}
        <div className="lg:col-span-2 space-y-8">
          {selectedTemplate ? (
            <>
              {/* Checklist Fields Editor */}
              <div className="admin-card-padded">
                <div className="flex justify-between items-center mb-6 pb-3 border-b" style={{ borderColor: 'var(--color-admin-card-border)' }}>
                  <div>
                    <h3 className="admin-section-title mb-0">{selectedTemplate.name} — Checklist Fields</h3>
                    <p className="admin-cell-muted mt-1">Configure fields the client must upload or enter for this document checklist.</p>
                  </div>
                </div>

                {loadingFields ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Add Field Inline Form */}
                    <form onSubmit={handleAddField} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl items-end" style={{ background: 'var(--color-admin-table-head)', border: '1px solid var(--color-admin-card-border)' }}>
                      <div className="md:col-span-2 space-y-2">
                        <label className="admin-label block">Field Label</label>
                        <input
                          type="text"
                          required
                          value={newFieldLabel}
                          onChange={(e) => {
                            setNewFieldLabel(e.target.value)
                            setNewFieldName(e.target.value.trim().toLowerCase().replace(/\s+/g, '_'))
                          }}
                          placeholder="e.g. Passport Number"
                          className="admin-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="admin-label block">Field Type</label>
                        <select
                          value={newFieldType}
                          onChange={(e) => setNewFieldType(e.target.value)}
                          className="admin-select"
                        >
                          <option value="text">Short Text</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="textarea">Long text</option>
                          <option value="file">File attachment</option>
                        </select>
                      </div>
                      <button type="submit" className="admin-btn-primary justify-center">
                        Add Field
                      </button>
                    </form>

                    {/* Fields List Table */}
                    {fields.length === 0 ? (
                      <p className="text-gray-500 text-center text-sm py-4">No checklist fields configured.</p>
                    ) : (
                      <div className="admin-table-card">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="admin-thead">
                              <tr>
                                <th className="px-4 py-3">Label</th>
                                <th className="px-4 py-3">Db Key</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="admin-tbody">
                              {fields.map(f => (
                                <tr key={f.id} className="admin-tr">
                                  <td className="px-4 py-3 admin-cell-primary">{f.field_label}</td>
                                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--color-admin-muted)' }}>{f.field_name}</td>
                                  <td className="px-4 py-3"><span className="admin-badge admin-badge-navy capitalize">{f.field_type}</span></td>
                                  <td className="px-4 py-3 text-right">
                                    <button onClick={() => handleDeleteField(f.id)} className="p-1 rounded hover:bg-red-50" style={{ color: 'var(--color-badge-error-text)' }}>
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* PDF AcroForm Field Mapper */}
              <div className="admin-card-padded">
                <div className="flex justify-between items-center mb-6 pb-3 border-b" style={{ borderColor: 'var(--color-admin-card-border)' }}>
                  <div>
                    <h3 className="admin-section-title mb-0">Fillable PDF Form Mapper</h3>
                    <p className="admin-cell-muted mt-1">Upload a fillable PDF form and map its AcroForm keys to the checklist fields above.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Upload Area */}
                  <div className="p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center" style={{ borderColor: 'var(--color-admin-card-border)', background: 'var(--color-admin-table-head)' }}>
                    <UploadCloud className="w-10 h-10 mb-3" style={{ color: 'var(--color-admin-muted)' }} />
                    {selectedTemplate.file_path ? (
                      <div className="mb-4">
                        <p className="admin-cell-primary">✓ Form PDF Uploaded</p>
                        <code className="text-xs block mt-1 font-mono" style={{ color: 'var(--color-admin-gold)' }}>{selectedTemplate.file_path}</code>
                      </div>
                    ) : (
                      <p className="admin-cell-muted mb-4">No PDF file attached to this template yet.</p>
                    )}
                    <label className="admin-btn-primary cursor-pointer">
                      {selectedTemplate.file_path ? 'Change PDF Form' : 'Upload Fillable PDF'}
                      <input type="file" accept="application/pdf" onChange={handleUploadPdfTemplate} className="hidden" />
                    </label>
                  </div>

                  {/* Mapping Fields Grid */}
                  {selectedTemplate.file_path && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-sm text-white">Associate Mappings</h4>
                        <button
                          onClick={handleSaveMappings}
                          disabled={savingMapping}
                          className="admin-btn-gold text-xs py-1.5 px-3"
                        >
                          {savingMapping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Save Mappings
                        </button>
                      </div>

                      {loadingPdf ? (
                        <div className="flex justify-center py-6">
                          <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" />
                        </div>
                      ) : pdfFields.length === 0 ? (
                        <p className="text-xs admin-badge-error p-3 rounded-lg flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          No AcroForm fillable fields detected in this PDF. Please ensure it is a fillable PDF form.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {fields.map(f => (
                            <div key={f.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center p-3.5 rounded-xl" style={{ background: 'var(--color-admin-table-head)', border: '1px solid var(--color-admin-card-border)' }}>
                              <div>
                                <span className="admin-cell-primary block">{f.field_label}</span>
                                <span className="font-mono text-[10px] block mt-0.5" style={{ color: 'var(--color-admin-muted)' }}>{f.field_name}</span>
                              </div>
                              <select
                                value={mappings[f.id] || ''}
                                onChange={(e) => setMappings({ ...mappings, [f.id]: e.target.value })}
                                className="admin-select text-xs"
                              >
                                <option value="">-- Do Not Map --</option>
                                {pdfFields.map(pf => (
                                  <option key={pf.name} value={pf.name}>
                                    {pf.name} ({pf.type})
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="admin-empty">
              <FileCode className="admin-empty-icon" />
              <h3 className="admin-empty-title">No Template Selected</h3>
              <p className="admin-empty-text">Select a document checklist template from the left menu or create a new one to modify parameters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Template Modal Popup */}
      {showAddTemplate && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-backdrop" onClick={() => setShowAddTemplate(false)} />
          <div className="admin-modal-box max-w-md">
            <h3 className="admin-modal-title">Create Document Template</h3>
            
            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div>
                <label className="admin-label block mb-1.5 ml-1">Template Name</label>
                <input name="name" type="text" required placeholder="e.g. Passport Copy Upload" className="admin-input" />
              </div>
              <div>
                <label className="admin-label block mb-1.5 ml-1">Visa Subclass</label>
                <input name="visa_subclass" type="text" required placeholder="e.g. 189" className="admin-input" />
              </div>
              <div>
                <label className="admin-label block mb-1.5 ml-1">Description</label>
                <textarea name="description" rows={3} placeholder="Brief instructions to the client..." className="admin-input resize-none" />
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button type="button" onClick={() => setShowAddTemplate(false)} className="px-4 py-2 text-sm font-semibold" style={{ color: 'var(--color-admin-subtext)' }}>
                  Cancel
                </button>
                <button type="submit" disabled={creatingTemplate} className="admin-btn-gold disabled:opacity-50">
                  {creatingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
