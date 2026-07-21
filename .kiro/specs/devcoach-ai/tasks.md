# Implementation Plan: DevCoach AI

## Overview

Implementation of a single-page application that converts a GitHub repository folder into a 3-ticket improvement plan through AI-powered code analysis, ticket generation, commit verification, and simulated interview. The system uses a React + Tailwind CSS frontend communicating via REST with a FastAPI backend, persisting state in Supabase and delegating AI inference to Gemini 2.5 Flash or Groq via an interchangeable provider abstraction.

## Tasks

- [ ] 1. Set up project structure and configuration
  - [ ] 1.1 Initialize backend project with FastAPI
    - Create `backend/` directory structure as specified in design (`app/`, `app/api/`, `app/ai/`, `app/services/`, `app/models/`, `tests/`)
    - Create `backend/requirements.txt` with dependencies: fastapi, uvicorn, pydantic, httpx, supabase, google-generativeai, groq, python-dotenv, pytest
    - Create `backend/app/main.py` with FastAPI app instantiation, CORS middleware (allow frontend origin), and startup validation for env vars (`AI_PROVIDER`, `GITHUB_TOKEN`, `SUPABASE_URL`, `SUPABASE_KEY`)
    - Create `backend/app/config.py` with Pydantic Settings class loading env vars with validation
    - _Requirements: 8.4, 8.5, 10.5, 10.6_

  - [ ] 1.2 Initialize frontend project with React and Tailwind CSS
    - Create React project using Vite + TypeScript in `frontend/` directory
    - Install and configure Tailwind CSS
    - Set up project structure: `src/components/`, `src/pages/`, `src/services/`, `src/types/`
    - Configure API base URL via environment variable
    - _Requirements: 4.1_

  - [ ] 1.3 Set up Supabase database schema
    - Create SQL migration file with `projects`, `tickets`, and `reviews` tables as defined in design
    - Include all constraints: field lengths, enumerations, referential integrity (CASCADE on delete), check constraints
    - Apply migration to Supabase instance
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 2. Implement AI provider abstraction and agents
  - [ ] 2.1 Implement AI provider interface and factory
    - Create `backend/app/ai/provider.py` with abstract `AIProvider` class and `get_provider()` factory
    - Factory reads `AI_PROVIDER` env var, returns `GeminiProvider` or `GroqProvider` singleton
    - Raise `ValueError` at startup for invalid/missing values
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 2.2 Implement Gemini provider
    - Create `backend/app/ai/gemini_provider.py` implementing `AIProvider`
    - Use `google-generativeai` SDK with model "gemini-2.5-flash"
    - Implement 30-second timeout on generate calls
    - _Requirements: 8.2, 8.6_

  - [ ] 2.3 Implement Groq provider
    - Create `backend/app/ai/groq_provider.py` implementing `AIProvider`
    - Use `groq` SDK with model "llama3-70b-8192"
    - Implement 30-second timeout on generate calls
    - _Requirements: 8.2, 8.6_

  - [ ] 2.4 Implement Code_Reviewer agent
    - Create `backend/app/ai/code_reviewer.py` with `analyze_code(provider, files)` function
    - Build prompt that instructs the AI to analyze code and return JSON with `fortalezas` and `debilidades` arrays
    - Parse and validate response as `CodeReviewResult` Pydantic model
    - Raise validation error if response doesn't match expected schema
    - _Requirements: 3.3, 3.8_

  - [ ] 2.5 Implement Ticket_Generator agent
    - Create `backend/app/ai/ticket_generator.py` with `generate_tickets(provider, review)` function
    - Build prompt that instructs the AI to generate exactly 3 improvement tickets from code review
    - Parse and validate response: exactly 3 tickets with título (≤120 chars), descripción, prioridad ∈ {alta, media, baja}, dificultad ∈ {fácil, media, difícil}, tiempo_estimado_minutos ∈ [15, 480]
    - Raise validation error if response doesn't match
    - _Requirements: 3.4, 3.5_

  - [ ] 2.6 Implement Tech_Lead agent
    - Create `backend/app/ai/tech_lead.py` with `generate_questions(provider, ticket, diff)` function
    - Build prompt that instructs the AI to generate 2-3 interview questions based on ticket and diff
    - Parse and validate response: list of 2-3 string questions
    - _Requirements: 6.8_

  - [ ] 2.7 Implement Evaluator agent
    - Create `backend/app/ai/evaluator.py` with `evaluate_answers(provider, ticket, diff, questions, answers)` function
    - Build prompt that instructs the AI to evaluate answers and return feedback + approval
    - Parse and validate response: feedback (≤3000 chars) + aprobado (boolean)
    - _Requirements: 7.1_

  - [ ]* 2.8 Write unit tests for AI response parsers
    - Create `backend/tests/test_ai_parsers.py`
    - Test Code_Reviewer parser: valid JSON, missing fields, wrong types, empty response
    - Test Ticket_Generator parser: valid 3-ticket JSON, wrong count, invalid enum values, missing fields
    - Test Tech_Lead parser: valid 2-3 questions, too few, too many
    - Test Evaluator parser: valid feedback+boolean, missing fields, feedback too long
    - _Requirements: 3.3, 3.4, 3.5, 3.8, 6.8, 7.1_

