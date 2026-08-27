import { apiRequest } from './client'

import type {
  DocumentDeleteResponse,
  DocumentDetail,
  DocumentListResponse,
  DocumentSearchInput,
  DocumentSearchResponse,
  DocumentStatusResponse,
  DocumentUploadResponse,
} from '@/types/document'


export function uploadDocument(
  accessToken: string,
  file: File,
): Promise<DocumentUploadResponse> {
  const formData = new FormData()

  formData.append(
    'file',
    file,
  )

  return apiRequest<DocumentUploadResponse>(
    '/documents/upload',
    accessToken,
    {
      method: 'POST',
      body: formData,
    },
  )
}


export function getDocuments(
  accessToken: string,
  search?: string,
): Promise<DocumentListResponse> {
  const normalizedSearch = search?.trim()

  const params = new URLSearchParams()

  if (normalizedSearch) {
    params.set(
      'search',
      normalizedSearch,
    )
  }

  const query = params.toString()

  const path = query
    ? `/documents?${query}`
    : '/documents'

  return apiRequest<DocumentListResponse>(
    path,
    accessToken,
  )
}


export function getDocument(
  accessToken: string,
  documentId: string,
): Promise<DocumentDetail> {
  return apiRequest<DocumentDetail>(
    `/documents/${encodeURIComponent(documentId)}`,
    accessToken,
  )
}


export function getDocumentStatus(
  accessToken: string,
  documentId: string,
): Promise<DocumentStatusResponse> {
  return apiRequest<DocumentStatusResponse>(
    `/documents/${encodeURIComponent(documentId)}/status`,
    accessToken,
  )
}


export function deleteDocument(
  accessToken: string,
  documentId: string,
): Promise<DocumentDeleteResponse> {
  return apiRequest<DocumentDeleteResponse>(
    `/documents/${encodeURIComponent(documentId)}`,
    accessToken,
    {
      method: 'DELETE',
    },
  )
}


export function searchDocuments(
  accessToken: string,
  input: DocumentSearchInput,
): Promise<DocumentSearchResponse> {
  return apiRequest<DocumentSearchResponse>(
    '/documents/search',
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
}