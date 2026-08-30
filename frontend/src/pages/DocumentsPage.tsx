import { type ChangeEvent, type DragEvent, useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Database,
  FileSearch,
  FileText,
  Loader2,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
  useDeleteDocument,
  useDocuments,
  useDocumentSearch,
  useUploadDocument,
} from '@/hooks/useDocuments'
import { formatDateTime } from '@/utils/date'

import type { DocumentRecord, DocumentStatus } from '@/types/document'

const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md']
const ACCEPT_VALUE = '.pdf,.docx,.txt,.md'
const easeOut = [0.22, 1, 0.36, 1] as const

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOut },
  },
}

const darkCardClass =
  '!rounded-[24px] !border-white/[0.08] !bg-white/[0.035] !text-white !shadow-[0_24px_80px_-45px_rgba(0,0,0,0.95)] backdrop-blur-xl'

const inputClassName =
  'w-full rounded-xl border border-white/10 bg-white/[0.045] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 hover:border-white/15 focus:border-cyan-300/40 focus:bg-white/[0.06] focus:ring-4 focus:ring-cyan-300/[0.07]'

export function DocumentsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const shouldReduceMotion = useReducedMotion()

  const [filenameSearch, setFilenameSearch] = useState('')
  const [semanticQuery, setSemanticQuery] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [localMessage, setLocalMessage] = useState<string | null>(null)

  const documentsQuery = useDocuments(filenameSearch)
  const uploadMutation = useUploadDocument()
  const deleteMutation = useDeleteDocument()
  const semanticSearchMutation = useDocumentSearch()

  const documents = documentsQuery.data?.documents ?? []

  const handleFileSelection = (file: File | null) => {
    setLocalMessage(null)

    if (!file) {
      setSelectedFile(null)
      return
    }

    const extension = getFileExtension(file.name)

    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setSelectedFile(null)
      setLocalMessage(
        'Unsupported file type. Please choose a PDF, DOCX, TXT, or Markdown file.',
      )
      return
    }

    setSelectedFile(file)
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    handleFileSelection(file)
    event.target.value = ''
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0] ?? null
    handleFileSelection(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setLocalMessage('Select a document before uploading.')
      return
    }

    setLocalMessage(null)

    try {
      const response = await uploadMutation.mutateAsync(selectedFile)
      setSelectedFile(null)
      setLocalMessage(response.message)
    } catch (error) {
      setLocalMessage(getErrorMessage(error))
    }
  }

  const handleDelete = async (document: DocumentRecord) => {
    const confirmed = window.confirm(
      `Delete "${document.original_filename}" from your knowledge base?`,
    )

    if (!confirmed) return

    setLocalMessage(null)

    try {
      const response = await deleteMutation.mutateAsync(document.id)
      setLocalMessage(response.message)
    } catch (error) {
      setLocalMessage(getErrorMessage(error))
    }
  }

  const handleSemanticSearch = async () => {
    const query = semanticQuery.trim()

    if (!query) {
      setLocalMessage('Enter a question or phrase to search your knowledge base.')
      return
    }

    setLocalMessage(null)

    try {
      await semanticSearchMutation.mutateAsync({ query })
    } catch (error) {
      setLocalMessage(getErrorMessage(error))
    }
  }

  const indexedDocuments = documents.filter((document) => document.status === 'indexed').length
  const processingDocuments = documents.filter((document) => document.status === 'processing').length

  return (
    <motion.div
      variants={containerVariants}
      initial={shouldReduceMotion ? false : 'hidden'}
      animate="visible"
      className="relative mx-auto w-full max-w-[1360px] overflow-hidden rounded-[32px] border border-white/[0.07] bg-[#05070b] p-4 text-white shadow-[0_35px_120px_-50px_rgba(0,0,0,0.95)] sm:p-6 lg:p-7"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_90%_8%,rgba(139,92,246,0.11),transparent_28%),linear-gradient(to_bottom,#05070b,#070a11_55%,#05070b)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px] opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />

      <motion.section variants={itemVariants} className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-400/[0.075] blur-3xl" />
        <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1.5 text-xs font-semibold text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Phase 2 · Standard RAG
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl lg:text-[2.65rem]">
              Documents & Knowledge Base
              <span className="mt-1 block bg-gradient-to-r from-cyan-200 via-sky-300 to-violet-300 bg-clip-text text-transparent">
                your private context layer for LifeOps.
              </span>
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 sm:text-[15px]">
              Upload personal documents and LifeOps AI will extract, chunk, embed, and index them for semantic retrieval and grounded answers.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:min-w-[330px]">
            <MetricPill label="Documents" value={documentsQuery.data?.total ?? 0} />
            <MetricPill label="Indexed" value={indexedDocuments} accent="emerald" />
            <MetricPill label="Processing" value={processingDocuments} accent="amber" className="col-span-2 sm:col-span-1" />
          </div>
        </div>
      </motion.section>

      <motion.section variants={itemVariants} className="mt-5 grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
        <Card className={`${darkCardClass} !p-5 sm:!p-6`}>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.055] text-cyan-200">
              <UploadCloud className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Ingestion</p>
              <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-white">Upload document</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                PDF, DOCX, TXT, and Markdown are supported. The server still enforces your configured upload-size limit.
              </p>
            </div>
          </div>

          <input ref={fileInputRef} type="file" accept={ACCEPT_VALUE} className="hidden" onChange={handleInputChange} />

          <motion.div
            animate={shouldReduceMotion ? undefined : isDragging ? { scale: 1.01 } : { scale: 1 }}
            className={[
              'relative mt-5 overflow-hidden rounded-2xl border border-dashed px-6 py-10 text-center transition-colors',
              isDragging ? 'border-cyan-300/45 bg-cyan-300/[0.08]' : 'border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.04]',
            ].join(' ')}
            onDragEnter={handleDragOver}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.08),transparent_44%)]" />
            <div className="relative">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] text-slate-300 shadow-[0_16px_45px_-25px_rgba(34,211,238,0.6)]">
                <UploadCloud className="h-6 w-6" aria-hidden="true" />
              </div>
              <p className="mt-4 font-semibold text-slate-100">Drop a document here</p>
              <p className="mt-1 text-sm text-slate-500">or select one from your computer</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {['PDF', 'DOCX', 'TXT', 'MD'].map((type) => (
                  <span key={type} className="rounded-lg border border-white/[0.07] bg-black/10 px-2 py-1 text-[10px] font-semibold tracking-[0.12em] text-slate-500">{type}</span>
                ))}
              </div>
              <Button type="button" variant="secondary" className="mt-5 !border-white/10 !bg-white/[0.055] !text-slate-200 hover:!bg-white/[0.1] focus:!ring-cyan-300/30 focus:!ring-offset-[#05070b]" onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
                Choose file
              </Button>
            </div>
          </motion.div>

          <AnimatePresence initial={false}>
            {selectedFile ? (
              <motion.div initial={shouldReduceMotion ? false : { opacity: 0, y: 8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6, height: 0 }} className="mt-4 overflow-hidden">
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.045] p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-cyan-200">
                      <FileText className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-100">{selectedFile.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{formatBytes(selectedFile.size)}</p>
                    </div>
                  </div>
                  <button type="button" className="rounded-xl p-2 text-slate-500 transition hover:bg-white/[0.07] hover:text-white" onClick={() => setSelectedFile(null)} disabled={uploadMutation.isPending} aria-label="Remove selected file">
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <Button type="button" className="mt-4 w-full !bg-white !text-slate-950 hover:!bg-cyan-50 focus:!ring-cyan-300 focus:!ring-offset-[#05070b]" disabled={!selectedFile || uploadMutation.isPending} onClick={() => void handleUpload()}>
            {uploadMutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Uploading & indexing…</>
            ) : (
              <><UploadCloud className="mr-2 h-4 w-4" aria-hidden="true" />Upload to knowledge base</>
            )}
          </Button>
        </Card>

  
      </motion.section>

      <AnimatePresence initial={false}>
        {localMessage ? (
          <motion.div initial={shouldReduceMotion ? false : { opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }} className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-slate-300 shadow-[0_12px_45px_-35px_rgba(0,0,0,0.9)]">
            {localMessage}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.section variants={itemVariants} className="mt-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Knowledge library</p>
            <h2 className="mt-1.5 text-xl font-semibold tracking-[-0.025em] text-white">Your documents</h2>
            <p className="mt-1 text-sm text-slate-500">
              {documentsQuery.data
                ? `${documentsQuery.data.total} document${documentsQuery.data.total === 1 ? '' : 's'} in your knowledge base`
                : 'Loading your knowledge base…'}
            </p>
          </div>

          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" aria-hidden="true" />
            <input type="search" value={filenameSearch} onChange={(event) => setFilenameSearch(event.target.value)} placeholder="Filter by filename…" className={`${inputClassName} pl-10`} />
          </div>
        </div>

        {documentsQuery.isLoading ? (
          <Card className={`${darkCardClass} mt-4 !p-5`}>
            <div className="space-y-3 py-2" aria-label="Loading documents" aria-busy="true">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 motion-reduce:animate-none">
                  <div className="h-4 w-48 rounded bg-white/[0.08]" />
                  <div className="mt-3 h-3 w-72 max-w-full rounded bg-white/[0.05]" />
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {documentsQuery.isError ? (
          <Card className={`${darkCardClass} mt-4 !p-6`}>
            <div className="py-7 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-rose-300" aria-hidden="true" />
              <p className="mt-3 font-semibold text-slate-100">Unable to load documents</p>
              <p className="mt-1 text-sm text-slate-500">{documentsQuery.error.message}</p>
              <Button type="button" variant="secondary" className="mt-4 !border-white/10 !bg-white/[0.05] !text-slate-200 hover:!bg-white/[0.09]" onClick={() => void documentsQuery.refetch()}>Try again</Button>
            </div>
          </Card>
        ) : null}

        {!documentsQuery.isLoading && !documentsQuery.isError && documents.length === 0 ? (
          <Card className={`${darkCardClass} mt-4 !p-6`}>
            <div className="py-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035]">
                <Database className="h-6 w-6 text-slate-600" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-200">{filenameSearch.trim() ? 'No matching documents' : 'Your knowledge base is empty'}</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {filenameSearch.trim() ? 'Try another filename or clear the search filter.' : 'Upload your first PDF, DOCX, TXT, or Markdown file to start building your RAG knowledge base.'}
              </p>
            </div>
          </Card>
        ) : null}

        {documents.length > 0 ? (
          <div className="mt-4 grid gap-3">
            {documents.map((document, index) => (
              <motion.div key={document.id} initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: shouldReduceMotion ? 0 : index * 0.035 }} whileHover={shouldReduceMotion ? undefined : { y: -2 }}>
                <Card className={`${darkCardClass} !p-0 transition-colors hover:!border-cyan-300/15 hover:!bg-white/[0.045]`}>
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.04] text-slate-400">
                        <FileText className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="max-w-xl truncate font-semibold text-slate-100">{document.original_filename}</p>
                          <StatusBadge status={document.status} />
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                          <span>{document.file_extension.replace('.', '').toUpperCase()}</span>
                          <span>{formatBytes(document.file_size)}</span>
                          <span>Uploaded {formatDateTime(document.created_at)}</span>
                        </div>
                        {document.status === 'failed' && document.processing_error ? <p className="mt-2 max-w-2xl text-sm leading-6 text-rose-300/80">{document.processing_error}</p> : null}
                      </div>
                    </div>

                    <Button type="button" variant="secondary" className="shrink-0 !border-rose-300/10 !bg-rose-300/[0.045] !text-rose-200 hover:!bg-rose-300/[0.09]" disabled={deleteMutation.isPending} onClick={() => void handleDelete(document)}>
                      {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />}
                      Delete
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : null}
      </motion.section>
    </motion.div>
  )
}

function MetricPill({ label, value, accent = 'slate', className = '' }: { label: string; value: number; accent?: 'slate' | 'emerald' | 'amber'; className?: string }) {
  const accentClass = accent === 'emerald' ? 'text-emerald-200' : accent === 'amber' ? 'text-amber-200' : 'text-white'
  return (
    <div className={`rounded-2xl border border-white/[0.07] bg-white/[0.035] px-3.5 py-3 ${className}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">{label}</p>
      <p className={`mt-1 text-xl font-semibold tracking-[-0.03em] ${accentClass}`}>{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: DocumentStatus }) {
  if (status === 'indexed') {
    return <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/10 bg-emerald-300/[0.055] px-2.5 py-1 text-xs font-semibold text-emerald-200"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />Indexed</span>
  }
  if (status === 'failed') {
    return <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-300/10 bg-rose-300/[0.055] px-2.5 py-1 text-xs font-semibold text-rose-200"><AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />Failed</span>
  }
  return <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/10 bg-amber-300/[0.055] px-2.5 py-1 text-xs font-semibold text-amber-200"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />Processing</span>
}

function getFileExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf('.')
  if (dotIndex < 0) return ''
  return filename.slice(dotIndex).toLowerCase()
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kilobytes = bytes / 1024
  if (kilobytes < 1024) return `${kilobytes.toFixed(1)} KB`
  const megabytes = kilobytes / 1024
  return `${megabytes.toFixed(1)} MB`
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'An unexpected error occurred.'
}