- [ ] 3. Implement GitHub service
  - [ ] 3.1 Implement GitHub service class
    - Create `backend/app/services/github_service.py` with `GitHubService` class
    - Implement `validate_repo(owner, repo)`: GET `/repos/{owner}/{repo}`, 10s timeout
    - Implement `get_tree(owner, repo, path, depth=3)`: recursive tree fetch up to 3 levels
    - Implement `get_file_content(owner, repo, path)`: decode base64 content, enforce 1MB limit
    - Implement `get_last_commit(owner, repo)`: get default branch, then last commit SHA + diff
    - Implement `get_default_branch(owner, repo)`: extract default_branch from repo metadata
    - Use PAT from env var for authentication headers
    - Handle rate limiting (429/403 with X-RateLimit-Remaining: 0), parse X-RateLimit-Reset
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.7, 10.8, 10.9, 10.10_

  - [ ]* 3.2 Write unit tests for URL validation
    - Create `backend/tests/test_url_validation.py`
    - Test valid URLs: `https://github.com/owner/repo`
    - Test invalid: missing owner, missing repo, extra path, different domain, empty, whitespace-only
    - _Requirements: 1.2, 1.3, 1.4_

- [ ] 4. Implement database service
  - [ ] 4.1 Implement Supabase database service
    - Create `backend/app/services/db_service.py` with CRUD operations
    - Implement `create_project(repo_url, archivos_seleccionados)` → ProjectResponse
    - Implement `create_tickets(project_id, tickets_data)` → list[TicketResponse]
    - Implement `get_tickets_by_project(project_id)` → list[TicketResponse]
    - Implement `update_ticket_state(ticket_id, new_state)` → TicketResponse
    - Implement `create_review(ticket_id, preguntas, respuesta, feedback, aprobado)` → ReviewResponse
    - Wrap all operations in try/except, return generic error messages without DB details
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ] 5. Implement Pydantic models
  - [ ] 5.1 Create backend Pydantic models
    - Create `backend/app/models/project.py` with `ProjectCreate`, `ProjectResponse`
    - Create `backend/app/models/ticket.py` with enums (`Prioridad`, `Dificultad`, `EstadoTicket`), `TicketResponse`, `TicketData`
    - Create `backend/app/models/review.py` with `InterviewStartRequest`, `InterviewAnswersRequest`, `EvaluationResponse`, `ReviewResponse`, `CodeReviewResult`
    - Include all field validations: max_length, enums, ranges, patterns
    - _Requirements: 3.5, 9.1, 9.2, 9.3_

- [ ] 6. Checkpoint - Backend core ready
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement backend API endpoints
  - [ ] 7.1 Implement project endpoints
    - Create `backend/app/api/projects.py` with router
    - `POST /api/projects/validate-repo`: validate URL format, then call GitHub service to verify repo exists and is public
    - `POST /api/projects`: create project, fetch file contents via GitHub, run Code_Reviewer → Ticket_Generator pipeline, persist tickets, return project + tickets
    - Handle timeouts (60s for AI pipeline), return appropriate error messages
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 2.3, 3.1, 3.2, 3.6, 3.7, 3.8_

  - [ ] 7.2 Implement ticket endpoints
    - Create `backend/app/api/tickets.py` with router
    - `GET /api/projects/{id}/tickets`: return all tickets for a project
    - `POST /api/tickets/{id}/verify`: get default branch, get last commit, check if changed files intersect with project files, update ticket state accordingly, return diff
    - Handle no-change case (revert to to_do), GitHub errors (revert to to_do)
    - _Requirements: 4.3, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ] 7.3 Implement interview endpoints
    - Create `backend/app/api/interviews.py` with router
    - `POST /api/interviews/start`: validate ticket is in_review, call Tech_Lead agent with ticket + diff, return questions (30s timeout)
    - `POST /api/interviews/evaluate`: validate answers count matches questions, call Evaluator agent, persist review, update ticket state (done if approved, keep in_review if rejected), return feedback
    - _Requirements: 6.8, 6.10, 6.11, 6.12, 6.13, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 7.4 Write unit tests for ticket state transitions
    - Create `backend/tests/test_ticket_states.py`
    - Test valid transitions: to_do → in_review, in_review → done, in_review → to_do (revert)
    - Test invalid transitions: to_do → done (rejected), done → to_do (rejected)
    - _Requirements: 5.2, 5.5, 7.3, 7.4_

  - [ ]* 7.5 Write unit tests for provider factory
    - Create `backend/tests/test_provider_factory.py`
    - Test "gemini" → GeminiProvider, "groq" → GroqProvider
    - Test "openai" → ValueError, "" → ValueError, None → ValueError
    - _Requirements: 8.4, 8.5_

