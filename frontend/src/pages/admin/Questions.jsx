import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit2, Trash2, Search, Upload, Download, X, Check } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import Button from '@components/ui/Button'
import Input from '@components/ui/Input'
import Modal from '@components/ui/Modal'
import { Badge } from '@components/ui/Badge'
import { SkeletonTable } from '@components/ui/Skeleton'
import { questionService } from '@services/admin.service'

const TYPES = ['easy', 'intermediate', 'hard']

function TypeTab({ type, active, count, onClick }) {
  const colors = { easy: 'var(--success)', intermediate: 'var(--warning)', hard: 'var(--danger)' }
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all"
      style={{
        background: active ? 'var(--bg-card)' : 'transparent',
        color: active ? colors[type] : 'var(--text-muted)',
        border: active ? `1px solid ${colors[type]}40` : '1px solid transparent',
        boxShadow: active ? 'var(--shadow-card)' : 'none',
      }}
    >
      <span className="capitalize">{type}</span>
      <span
        className="px-1.5 py-0.5 rounded text-xs"
        style={{ background: active ? `${colors[type]}15` : 'var(--bg-secondary)' }}
      >
        {count}
      </span>
    </button>
  )
}

const EMPTY_QUESTION = {
  type: 'easy', title: '', description: '', code_snippet: '',
  options: ['', '', '', ''], correct_option: 0, correct_code: '',
  test_cases: [{ input: '', expected_output: '', is_hidden: false }],
}

