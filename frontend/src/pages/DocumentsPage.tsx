import {
  type ChangeEvent,
  type DragEvent,
  useRef,
  useState,
} from 'react'

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Database,
  FileText,
  Loader2,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
  useDeleteDocument,
  useDocuments,
  useDocumentSearch,
  useUploadDocument,
} from '@/hooks/useDocuments'
import { formatDateTime } from '@/utils/date'

import type {
  DocumentRecord,
  DocumentStatus,
} from '@/types/document'


const ACCEPTED_EXTENSIONS = [
  '.pdf',
  '.docx',
  '.txt',
  '.md',
]

const ACCEPT_VALUE =
  '.pdf,.docx,.txt,.md'


export function DocumentsPage() {
  const fileInputRef =
    useRef<HTMLInputElement>(null)

  const [filenameSearch, setFilenameSearch] =
    useState('')

  const [
    semanticQuery,
    setSemanticQuery,
  ] = useState('')

  const [
    selectedFile,
    setSelectedFile,
  ] = useState<File | null>(null)

  const [
    isDragging,
    setIsDragging,
  ] = useState(false)

  const [
    localMessage,
    setLocalMessage,
  ] = useState<string | null>(null)

  const documentsQuery =
    useDocuments(filenameSearch)

  const uploadMutation =
    useUploadDocument()

  const deleteMutation =
    useDeleteDocument()

  const semanticSearchMutation =
    useDocumentSearch()

  const documents =
    documentsQuery.data?.documents ?? []

  const handleFileSelection = (
    file: File | null,
  ) => {
    setLocalMessage(null)

    if (!file) {
      setSelectedFile(null)
      return
    }

    const extension =
      getFileExtension(file.name)

    if (
      !ACCEPTED_EXTENSIONS.includes(
        extension,
      )
    ) {
      setSelectedFile(null)

      setLocalMessage(
        'Unsupported file type. Please choose a PDF, DOCX, TXT, or Markdown file.',
      )

      return
    }

    setSelectedFile(file)
  }

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0] ?? null

    handleFileSelection(file)

    event.target.value = ''
  }

  const handleDragOver = (
    event: DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault()
    event.stopPropagation()

    setIsDragging(true)
  }

  const handleDragLeave = (
    event: DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault()
    event.stopPropagation()

    setIsDragging(false)
  }

  const handleDrop = (
    event: DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault()
    event.stopPropagation()

    setIsDragging(false)

    const file =
      event.dataTransfer.files?.[0] ??
      null

    handleFileSelection(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setLocalMessage(
        'Select a document before uploading.',
      )
      return
    }

    setLocalMessage(null)

    try {
      const response =
        await uploadMutation.mutateAsync(
          selectedFile,
        )

      setSelectedFile(null)

      setLocalMessage(
        response.message,
      )
    } catch (error) {
      setLocalMessage(
        getErrorMessage(error),
      )
    }
  }

  const handleDelete = async (
    document: DocumentRecord,
  ) => {
    const confirmed = window.confirm(
      `Delete "${document.original_filename}" from your knowledge base?`,
    )

    if (!confirmed) {
      return
    }

    setLocalMessage(null)

    try {
      const response =
        await deleteMutation.mutateAsync(
          document.id,
        )

      setLocalMessage(
        response.message,
      )
    } catch (error) {
      setLocalMessage(
        getErrorMessage(error),
      )
    }
  }

  const handleSemanticSearch = async () => {
    const query =
      semanticQuery.trim()

    if (!query) {
      setLocalMessage(
        'Enter a question or phrase to search your knowledge base.',
      )
      return
    }

    setLocalMessage(null)

    try {
      await semanticSearchMutation.mutateAsync({
        query,
      })
    } catch (error) {
      setLocalMessage(
        getErrorMessage(error),
      )
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section>
        <p className="text-sm font-semibold text-sky-700">
          Phase 2 · Standard RAG
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Documents & Knowledge Base
        </h1>

        <p className="mt-3 max-w-3xl text-slate-600">
          Upload your personal documents and LifeOps AI will
          extract, chunk, embed, and index them for semantic
          retrieval and grounded AI answers.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-sky-50 p-2.5 text-sky-700">
              <UploadCloud
                className="h-5 w-5"
                aria-hidden="true"
              />
            </div>
            <div >
              <h2 className="font-bold text-slate-950">
                Upload document
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                PDF, DOCX, TXT, and Markdown are supported.
                The server enforces the configured upload size
                limit.
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_VALUE}
            className="hidden"
            onChange={handleInputChange}
          />

          <div
            className={[
              'mt-5 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition',
              isDragging
                ? 'border-sky-500 bg-sky-50'
                : 'border-slate-200 bg-slate-50',
            ].join(' ')}
            onDragEnter={handleDragOver}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <UploadCloud
              className="mx-auto h-9 w-9 text-slate-400"
              aria-hidden="true"
            />

            <p className="mt-3 font-semibold text-slate-900">
              Drop a document here
            </p>

            <p className="mt-1 text-sm text-slate-500">
              or select one from your computer
            </p>

            <Button
              type="button"
              variant="secondary"
              className="mt-5"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={uploadMutation.isPending}
            >
              Choose file
            </Button>
          </div>

          {selectedFile ? (
            <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="rounded-lg bg-slate-100 p-2">
                  <FileText
                    className="h-5 w-5 text-slate-600"
                    aria-hidden="true"
                  />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {selectedFile.name}
                  </p>

                  <p className="text-xs text-slate-500">
                    {formatBytes(
                      selectedFile.size,
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                onClick={() =>
                  setSelectedFile(null)
                }
                disabled={uploadMutation.isPending}
                aria-label="Remove selected file"
              >
                <X
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </button>
            </div>
          ) : null}

          <Button
            type="button"
            className="mt-4 w-full"
            disabled={
              !selectedFile ||
              uploadMutation.isPending
            }
            onClick={() =>
              void handleUpload()
            }
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                Uploading & indexing…
              </>
            ) : (
              <>
                <UploadCloud
                  className="mr-2 h-4 w-4"
                  aria-hidden="true"
                />
                Upload to knowledge base
              </>
            )}
          </Button>
        </Card>

     
      </section>

      {localMessage ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
          {localMessage}
        </div>
      ) : null}

      <section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Your documents
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {documentsQuery.data
                ? `${documentsQuery.data.total} document${
                    documentsQuery.data.total ===
                    1
                      ? ''
                      : 's'
                  } in your knowledge base`
                : 'Loading your knowledge base…'}
            </p>
          </div>

          <div className="relative w-full sm:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />

            <input
              type="search"
              value={filenameSearch}
              onChange={(event) =>
                setFilenameSearch(
                  event.target.value,
                )
              }
              placeholder="Filter by filename…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>
        </div>

        {documentsQuery.isLoading ? (
          <Card className="mt-4">
            <div className="flex items-center justify-center gap-3 py-10 text-sm text-slate-500">
              <Loader2
                className="h-5 w-5 animate-spin"
                aria-hidden="true"
              />
              Loading documents…
            </div>
          </Card>
        ) : null}

        {documentsQuery.isError ? (
          <Card className="mt-4">
            <div className="py-8 text-center">
              <AlertCircle
                className="mx-auto h-8 w-8 text-rose-500"
                aria-hidden="true"
              />

              <p className="mt-3 font-semibold text-slate-900">
                Unable to load documents
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {documentsQuery.error.message}
              </p>

              <Button
                type="button"
                variant="secondary"
                className="mt-4"
                onClick={() =>
                  void documentsQuery.refetch()
                }
              >
                Try again
              </Button>
            </div>
          </Card>
        ) : null}

        {!documentsQuery.isLoading &&
        !documentsQuery.isError &&
        documents.length === 0 ? (
          <Card className="mt-4">
            <div className="py-10 text-center">
              <Database
                className="mx-auto h-10 w-10 text-slate-300"
                aria-hidden="true"
              />

              <h3 className="mt-4 font-bold text-slate-900">
                {filenameSearch.trim()
                  ? 'No matching documents'
                  : 'Your knowledge base is empty'}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                {filenameSearch.trim()
                  ? 'Try another filename or clear the search filter.'
                  : 'Upload your first PDF, DOCX, TXT, or Markdown file to start building your RAG knowledge base.'}
              </p>
            </div>
          </Card>
        ) : null}

        {documents.length > 0 ? (
          <div className="mt-4 grid gap-4">
            {documents.map(
              (document) => (
                <Card
                  key={document.id}
                  className="p-0"
                >
                  <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="rounded-xl bg-slate-100 p-3">
                        <FileText
                          className="h-5 w-5 text-slate-600"
                          aria-hidden="true"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="max-w-xl truncate font-semibold text-slate-950">
                            {
                              document.original_filename
                            }
                          </p>

                          <StatusBadge
                            status={
                              document.status
                            }
                          />
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>
                            {document.file_extension
                              .replace(
                                '.',
                                '',
                              )
                              .toUpperCase()}
                          </span>

                          <span>
                            {formatBytes(
                              document.file_size,
                            )}
                          </span>

                          <span>
                            Uploaded{' '}
                            {formatDateTime(
                              document.created_at,
                            )}
                          </span>
                        </div>

                        {document.status ===
                          'failed' &&
                        document.processing_error ? (
                          <p className="mt-2 max-w-2xl text-sm text-rose-600">
                            {
                              document.processing_error
                            }
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      className="shrink-0 border-rose-200 text-rose-700 hover:bg-rose-50"
                      disabled={
                        deleteMutation.isPending
                      }
                      onClick={() =>
                        void handleDelete(
                          document,
                        )
                      }
                    >
                      {deleteMutation.isPending ? (
                        <Loader2
                          className="mr-2 h-4 w-4 animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <Trash2
                          className="mr-2 h-4 w-4"
                          aria-hidden="true"
                        />
                      )}

                      Delete
                    </Button>
                  </div>
                </Card>
              ),
            )}
          </div>
        ) : null}
      </section>
    </div>
  )
}


function StatusBadge({
  status,
}: {
  status: DocumentStatus
}) {
  if (status === 'indexed') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <CheckCircle2
          className="h-3.5 w-3.5"
          aria-hidden="true"
        />
        Indexed
      </span>
    )
  }

  if (status === 'failed') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
        <AlertCircle
          className="h-3.5 w-3.5"
          aria-hidden="true"
        />
        Failed
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
      <Clock3
        className="h-3.5 w-3.5"
        aria-hidden="true"
      />
      Processing
    </span>
  )
}


function getFileExtension(
  filename: string,
): string {
  const dotIndex =
    filename.lastIndexOf('.')

  if (dotIndex < 0) {
    return ''
  }

  return filename
    .slice(dotIndex)
    .toLowerCase()
}


function formatBytes(
  bytes: number,
): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  const kilobytes =
    bytes / 1024

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`
  }

  const megabytes =
    kilobytes / 1024

  return `${megabytes.toFixed(1)} MB`
}


function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred.'
}