- [ ] 8. Checkpoint - Backend API complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement frontend pages and components
  - [ ] 9.1 Implement Landing Page and RepoInput component
    - Create `RepoInput` component with text input (maxLength 2048), validation feedback
    - Client-side format check for `https://github.com/{owner}/{repo}` pattern
    - Show error messages: empty field, invalid format, repo not found, timeout
    - Preserve input text on error, maintain focus on error
    - Call `POST /api/projects/validate-repo` on submit
    - Navigate to file selector on success
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

  - [ ] 9.2 Implement FileSelector component
    - Create tree view component showing directory structure (3 levels deep)
    - Support checkbox selection of folders (select all children) and individual files
    - Display file counter showing selected count / 50 max
    - Disable confirmation button when selection is 0 or > 50
    - Show appropriate messages for empty selection and over-limit
    - Handle GitHub API errors with retry option
    - On confirm, call `POST /api/projects` with repo_url and selected file paths
    - Show loading indicator during analysis pipeline
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2_

  - [ ] 9.3 Implement Dashboard with Kanban board
    - Create Dashboard page with 3 columns: "to_do", "in_review", "done"
    - Create `TicketCard` component showing: título (truncated at 80 chars), descripción (truncated at 200 chars), prioridad, dificultad, tiempo_estimado
    - Place tickets in columns based on their `estado` field
    - Show "Verificar" button on tickets in "to_do" state
    - Handle verify action: call `POST /api/tickets/{id}/verify`
    - Refresh ticket states after state-changing actions (verify, interview, evaluation)
    - Handle API errors with retry option, load within 3 seconds
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1_

  - [ ] 9.4 Implement InterviewModeSelector component
    - Create mode selection UI with "Chat" and "Llamada" options
    - Check Web Speech API support; disable "Llamada" if unsupported with explanation
    - On mode selection, call `POST /api/interviews/start` with ticket_id and mode
    - Navigate to appropriate interface based on selection
    - _Requirements: 6.1, 6.5_

  - [ ] 9.5 Implement ChatInterface component
    - Create bubble-style message interface with Tech_Lead avatar
    - Display questions from Tech_Lead as chat messages
    - Provide text input areas for each question (max 2000 chars per answer)
    - Single submit button to send all answers
    - Disable submit if any answer is empty
    - Call `POST /api/interviews/evaluate` on submit
    - Display feedback with visual differentiation for approval/rejection
    - Handle errors and timeouts with retry option
    - _Requirements: 6.2, 6.9, 6.10, 6.11, 6.12, 7.2_

  - [ ] 9.6 Implement VoiceInterface component
    - Create voice interface with SpeechRecognition for user input capture
    - Use SpeechSynthesis to read Tech_Lead questions and Evaluator feedback aloud
    - Show real-time transcription as subtitles
    - Enforce 2000-char limit on transcribed answers
    - Handle microphone permission denial: notify user, offer switch to Chat mode
    - Provide explicit action to switch from Llamada to Chat preserving conversation state
    - Reuse ChatInterface's submit logic (text-only to backend)
    - _Requirements: 6.3, 6.4, 6.6, 6.7, 6.9, 6.10_

  - [ ] 9.7 Implement FeedbackDisplay component
    - Create component showing Evaluator feedback
    - Visually differentiate approval (green/success) vs rejection (red/warning)
    - On approval: update Dashboard to show ticket in "done" column
    - On rejection: show reasons, allow user to retry with new commit
    - _Requirements: 7.2, 7.3, 7.4_

- [ ] 10. Checkpoint - Full application integration
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Wire frontend routing and end-to-end flow
  - [ ] 11.1 Set up React Router and page navigation
    - Configure routes: `/` (Landing), `/select` (FileSelector), `/dashboard` (Dashboard), `/interview/:ticketId` (Interview)
    - Wire navigation flow: Landing → FileSelector → Dashboard → Interview → Dashboard
    - Ensure state is passed correctly between pages (project ID, ticket ID, diff)
    - Create API service layer (`src/services/api.ts`) centralizing all backend calls with error handling
    - _Requirements: 1.8, 2.3, 5.6_

  - [ ] 11.2 Implement error handling and loading states
    - Create reusable error display component with retry button
    - Create loading spinner/skeleton components
    - Apply consistent error handling pattern across all API calls
    - Ensure no internal database details are exposed in error messages shown to user
    - _Requirements: 3.7, 4.5, 5.7, 6.13, 7.6, 9.6_

- [ ] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The design explicitly excludes property-based testing for this hackathon MVP; correctness properties serve as a manual QA checklist for Day 6
- Backend uses Python (FastAPI), frontend uses TypeScript (React + Vite + Tailwind CSS)
- AI providers (Gemini 2.5 Flash / Groq Llama 3 70B) are interchangeable via environment variable
- Voice mode uses browser-native Web Speech API — no audio leaves the client

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "3.1", "4.1", "5.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.5", "2.6", "2.7", "3.2"] },
    { "id": 3, "tasks": ["2.8", "7.1", "7.2", "7.3"] },
    { "id": 4, "tasks": ["7.4", "7.5", "9.1", "9.2"] },
    { "id": 5, "tasks": ["9.3", "9.4"] },
    { "id": 6, "tasks": ["9.5", "9.6", "9.7"] },
    { "id": 7, "tasks": ["11.1", "11.2"] }
  ]
}
```