function QuestionForm({ question, onSave, onClose, isSaving }) {
  const [form, setForm] = useState(question || EMPTY_QUESTION)

  const handleOption = (i, val) => {
    const opts = [...form.options]
    opts[i] = val
    setForm((f) => ({ ...f, options: opts }))
  }

  const handleTC = (i, field, val) => {
    const tcs = [...form.test_cases]
    tcs[i] = { ...tcs[i], [field]: val }
    setForm((f) => ({ ...f, test_cases: tcs }))
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSave(form) }}
      className="space-y-5 max-h-[70vh] overflow-y-auto pr-1"
    >
      {/* Type */}
      <div className="flex gap-2">
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setForm((f) => ({ ...f, type: t }))}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
            style={{
              background: form.type === t ? 'var(--accent-primary)' : 'var(--bg-secondary)',
              color: form.type === t ? '#fff' : 'var(--text-muted)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <Input label="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
      <div>
        <label className="label">Description / Question</label>
        <textarea
          className="input min-h-24 resize-y"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Enter the question text..."
          required
        />
      </div>
      <div>
        <label className="label">Code Snippet (optional)</label>
        <textarea
          className="input font-mono text-xs min-h-20 resize-y"
          value={form.code_snippet}
          onChange={(e) => setForm((f) => ({ ...f, code_snippet: e.target.value }))}
          placeholder="Optional code block shown with the question..."
        />
      </div>

      {/* Easy: Options */}
      {form.type === 'easy' && (
        <div>
          <label className="label">Options</label>
          <div className="space-y-2.5">
            {form.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, correct_option: i }))}
                  className="w-7 h-7 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
                  style={{
                    borderColor: form.correct_option === i ? 'var(--success)' : 'var(--border-strong)',
                    background: form.correct_option === i ? 'var(--success)' : 'transparent',
                  }}
                >
                  {form.correct_option === i && <Check size={14} color="#fff" />}
                </button>
                <Input
                  placeholder={`Option ${['A','B','C','D'][i]}`}
                  value={opt}
                  onChange={(e) => handleOption(i, e.target.value)}
                  className="flex-1"
                />
              </div>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Click the circle to mark the correct answer.</p>
        </div>
      )}

      {/* Intermediate: Correct code */}
      {form.type === 'intermediate' && (
        <div>
          <label className="label">Correct Code (for the blank)</label>
          <input
            className="input font-mono"
            value={form.correct_code}
            onChange={(e) => setForm((f) => ({ ...f, correct_code: e.target.value }))}
            placeholder="The correct snippet that fills the blank"
          />
        </div>
      )}

      {/* Hard: Test cases */}
      {form.type === 'hard' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Test Cases</label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => setForm((f) => ({ ...f, test_cases: [...f.test_cases, { input: '', expected_output: '', is_hidden: false }] }))}
            >
              Add Case
            </Button>
          </div>
          <div className="space-y-3">
            {form.test_cases.map((tc, i) => (
              <div key={i} className="p-3 rounded-xl space-y-2" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Test {i + 1}</span>
                  <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                    <input
                      type="checkbox"
                      checked={tc.is_hidden}
                      onChange={(e) => handleTC(i, 'is_hidden', e.target.checked)}
                    />
                    Hidden
                  </label>
                </div>
                <Input placeholder="Input" value={tc.input} onChange={(e) => handleTC(i, 'input', e.target.value)} />
                <Input placeholder="Expected Output" value={tc.expected_output} onChange={(e) => handleTC(i, 'expected_output', e.target.value)} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary" className="flex-1" loading={isSaving}>
          {question?._id ? 'Update Question' : 'Create Question'}
        </Button>
      </div>
    </form>
  )
}

export function QuestionsPage() {
  const [activeType, setActiveType] = useState('easy')
  const [search, setSearch] = useState('')
  const [editQ, setEditQ] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef(null)
  const queryClient = useQueryClient()

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsImporting(true)
    
    try {
      const text = await file.text()
      let parsedQuestions = []

      if (file.name.endsWith('.json')) {
        parsedQuestions = JSON.parse(text)
        if (!Array.isArray(parsedQuestions)) parsedQuestions = [parsedQuestions]
      } else if (file.name.endsWith('.csv')) {
        const rows = []
        let curr = '', inQuotes = false
        let row = []
        for (let i = 0; i < text.length; i++) {
          const char = text[i]
          if (char === '"') {
             if (inQuotes && text[i+1] === '"') { curr += '"'; i++; } 
             else { inQuotes = !inQuotes }
          }
          else if (char === ',' && !inQuotes) { row.push(curr); curr = '' }
          else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && text[i+1] === '\n') i++; 
            row.push(curr); curr = '';
            if (row.some(c => c.trim())) rows.push([...row])
            row = []
          }
          else curr += char
        }
        if (curr || row.length) { row.push(curr); if (row.some(c => c.trim())) rows.push(row) }

        if (rows.length > 1) {
          const headers = rows[0].map(h => h.trim().toLowerCase())
          parsedQuestions = rows.slice(1).map(row => {
            const q = { type: activeType, options: ['', '', '', ''], test_cases: [] }
            headers.forEach((h, i) => {
              let val = row[i]?.trim() || ''
              if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
              
              if (h === 'title' || h === 'phase') q.title = val
              else if (h === 'description' || h === 'question') q.description = val
              else if (h === 'type') q.type = val?.toLowerCase()
              else if (h.startsWith('option_')) {
                const optIdx = parseInt(h.split('_')[1]) - 1
                if (optIdx >= 0 && optIdx < 4) q.options[optIdx] = val
              }
              else if (h === 'correct_option') q.correct_option = parseInt(val) || 0
              else if (h === 'code_snippet' || h === 'code') q.code_snippet = val
              else if (h === 'correct_code' || h === 'answer') q.correct_code = val
            })
            return { ...EMPTY_QUESTION, ...q }
          })
        }
      } else {
        throw new Error('Unsupported format')
      }

      let successCount = 0
      for (const q of parsedQuestions) {
        await questionService.create({ ...EMPTY_QUESTION, type: activeType, ...q })
        successCount++
      }
      
      queryClient.invalidateQueries(['questions', activeType])
      toast.success(`Successfully imported ${successCount} questions!`)
    } catch (error) {
      console.error(error)
      toast.error('Failed to import questions. Check file format.')
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ['questions', activeType],
    queryFn: () => questionService.getAll(activeType).then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (q) => q._id ? questionService.update(q._id, q) : questionService.create(q),
    onSuccess: () => {
      queryClient.invalidateQueries(['questions', activeType])
      toast.success(editQ?._id ? 'Question updated!' : 'Question created!')
      setShowForm(false)
      setEditQ(null)
    },
    onError: () => toast.error('Failed to save question'),
  })

  const deleteMutation = useMutation({
    mutationFn: questionService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries(['questions', activeType])
      toast.success('Question deleted')
    },
  })

  const deleteAllMutation = useMutation({
    mutationFn: (type) => questionService.removeAll(type),
    onSuccess: () => {
      queryClient.invalidateQueries(['questions', activeType])
      toast.success(`All ${activeType} questions deleted!`)
    },
  })

  const questions = (data?.questions || []).filter((q) =>
    q.title?.toLowerCase().includes(search.toLowerCase())
  )

  const typeCounts = { easy: data?.counts?.easy || 0, intermediate: data?.counts?.intermediate || 0, hard: data?.counts?.hard || 0 }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display, var(--font-sans))' }}>
            Questions
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Manage the question bank</p>
        </div>
        <div className="flex gap-2">
          <Button variant="danger" size="sm" leftIcon={<Trash2 size={15} />}
            loading={deleteAllMutation.isPending}
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete ALL ${activeType} questions? This cannot be undone.`)) {
                deleteAllMutation.mutate(activeType)
              }
            }}>Delete All</Button>

          <Button variant="secondary" size="sm" leftIcon={<Upload size={15} />}
            loading={isImporting}
            onClick={() => fileInputRef.current?.click()}>Import</Button>
          <input type="file" ref={fileInputRef} hidden accept=".csv,.json" onChange={handleFileUpload} />
          
          <Button variant="secondary" size="sm" leftIcon={<Download size={15} />}
            onClick={() => questionService.exportAll()}>Export</Button>
          <Button variant="primary" size="sm" leftIcon={<Plus size={15} />}
            onClick={() => { setEditQ(null); setShowForm(true) }}>New Question</Button>
        </div>
      </div>

      {/* Type tabs */}
      <div
        className="flex gap-2 p-1.5 rounded-xl mb-6 w-fit"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      >
        {TYPES.map((t) => (
          <TypeTab
            key={t}
            type={t}
            active={activeType === t}
            count={typeCounts[t]}
            onClick={() => setActiveType(t)}
          />
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input type="text" className="input pl-10" placeholder="Search questions..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? <SkeletonTable rows={6} cols={4} /> : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q, i) => (
                <tr key={q._id}>
                  <td className="text-xs font-mono" style={{ color: 'var(--text-faint)' }}>{i + 1}</td>
                  <td className="font-medium max-w-xs truncate" style={{ color: 'var(--text-primary)' }}>{q.title}</td>
                  <td><Badge variant={q.type === 'easy' ? 'success' : q.type === 'intermediate' ? 'warning' : 'danger'} className="capitalize">{q.type}</Badge></td>
                  <td><Badge variant={q.is_active ? 'success' : 'muted'}>{q.is_active ? 'Active' : 'Inactive'}</Badge></td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditQ(q); setShowForm(true) }}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Delete this question?')) deleteMutation.mutate(q._id)
                        }}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--danger)' }}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {questions.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
                    No questions found. Create one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditQ(null) }}
        title={editQ ? 'Edit Question' : 'New Question'}
        size="lg"
      >
        <QuestionForm
          question={editQ}
          onSave={createMutation.mutate}
          onClose={() => { setShowForm(false); setEditQ(null) }}
          isSaving={createMutation.isPending}
        />
      </Modal>
    </div>
  )
}

export default QuestionsPage
