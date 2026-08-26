# Complete Production-Ready Project Structure

This is the target modular monorepo structure for the complete LifeOps AI product. Only Phase 1 files are implemented in this ZIP; later-phase directories below are the planned architecture, not empty generated code.

```text
lifeops-ai/
├── .github/
│   └── workflows/
│       ├── backend-ci.yml                       # Phase 8
│       └── frontend-ci.yml                      # Phase 8
├── docs/
│   ├── PROJECT_STRUCTURE.md
│   ├── architecture/                            # Phase 5+
│   │   ├── agent-workflow.md
│   │   ├── data-model.md
│   │   ├── security.md
│   │   └── tool-registry.md
│   └── api/                                     # Phase 2+
├── backend/
│   ├── alembic/
│   │   ├── versions/
│   │   ├── env.py
│   │   └── script.py.mako
│   ├── app/
│   │   ├── api/
│   │   │   ├── router.py
│   │   │   ├── auth.py                         # Phase 1
│   │   │   ├── users.py                        # Phase 1
│   │   │   ├── dashboard.py                    # Phase 1
│   │   │   ├── health.py                       # Phase 1
│   │   │   ├── onboarding.py                   # Phase 3/4
│   │   │   ├── admin.py                        # Phase 8
│   │   │   ├── documents.py                    # Phase 2
│   │   │   ├── conversations.py                # Phase 2
│   │   │   ├── chat.py                         # Phase 2/5
│   │   │   ├── calendar.py                     # Phase 3
│   │   │   ├── email.py                        # Phase 4
│   │   │   ├── integrations.py                 # Phase 3/4
│   │   │   ├── actions.py                      # Phase 6
│   │   │   ├── tasks.py                        # Phase 7
│   │   │   ├── subscriptions.py                # Phase 7
│   │   │   └── notifications.py                # Phase 7
│   │   ├── core/
│   │   │   ├── config.py                       # Phase 1
│   │   │   ├── exceptions.py                   # Phase 1
│   │   │   ├── logging.py                      # Phase 1
│   │   │   ├── security.py                     # Phase 1
│   │   │   ├── permissions.py                  # Phase 6
│   │   │   ├── encryption.py                   # Phase 3/4
│   │   │   └── rate_limit.py                   # Phase 8
│   │   ├── database/
│   │   │   ├── base.py                         # Phase 1
│   │   │   └── session.py                      # Phase 1
│   │   ├── models/
│   │   │   ├── user.py                         # Phase 1
│   │   │   ├── user_preference.py              # Phase 1
│   │   │   ├── oauth_connection.py             # Phase 3/4
│   │   │   ├── conversation.py                 # Phase 2
│   │   │   ├── message.py                      # Phase 2
│   │   │   ├── document.py                     # Phase 2
│   │   │   ├── document_chunk.py               # Phase 2
│   │   │   ├── calendar_event_cache.py         # Phase 3
│   │   │   ├── email_metadata.py               # Phase 4
│   │   │   ├── action_request.py               # Phase 6
│   │   │   ├── action_run.py                   # Phase 6
│   │   │   ├── approval.py                     # Phase 6
│   │   │   ├── task.py                         # Phase 7
│   │   │   ├── subscription.py                 # Phase 7
│   │   │   ├── notification.py                 # Phase 7
│   │   │   └── audit_log.py                    # Phase 6/8
│   │   ├── schemas/
│   │   │   ├── auth.py                         # Phase 1
│   │   │   ├── user.py                         # Phase 1
│   │   │   ├── dashboard.py                    # Phase 1
│   │   │   ├── common.py                       # Phase 1
│   │   │   ├── document.py                     # Phase 2
│   │   │   ├── chat.py                         # Phase 2/5
│   │   │   ├── calendar.py                     # Phase 3
│   │   │   ├── email.py                        # Phase 4
│   │   │   ├── tool.py                         # Phase 5
│   │   │   ├── action.py                       # Phase 6
│   │   │   ├── task.py                         # Phase 7
│   │   │   ├── subscription.py                 # Phase 7
│   │   │   └── notification.py                 # Phase 7
│   │   ├── repositories/
│   │   │   ├── user_repository.py              # Phase 1
│   │   │   ├── document_repository.py          # Phase 2
│   │   │   ├── conversation_repository.py      # Phase 2
│   │   │   ├── oauth_repository.py             # Phase 3/4
│   │   │   ├── calendar_repository.py          # Phase 3
│   │   │   ├── email_repository.py             # Phase 4
│   │   │   ├── action_repository.py            # Phase 6
│   │   │   ├── task_repository.py              # Phase 7
│   │   │   └── subscription_repository.py      # Phase 7
│   │   ├── services/
│   │   │   ├── auth_service.py                 # Phase 1
│   │   │   ├── user_service.py                 # Phase 1
│   │   │   ├── dashboard_service.py            # Phase 1
│   │   │   ├── document_service.py             # Phase 2
│   │   │   ├── chat_service.py                 # Phase 2/5
│   │   │   ├── google_oauth_service.py         # Phase 3/4
│   │   │   ├── calendar_service.py             # Phase 3
│   │   │   ├── gmail_service.py                # Phase 4
│   │   │   ├── action_service.py               # Phase 6
│   │   │   ├── task_service.py                 # Phase 7
│   │   │   ├── subscription_service.py         # Phase 7
│   │   │   └── notification_service.py         # Phase 7
│   │   ├── agent/                              # Phase 5
│   │   │   ├── graph.py
│   │   │   ├── state.py
│   │   │   ├── nodes/
│   │   │   ├── routing/
│   │   │   ├── prompts/
│   │   │   └── checkpoints/
│   │   ├── rag/                                # Phase 2
│   │   │   ├── loaders/
│   │   │   ├── chunking/
│   │   │   ├── embeddings/
│   │   │   ├── retrieval/
│   │   │   └── indexing/
│   │   ├── tools/                              # Phase 3+
│   │   │   ├── registry.py
│   │   │   ├── base.py
│   │   │   ├── calendar/
│   │   │   ├── gmail/
│   │   │   ├── documents/
│   │   │   └── tasks/
│   │   ├── integrations/                       # Phase 3+
│   │   │   ├── google/
│   │   │   ├── llm/
│   │   │   ├── embeddings/
│   │   │   ├── storage/
│   │   │   └── email_notifications/
│   │   ├── workers/                            # Phase 8
│   │   │   ├── celery_app.py
│   │   │   └── jobs/
│   │   ├── middleware/
│   │   │   ├── request_id.py                   # Phase 1
│   │   │   └── audit_context.py                # Phase 6
│   │   ├── dependencies.py                     # Phase 1
│   │   └── main.py                             # Phase 1
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── conftest.py
│   ├── .env.example
│   ├── alembic.ini
│   ├── pyproject.toml
│   ├── requirements.txt
│   └── requirements-dev.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts                       # Phase 1
│   │   │   ├── users.ts                        # Phase 1
│   │   │   ├── dashboard.ts                    # Phase 1
│   │   │   ├── documents.ts                    # Phase 2
│   │   │   ├── chat.ts                         # Phase 2/5
│   │   │   ├── calendar.ts                     # Phase 3
│   │   │   ├── email.ts                        # Phase 4
│   │   │   ├── actions.ts                      # Phase 6
│   │   │   ├── tasks.ts                        # Phase 7
│   │   │   └── subscriptions.ts                # Phase 7
│   │   ├── auth/
│   │   │   ├── AuthProvider.tsx                # Phase 1
│   │   │   └── ProtectedRoute.tsx              # Phase 1
│   │   ├── components/
│   │   │   ├── ui/                             # Phase 1+
│   │   │   ├── layout/                         # Phase 1
│   │   │   ├── dashboard/                      # Phase 1
│   │   │   ├── chat/                           # Phase 2/5
│   │   │   ├── documents/                      # Phase 2
│   │   │   ├── calendar/                       # Phase 3
│   │   │   ├── email/                          # Phase 4
│   │   │   ├── approvals/                      # Phase 6
│   │   │   ├── tasks/                          # Phase 7
│   │   │   └── subscriptions/                  # Phase 7
│   │   ├── hooks/
│   │   │   ├── useCurrentUser.ts               # Phase 1
│   │   │   ├── useDashboard.ts                 # Phase 1
│   │   │   └── useStreamingChat.ts             # Phase 2/5
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx                 # Phase 1
│   │   │   ├── DashboardPage.tsx               # Phase 1
│   │   │   ├── ProfilePage.tsx                 # Phase 1
│   │   │   ├── OnboardingPage.tsx              # Phase 3/4
│   │   │   ├── AdminDashboardPage.tsx          # Phase 8
│   │   │   ├── AssistantPage.tsx               # Phase 2/5
│   │   │   ├── DocumentsPage.tsx               # Phase 2
│   │   │   ├── CalendarPage.tsx                # Phase 3
│   │   │   ├── EmailPage.tsx                   # Phase 4
│   │   │   ├── IntegrationsPage.tsx            # Phase 3/4
│   │   │   ├── TasksPage.tsx                   # Phase 7
│   │   │   ├── SubscriptionsPage.tsx           # Phase 7
│   │   │   ├── NotificationsPage.tsx           # Phase 7
│   │   │   ├── ActivityPage.tsx                # Phase 6/8
│   │   │   ├── SettingsPage.tsx                # Phase 1+
│   │   │   └── NotFoundPage.tsx                # Phase 1
│   │   ├── routes/router.tsx                    # Phase 1
│   │   ├── styles/index.css                     # Phase 1
│   │   ├── types/                               # Phase 1+
│   │   ├── utils/                               # Phase 1+
│   │   ├── App.tsx                              # Phase 1
│   │   └── main.tsx                             # Phase 1
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── infra/                                      # Phase 8
│   ├── docker/
│   ├── deployment/
│   └── monitoring/
├── scripts/                                    # Phase 8
│   ├── bootstrap.sh
│   ├── bootstrap.ps1
│   └── smoke-test.sh
├── docker-compose.yml
├── .editorconfig
├── .gitignore
└── README.md
```

## Phase boundaries

1. **Foundation:** UI, API, PostgreSQL, authentication, users, dashboard.
2. **Standard RAG:** documents, parsing, embeddings, pgvector, semantic retrieval, basic chat.
3. **Calendar Agent:** Google OAuth + Calendar read/write tools.
4. **Gmail Agent:** Gmail OAuth/search/intelligence/subscription extraction.
5. **Agentic RAG:** LangGraph intent, planning, routing, retrieval, reasoning, responses.
6. **Human-in-the-loop:** action requests, risk, approval, resume/execute, audit records.
7. **Personal admin:** tasks, subscriptions, reminders, briefings.
8. **Production hardening:** Redis, workers, caching, rate limits, observability, retries, security tests.
