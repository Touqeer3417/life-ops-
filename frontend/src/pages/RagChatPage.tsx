import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  ArrowRight,
  Bot,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FileText,
  Loader2,
  MessageSquareText,
  PlugZap,
  Send,
  Sparkles,
  UserRound,
} from 'lucide-react'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from 'motion/react'
import ReactMarkdown from 'react-markdown'
import { Link } from 'react-router-dom'
import remarkGfm from 'remark-gfm'

import { Button } from '@/components/ui/Button'
import { useRagChat } from '@/hooks/useRagChat'

import type {
  ChatMessage,
  RagCitation,
} from '@/types/chat'

const EXAMPLE_QUESTIONS = [
  'What events do I have this week?',
  'Am I free tomorrow from 4 PM to 5 PM?',
  'Summarize the key information in my documents.',
]

const easeOut = [0.22, 1, 0.36, 1] as const

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.04,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.48,
      ease: easeOut,
    },
  },
}

export function RagChatPage() {
  const [question, setQuestion] =
    useState('')

  const [messages, setMessages] =
    useState<ChatMessage[]>([])

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(null)

  const messagesEndRef =
    useRef<HTMLDivElement>(null)

  const ragChat =
    useRagChat()

  const shouldReduceMotion =
    useReducedMotion()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: shouldReduceMotion
        ? 'auto'
        : 'smooth',
    })
  }, [
    messages,
    ragChat.isPending,
    shouldReduceMotion,
  ])

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
      created_at:
        new Date().toISOString(),
    }

    setMessages(
      (current) => [
        ...current,
        userMessage,
      ],
    )

    try {
      const response =
        await ragChat.mutateAsync({
          question:
            normalizedQuestion,
        })

      const assistantMessage:
        ChatMessage = {
          id: createMessageId(),
          role: 'assistant',
          content:
            response.answer,
          citations:
            response.citations,
          context_found:
            response.context_found,
          created_at:
            new Date().toISOString(),
        }

      setMessages(
        (current) => [
          ...current,
          assistantMessage,
        ],
      )
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
        ),
      )
    }
  }

  const handleSubmit = (
    event:
      FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    void submitQuestion(
      question,
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial={shouldReduceMotion ? false : 'hidden'}
      animate="visible"
      className="relative mx-auto w-full max-w-[1440px] overflow-hidden rounded-[30px] border border-white/[0.07] bg-[#05070b] px-4 py-5 text-white shadow-[0_34px_120px_-48px_rgba(2,6,23,0.95)] sm:px-6 sm:py-7 lg:px-8 lg:py-9"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(34,211,238,0.11),transparent_28%),radial-gradient(circle_at_92%_8%,rgba(139,92,246,0.17),transparent_30%),linear-gradient(to_bottom,#05070b_0%,#070a11_58%,#05070b_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:58px_58px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />

      <motion.section
        variants={itemVariants}
        className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/15 bg-violet-300/[0.07] px-3 py-1.5 text-xs font-semibold text-violet-100">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Agentic LifeOps
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl lg:text-[2.8rem]">
            Your personal
            <span className="ml-2 bg-gradient-to-r from-cyan-200 via-sky-300 to-violet-300 bg-clip-text text-transparent">
              AI command layer.
            </span>
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 sm:text-[15px]">
            Ask about your uploaded documents or Google Calendar. LifeOps AI automatically chooses the correct tool for your request.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <HeaderLink
            to="/app/documents"
            icon={BookOpen}
            label="Documents"
          />
          <HeaderLink
            to="/app/calendar"
            icon={CalendarDays}
            label="Calendar"
          />
        </div>
      </motion.section>

      <motion.div
        variants={itemVariants}
        className="relative mt-6 grid min-h-[680px] gap-5 xl:grid-cols-[minmax(0,1fr)_320px]"
      >
        <section className="flex min-h-[680px] min-w-0 flex-col overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#090c12]/90 shadow-[0_25px_80px_-48px_rgba(0,0,0,0.95)] backdrop-blur-xl">
          <div className="relative flex items-center justify-between gap-4 border-b border-white/[0.07] px-4 py-4 sm:px-5">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-violet-400/[0.035] to-transparent"
            />

            <div className="relative flex min-w-0 items-center gap-3">
              <motion.div
                animate={
                  shouldReduceMotion
                    ? undefined
                    : { boxShadow: [
                        '0 0 0 rgba(139,92,246,0)',
                        '0 0 28px rgba(139,92,246,0.14)',
                        '0 0 0 rgba(139,92,246,0)',
                      ] }
                }
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-300/15 bg-violet-300/[0.07] text-violet-200"
              >
                <MessageSquareText className="h-5 w-5" aria-hidden="true" />
              </motion.div>

              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-white sm:text-base">
                  Personal life assistant
                </h2>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  Documents + Google Calendar
                </p>
              </div>
            </div>

            <div className="relative hidden items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.07] px-3 py-1.5 text-[11px] font-semibold text-emerald-200 sm:flex">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-40 motion-reduce:animate-none" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-300" />
              </span>
              Agent ready
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5 [scrollbar-color:rgba(148,163,184,0.18)_transparent] sm:px-5 sm:py-6">
              {messages.length === 0 ? (
                <EmptyChatState
                  onQuestionSelect={(example) =>
                    void submitQuestion(example)
                  }
                  disabled={ragChat.isPending}
                  shouldReduceMotion={Boolean(shouldReduceMotion)}
                />
              ) : (
                <div className="space-y-6">
                  <AnimatePresence initial={false}>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={
                          shouldReduceMotion
                            ? false
                            : { opacity: 0, y: 10, scale: 0.99 }
                        }
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3, ease: easeOut }}
                      >
                        <MessageBubble message={message} />
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  <AnimatePresence>
                    {ragChat.isPending ? (
                      <motion.div
                        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                      >
                        <AssistantLoadingMessage />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              )}

              <div
                ref={messagesEndRef}
                aria-hidden="true"
              />
            </div>

            <AnimatePresence initial={false}>
              {errorMessage ? (
                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="mx-3 mb-3 rounded-xl border border-rose-300/15 bg-rose-300/[0.07] px-4 py-3 text-sm text-rose-200 sm:mx-5"
                >
                  {errorMessage}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <form
              onSubmit={handleSubmit}
              className="relative border-t border-white/[0.07] bg-[#080b10]/95 p-3 sm:p-4"
            >
              <div
                className="group flex items-end gap-2 rounded-2xl border border-white/[0.09] bg-white/[0.035] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] transition duration-200 focus-within:border-cyan-300/25 focus-within:bg-white/[0.05] focus-within:ring-4 focus-within:ring-cyan-300/[0.05]"
              >
                <textarea
                  value={question}
                  onChange={(event) =>
                    setQuestion(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' &&
                      !event.shiftKey
                    ) {
                      event.preventDefault()

                      void submitQuestion(question)
                    }
                  }}
                  rows={2}
                  maxLength={4000}
                  placeholder="Ask about your documents, schedule, events, or availability…"
                  disabled={ragChat.isPending}
                  className="max-h-40 min-h-[52px] min-w-0 flex-1 resize-none border-0 bg-transparent px-2.5 py-2 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <Button
                  type="submit"
                  className="h-11 w-11 shrink-0 !bg-white p-0 !text-slate-950 shadow-[0_8px_24px_rgba(255,255,255,0.08)] hover:!bg-cyan-50 focus:ring-cyan-300"
                  disabled={
                    ragChat.isPending ||
                    !question.trim()
                  }
                  aria-label="Send question"
                >
                  {ragChat.isPending ? (
                    <Loader2
                      className="h-4 w-4 animate-spin motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                  ) : (
                    <Send className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
              </div>

              <div className="mt-2 flex items-center justify-between gap-4 px-1 text-[11px] text-slate-600">
                <span>
                  Enter to send · Shift + Enter for a new line
                </span>
                <span className={question.length > 3600 ? 'text-amber-300' : ''}>
                  {question.length}/4000
                </span>
              </div>
            </form>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl">
            <div
              aria-hidden="true"
              className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-violet-400/[0.08] blur-3xl"
            />
            <div className="relative flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-300/15 bg-violet-300/[0.07] text-violet-200">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Agent tools</h2>
                <p className="mt-0.5 text-xs text-slate-500">Selected automatically</p>
              </div>
            </div>

            <ul className="relative mt-5 space-y-1">
              <PipelineStep
                number={1}
                title="Understand"
                description="The model determines whether your request needs documents, Calendar, or both."
              />
              <PipelineStep
                number={2}
                title="Use tools"
                description="LifeOps securely queries your own indexed data or connected Google Calendar."
              />
              <PipelineStep
                number={3}
                title="Respond"
                description="The assistant converts grounded tool results into a clear answer."
                isLast
              />
            </ul>
          </section>

          <section className="rounded-[24px] border border-white/[0.08] bg-[#0a0d13]/88 p-5 backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Available knowledge
            </p>
            <h2 className="mt-1.5 text-base font-semibold text-white">
              LifeOps context
            </h2>

            <div className="mt-4 space-y-2.5">
              <KnowledgeLink
                to="/app/documents"
                icon={FileText}
                title="Documents"
                description="RAG knowledge base"
                accent="cyan"
              />
              <KnowledgeLink
                to="/app/calendar"
                icon={CalendarDays}
                title="Google Calendar"
                description="Events and availability"
                accent="emerald"
              />
              <KnowledgeLink
                to="/app/integrations"
                icon={PlugZap}
                title="Integrations"
                description="Manage Google connection"
                accent="amber"
              />
            </div>
          </section>

          <section className="rounded-[24px] border border-cyan-300/10 bg-gradient-to-br from-cyan-300/[0.055] via-white/[0.025] to-violet-300/[0.055] p-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-100">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Grounded workflow
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              LifeOps uses your connected tools and indexed knowledge as context before returning relevant answers.
            </p>
          </section>
        </aside>
      </motion.div>
    </motion.div>
  )
}

type LinkIcon = typeof BookOpen

function HeaderLink({
  to,
  icon: Icon,
  label,
}: {
  to: string
  icon: LinkIcon
  label: string
}) {
  return (
    <Link
      to={to}
      className="group inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2 text-sm font-semibold text-slate-300 outline-none transition duration-200 hover:border-white/[0.15] hover:bg-white/[0.075] hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300"
    >
      <Icon className="h-4 w-4 text-slate-400 transition group-hover:text-cyan-200" aria-hidden="true" />
      {label}
    </Link>
  )
}

function EmptyChatState({
  onQuestionSelect,
  disabled,
  shouldReduceMotion,
}: {
  onQuestionSelect: (
    question: string,
  ) => void
  disabled: boolean
  shouldReduceMotion: boolean
}) {
  return (
    <div className="flex min-h-[470px] flex-col items-center justify-center px-2 py-8 text-center">
      <div className="relative">
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : { y: [-3, 3, -3] }
          }
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative flex h-16 w-16 items-center justify-center rounded-[20px] border border-violet-300/15 bg-gradient-to-br from-violet-300/10 via-white/[0.035] to-cyan-300/10 text-violet-200 shadow-[0_22px_60px_-28px_rgba(139,92,246,0.55)]"
        >
          <Bot className="h-8 w-8" aria-hidden="true" />
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-[20px] bg-[linear-gradient(135deg,rgba(255,255,255,0.07),transparent_45%)]"
          />
        </motion.div>

        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : { rotate: [0, 10, 0], scale: [1, 1.08, 1] }
          }
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-[#10141d] text-amber-200 shadow-lg"
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        </motion.div>
      </div>

      <h2 className="mt-6 text-xl font-semibold tracking-[-0.025em] text-white sm:text-2xl">
        What can I help you manage?
      </h2>

      <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
        Ask naturally. LifeOps AI can search your uploaded documents, inspect your Calendar, check availability, and manage Calendar events.
      </p>

      <div className="mt-7 grid w-full max-w-3xl gap-3 sm:grid-cols-3">
        {EXAMPLE_QUESTIONS.map((example, index) => (
          <motion.button
            key={example}
            type="button"
            disabled={disabled}
            onClick={() => onQuestionSelect(example)}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: shouldReduceMotion ? 0 : 0.15 + index * 0.06 }}
            whileHover={shouldReduceMotion ? undefined : { y: -3 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.075] bg-white/[0.03] p-4 text-left text-sm leading-5 text-slate-400 outline-none transition duration-300 hover:border-violet-300/20 hover:bg-violet-300/[0.055] hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-violet-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
            />
            <span className="mb-3 flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.035] text-xs font-semibold text-slate-500 transition group-hover:text-violet-200">
              0{index + 1}
            </span>
            {example}
            <ArrowRight
              className="mt-3 h-3.5 w-3.5 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-200"
              aria-hidden="true"
            />
          </motion.button>
        ))}
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
      className={`flex min-w-0 gap-2.5 sm:gap-3 ${
        isUser
          ? 'justify-end'
          : 'justify-start'
      }`}
    >
      {!isUser ? (
        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-300/[0.12] bg-violet-300/[0.07] text-violet-200">
          <Bot className="h-4 w-4" aria-hidden="true" />
        </div>
      ) : null}

      <div
        className={`min-w-0 max-w-[92%] sm:max-w-[84%] ${
          isUser ? 'order-first' : ''
        }`}
      >
        <div
          className={`min-w-0 overflow-hidden rounded-2xl px-4 py-3 text-sm leading-6 ${
            isUser
              ? 'rounded-br-md border border-cyan-300/10 bg-gradient-to-br from-slate-100 to-white text-slate-950 shadow-[0_12px_35px_-22px_rgba(255,255,255,0.35)]'
              : 'rounded-bl-md border border-white/[0.075] bg-white/[0.035] text-slate-300'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">
              {message.content}
            </p>
          ) : (
            <MarkdownMessage content={message.content} />
          )}
        </div>

        {!isUser &&
        message.citations.length > 0 ? (
          <CitationList citations={message.citations} />
        ) : null}

        {!isUser &&
        message.context_found === false ? (
          <p className="mt-2 inline-flex rounded-lg border border-amber-300/10 bg-amber-300/[0.055] px-2.5 py-1.5 text-xs text-amber-200/80">
            No sufficiently relevant information was found in your uploaded documents.
          </p>
        ) : null}
      </div>

      {isUser ? (
        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.075] bg-white/[0.04] text-slate-400">
          <UserRound className="h-4 w-4" aria-hidden="true" />
        </div>
      ) : null}
    </div>
  )
}

function MarkdownMessage({
  content,
}: {
  content: string
}) {
  return (
    <div className="min-w-0 max-w-full overflow-hidden">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-3 mt-1 break-words text-xl font-semibold tracking-tight text-white">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-4 break-words text-lg font-semibold text-white first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-5 break-words text-[15px] font-semibold text-slate-100 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mb-2 mt-4 break-words text-sm font-semibold text-slate-100">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="my-2 break-words leading-6 text-slate-300 first:mt-0 last:mb-0">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-white">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-300">
              {children}
            </em>
          ),
          ol: ({ children }) => (
            <ol className="my-3 list-decimal space-y-3 pl-6">
              {children}
            </ol>
          ),
          ul: ({ children }) => (
            <ul className="my-3 list-disc space-y-2 pl-6">
              {children}
            </ul>
          ),
          li: ({ children }) => (
            <li className="break-words pl-1 leading-6 text-slate-300 marker:font-semibold marker:text-slate-500">
              {children}
            </li>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="break-words font-semibold text-cyan-200 underline decoration-cyan-300/30 underline-offset-2 transition hover:text-cyan-100"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 rounded-r-lg border-l-2 border-violet-300/40 bg-violet-300/[0.055] px-4 py-2 text-slate-400">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="break-all rounded-md border border-white/[0.06] bg-black/25 px-1.5 py-0.5 font-mono text-[0.85em] text-cyan-100">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="my-3 max-w-full overflow-x-auto rounded-xl border border-white/[0.08] bg-[#05070b] p-4 text-xs leading-5 text-slate-200 [scrollbar-color:rgba(148,163,184,0.18)_transparent]">
              {children}
            </pre>
          ),
          hr: () => (
            <hr className="my-4 border-white/[0.08]" />
          ),
          table: ({ children }) => (
            <div className="my-4 max-w-full overflow-x-auto rounded-xl border border-white/[0.08] bg-black/15">
              <table className="min-w-full divide-y divide-white/[0.08] text-left text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-white/[0.04]">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-white/[0.06]">
              {children}
            </tbody>
          ),
          th: ({ children }) => (
            <th className="whitespace-nowrap px-3 py-2 font-semibold text-slate-100">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-slate-400">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
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
      <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
        <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
        Document sources
      </p>

      {citations.map((citation, index) => (
        <details
          key={citation.chunk_id}
          className="group overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025] transition open:bg-white/[0.04]"
        >
          <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-semibold text-slate-400 outline-none transition hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300">
            <span className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate">
                [Source {index + 1}] {citation.filename}
              </span>
              <span className="shrink-0 rounded-full border border-white/[0.06] bg-white/[0.035] px-2 py-0.5 text-[10px] text-slate-500">
                {Math.round(citation.similarity * 100)}%
              </span>
            </span>
          </summary>

          <div className="border-t border-white/[0.06] px-3 py-3">
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
              <span>Chunk {citation.chunk_index + 1}</span>
              {citation.page_number !== null ? (
                <span>· Page {citation.page_number}</span>
              ) : null}
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              {citation.excerpt}
            </p>
          </div>
        </details>
      ))}
    </div>
  )
}

function AssistantLoadingMessage() {
  return (
    <div className="flex gap-3">
      <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-300/[0.12] bg-violet-300/[0.07] text-violet-200">
        <Bot className="h-4 w-4" aria-hidden="true" />
      </div>

      <div className="rounded-2xl rounded-bl-md border border-white/[0.075] bg-white/[0.035] px-4 py-3">
        <div className="flex items-center gap-2.5 text-sm text-slate-400">
          <span className="flex items-center gap-1" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <motion.span
                key={index}
                animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: index * 0.16,
                }}
                className="h-1.5 w-1.5 rounded-full bg-violet-200"
              />
            ))}
          </span>
          Thinking and checking your LifeOps tools…
        </div>
      </div>
    </div>
  )
}

function PipelineStep({
  number,
  title,
  description,
  isLast = false,
}: {
  number: number
  title: string
  description: string
  isLast?: boolean
}) {
  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!isLast ? (
        <span
          aria-hidden="true"
          className="absolute left-[13px] top-7 h-[calc(100%-1.15rem)] w-px bg-gradient-to-b from-violet-300/20 to-white/[0.05]"
        />
      ) : null}

      <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-[#0d1118] text-[10px] font-bold text-violet-200">
        {number}
      </div>

      <div className="pt-0.5">
        <p className="text-sm font-semibold text-slate-200">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </li>
  )
}

type KnowledgeIcon = typeof FileText

type KnowledgeAccent = 'cyan' | 'emerald' | 'amber'

const knowledgeAccentClasses: Record<KnowledgeAccent, string> = {
  cyan: 'border-cyan-300/10 bg-cyan-300/[0.055] text-cyan-200',
  emerald: 'border-emerald-300/10 bg-emerald-300/[0.055] text-emerald-200',
  amber: 'border-amber-300/10 bg-amber-300/[0.055] text-amber-200',
}

function KnowledgeLink({
  to,
  icon: Icon,
  title,
  description,
  accent,
}: {
  to: string
  icon: KnowledgeIcon
  title: string
  description: string
  accent: KnowledgeAccent
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl border border-white/[0.065] bg-white/[0.025] p-3 outline-none transition duration-200 hover:border-white/[0.12] hover:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-cyan-300"
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${knowledgeAccentClasses[accent]}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-200 transition group-hover:text-white">
          {title}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-600">
          {description}
        </p>
      </div>
      <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-700 transition group-hover:translate-x-0.5 group-hover:text-slate-400" aria-hidden="true" />
    </Link>
  )
}

function createMessageId(): string {
  if (
    typeof crypto !==
      'undefined' &&
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

  return 'Unable to complete the LifeOps AI request.'
}
