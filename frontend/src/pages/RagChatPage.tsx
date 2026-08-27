import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  Bot,
  BookOpen,
  FileText,
  Loader2,
  MessageSquareText,
  Send,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useRagChat } from '@/hooks/useRagChat'

import type {
  ChatMessage,
  RagCitation,
} from '@/types/chat'


const EXAMPLE_QUESTIONS = [
  'Summarize the key information in my documents.',
  'What important dates are mentioned in my documents?',
  'What policies or rules are described in my knowledge base?',
]


export function RagChatPage() {
  const [question, setQuestion] =
    useState('')

  const [messages, setMessages] =
    useState<ChatMessage[]>([])

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null)

  const messagesEndRef =
    useRef<HTMLDivElement>(null)

  const ragChat =
    useRagChat()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages, ragChat.isPending])

  const submitQuestion = async (
    rawQuestion: string,
  ) => {
    const normalizedQuestion =
      rawQuestion.trim()

    if (
      !normalizedQuestion ||
      ragChat.isPending
    ) {
      return
    }

    setErrorMessage(null)
    setQuestion('')

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: 'user',
      content: normalizedQuestion,
      citations: [],
      created_at: new Date().toISOString(),
    }

    setMessages((current) => [
      ...current,
      userMessage,
    ])

    try {
      const response =
        await ragChat.mutateAsync({
          question: normalizedQuestion,
        })

      const assistantMessage: ChatMessage = {
        id: createMessageId(),
        role: 'assistant',
        content: response.answer,
        citations: response.citations,
        context_found:
          response.context_found,
        created_at: new Date().toISOString(),
      }

      setMessages((current) => [
        ...current,
        assistantMessage,
      ])
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error),
      )
    }
  }

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    void submitQuestion(
      question,
    )
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-sky-700">
            Phase 2 · Standard RAG
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Ask your documents
          </h1>

          <p className="mt-3 max-w-3xl text-slate-600">
            Ask questions about your uploaded knowledge
            base. Answers are generated from retrieved
            document context and include source citations.
          </p>
        </div>

        <Link
          to="/app/documents"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
        >
          <BookOpen
            className="h-4 w-4"
            aria-hidden="true"
          />
          Manage documents
        </Link>
      </section>

      <div className="grid min-h-[650px] gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="flex min-h-[650px] flex-col p-0">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-sky-50 p-2.5 text-sky-700">
                <MessageSquareText
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </div>

              <div>
                <h2 className="font-bold text-slate-950">
                  Document assistant
                </h2>

                <p className="text-xs text-slate-500">
                  Grounded in your indexed documents
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              RAG ready
            </div>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              {messages.length === 0 ? (
                <EmptyChatState
                  onQuestionSelect={(
                    example,
                  ) =>
                    void submitQuestion(
                      example,
                    )
                  }
                  disabled={ragChat.isPending}
                />
              ) : (
                <div className="space-y-6">
                  {messages.map(
                    (message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                      />
                    ),
                  )}

                  {ragChat.isPending ? (
                    <AssistantLoadingMessage />
                  ) : null}
                </div>
              )}

              <div
                ref={messagesEndRef}
                aria-hidden="true"
              />
            </div>

            {errorMessage ? (
              <div className="mx-4 mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:mx-6">
                {errorMessage}
              </div>
            ) : null}

            <form
              onSubmit={handleSubmit}
              className="border-t border-slate-200 bg-white p-4 sm:p-5"
            >
              <div className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-100">
                <textarea
                  value={question}
                  onChange={(event) =>
                    setQuestion(
                      event.target.value,
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' &&
                      !event.shiftKey
                    ) {
                      event.preventDefault()

                      void submitQuestion(
                        question,
                      )
                    }
                  }}
                  rows={2}
                  maxLength={4000}
                  placeholder="Ask something about your documents…"
                  disabled={ragChat.isPending}
                  className="max-h-40 min-h-[52px] flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
                />

                <Button
                  type="submit"
                  className="h-11 w-11 shrink-0 p-0"
                  disabled={
                    ragChat.isPending ||
                    !question.trim()
                  }
                  aria-label="Send question"
                >
                  {ragChat.isPending ? (
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Send
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  )}
                </Button>
              </div>

              <div className="mt-2 flex items-center justify-between gap-4 text-xs text-slate-400">
                <span>
                  Enter to send · Shift + Enter
                  for a new line
                </span>

                <span>
                  {question.length}/4000
                </span>
              </div>
            </form>
          </div>
        </Card>

        <aside className="space-y-4">
        
        
        </aside>
      </div>
    </div>
  )
}


