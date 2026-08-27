import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  deleteDocument,
  getDocument,
  getDocuments,
  getDocumentStatus,
  searchDocuments,
  uploadDocument,
} from '@/api/documents'
import { useAuth } from '@/auth/AuthProvider'

import type {
  DocumentSearchInput,
} from '@/types/document'


const DOCUMENTS_QUERY_KEY = [
  'documents',
] as const


export function useDocuments(
  search = '',
) {
  const {
    isAuthenticated,
    getAccessToken,
  } = useAuth()

  const normalizedSearch = search.trim()

  return useQuery({
    queryKey: [
      ...DOCUMENTS_QUERY_KEY,
      'list',
      normalizedSearch,
    ],
    enabled: isAuthenticated,
    queryFn: async () => {
      const accessToken =
        await getAccessToken()

      return getDocuments(
        accessToken,
        normalizedSearch || undefined,
      )
    },
    staleTime: 15_000,
  })
}


export function useDocument(
  documentId: string | null,
) {
  const {
    isAuthenticated,
    getAccessToken,
  } = useAuth()

  return useQuery({
    queryKey: [
      ...DOCUMENTS_QUERY_KEY,
      'detail',
      documentId,
    ],
    enabled:
      isAuthenticated &&
      Boolean(documentId),
    queryFn: async () => {
      if (!documentId) {
        throw new Error(
          'Document ID is required',
        )
      }

      const accessToken =
        await getAccessToken()

      return getDocument(
        accessToken,
        documentId,
      )
    },
    staleTime: 15_000,
  })
}


export function useDocumentStatus(
  documentId: string | null,
) {
  const {
    isAuthenticated,
    getAccessToken,
  } = useAuth()

  return useQuery({
    queryKey: [
      ...DOCUMENTS_QUERY_KEY,
      'status',
      documentId,
    ],
    enabled:
      isAuthenticated &&
      Boolean(documentId),
    queryFn: async () => {
      if (!documentId) {
        throw new Error(
          'Document ID is required',
        )
      }

      const accessToken =
        await getAccessToken()

      return getDocumentStatus(
        accessToken,
        documentId,
      )
    },
    staleTime: 5_000,
  })
}


export function useUploadDocument() {
  const {
    getAccessToken,
  } = useAuth()

  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: async (
      file: File,
    ) => {
      const accessToken =
        await getAccessToken()

      return uploadDocument(
        accessToken,
        file,
      )
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: DOCUMENTS_QUERY_KEY,
      })
    },
  })
}


export function useDeleteDocument() {
  const {
    getAccessToken,
  } = useAuth()

  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: async (
      documentId: string,
    ) => {
      const accessToken =
        await getAccessToken()

      return deleteDocument(
        accessToken,
        documentId,
      )
    },

    onSuccess: async (
      _response,
      documentId,
    ) => {
      queryClient.removeQueries({
        queryKey: [
          ...DOCUMENTS_QUERY_KEY,
          'detail',
          documentId,
        ],
      })

      queryClient.removeQueries({
        queryKey: [
          ...DOCUMENTS_QUERY_KEY,
          'status',
          documentId,
        ],
      })

      await queryClient.invalidateQueries({
        queryKey: DOCUMENTS_QUERY_KEY,
      })
    },
  })
}


export function useDocumentSearch() {
  const {
    getAccessToken,
  } = useAuth()

  return useMutation({
    mutationFn: async (
      input: DocumentSearchInput,
    ) => {
      const normalizedQuery =
        input.query.trim()

      if (!normalizedQuery) {
        throw new Error(
          'Search query cannot be empty',
        )
      }

      const accessToken =
        await getAccessToken()

      return searchDocuments(
        accessToken,
        {
          ...input,
          query: normalizedQuery,
        },
      )
    },
  })
}