function EmptyChatState({
  onQuestionSelect,
  disabled,
}: {
  onQuestionSelect: (
    question: string,
  ) => void
  disabled: boolean
}) {
  return (
    <div className="flex min-h-[430px] flex-col items-center justify-center px-2 text-center">
      <div className="rounded-2xl bg-sky-50 p-4">
        <Bot
          className="h-8 w-8 text-sky-700"
          aria-hidden="true"
        />
      </div>

      <h2 className="mt-5 text-xl font-bold text-slate-950">
        Ask your knowledge base
      </h2>

      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
        Upload documents first, then ask specific
        questions. LifeOps AI retrieves the most relevant
        chunks before generating an answer.
      </p>

      <div className="mt-7 grid w-full max-w-2xl gap-3 sm:grid-cols-3">
        {EXAMPLE_QUESTIONS.map(
          (example) => (
            <button
              key={example}
              type="button"
              disabled={disabled}
              onClick={() =>
                onQuestionSelect(
                  example,
                )
              }
              className="rounded-xl border border-slate-200 bg-white p-4 text-left text-sm leading-5 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {example}
            </button>
          ),
        )}
      </div>
    </div>
  )
}


function MessageBubble({
  message,
}: {
  message: ChatMessage
}) {
  const isUser =
    message.role === 'user'

  return (
    <div
      className={[
        'flex gap-3',
        isUser
          ? 'justify-end'
          : 'justify-start',
      ].join(' ')}
    >
      {!isUser ? (
        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
          <Bot
            className="h-4 w-4"
            aria-hidden="true"
          />
        </div>
      ) : null}

      <div
        className={[
          'max-w-[85%] sm:max-w-[78%]',
          isUser
            ? 'order-first'
            : '',
        ].join(' ')}
      >
        <div
          className={[
            'rounded-2xl px-4 py-3 text-sm leading-6',
            isUser
              ? 'rounded-br-md bg-slate-950 text-white'
              : 'rounded-bl-md border border-slate-200 bg-slate-50 text-slate-700',
          ].join(' ')}
        >
          <p className="whitespace-pre-wrap">
            {message.content}
          </p>
        </div>

        {!isUser &&
        message.citations.length > 0 ? (
          <CitationList
            citations={
              message.citations
            }
          />
        ) : null}

        {!isUser &&
        message.context_found === false ? (
          <p className="mt-2 text-xs text-amber-600">
            No sufficiently relevant document
            context was found.
          </p>
        ) : null}
      </div>

      {isUser ? (
        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <UserRound
            className="h-4 w-4"
            aria-hidden="true"
          />
        </div>
      ) : null}
    </div>
  )
}


function CitationList({
  citations,
}: {
  citations: RagCitation[]
}) {
  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Sources
      </p>

      {citations.map(
        (citation, index) => (
          <details
            key={citation.chunk_id}
            className="rounded-xl border border-slate-200 bg-white"
          >
            <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-semibold text-slate-700">
              <span className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate">
                  [Source {index + 1}]{' '}
                  {citation.filename}
                </span>

                <span className="shrink-0 text-slate-400">
                  {Math.round(
                    citation.similarity *
                      100,
                  )}
                  %
                </span>
              </span>
            </summary>

            <div className="border-t border-slate-100 px-3 py-3">
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                <span>
                  Chunk{' '}
                  {citation.chunk_index +
                    1}
                </span>

                {citation.page_number !==
                null ? (
                  <span>
                    · Page{' '}
                    {
                      citation.page_number
                    }
                  </span>
                ) : null}
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-600">
                {citation.excerpt}
              </p>
            </div>
          </details>
        ),
      )}
    </div>
  )
}


function AssistantLoadingMessage() {
  return (
    <div className="flex gap-3">
      <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
        <Bot
          className="h-4 w-4"
          aria-hidden="true"
        />
      </div>

      <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2
            className="h-4 w-4 animate-spin"
            aria-hidden="true"
          />
          Searching your documents…
        </div>
      </div>
    </div>
  )
}


function PipelineStep({
  number,
  title,
  description,
}: {
  number: number
  title: string
  description: string
}) {
  return (
    <li className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
        {number}
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-900">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </li>
  )
}


function createMessageId(): string {
  if (
    typeof crypto !== 'undefined' &&
    'randomUUID' in crypto
  ) {
    return crypto.randomUUID()
  }

  return [
    Date.now(),
    Math.random()
      .toString(36)
      .slice(2),
  ].join('-')
}


function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Unable to generate a RAG response.'
}