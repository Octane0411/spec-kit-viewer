---
description: "Task list template for feature implementation"
---

# Tasks: Spec-Kit-Viewer VSCode Extension

**Input**: Design documents from `/specs/001-spec-kit-viewer/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Extension**: `src/`
- **Webviews**: `webviews/`
- **Tests**: `test/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project structure (src, webviews, test) per implementation plan
- [x] T002 Initialize `package.json` with dependencies (react, reactflow, remark, axios)
- [x] T003 [P] Configure `tsconfig.json` and build scripts (webpack/esbuild) for extension and webviews

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create `SpecFile`, `Dependency`, `TranslationCache` types in `src/types/index.ts`
- [x] T005 [P] Implement `ParserService` (remark) in `src/services/parser/ParserService.ts`
- [x] T006 [P] Implement `TranslationCache` (Memento wrapper) in `src/services/translation/TranslationCache.ts`
- [x] T007 [P] Create `TranslationService` interface and stub in `src/services/translation/TranslationService.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Live Translation of Specs (Priority: P1) 🎯 MVP

**Goal**: Real-time Chinese translation of specs via CodeLens and Side-by-Side Preview.

**Independent Test**: Open a `.spec` file, click "Translate", see results in side-by-side view.

### Implementation for User Story 1

- [x] T008 [P] [US1] Implement `SpecTranslationProvider` (CodeLens) in `src/providers/SpecTranslationProvider.ts` ✅
- [x] T010 [US1] Create `TranslationPanel` class (Webview) in `src/panels/TranslationPanel.ts` ✅
- [x] T011 [P] [US1] Create React component `TranslationView` in `webviews/pages/TranslationView.tsx` ✅
- [x] T012 [US1] Implement `TranslationService` real API call (streaming) in `src/services/translation/FridayClient.ts` ✅
- [x] T013 [US1] Register commands and providers in `src/extension.ts` ✅

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Spec Dependency Visualization (Priority: P3)

**Goal**: Interactive graph visualization of spec dependencies.

**Independent Test**: Run `SpecKit: Show Graph` and verify nodes/edges match workspace files.

### Implementation for User Story 2

- [ ] T014 [US2] Create `GraphPanel` class (Webview) in `src/panels/GraphPanel.ts`
- [ ] T015 [P] [US2] Create React component `GraphView` (ReactFlow) in `webviews/pages/GraphView.tsx`
- [ ] T016 [P] [US2] Implement `GraphBuilder` service in `src/services/graph/GraphBuilder.ts`
- [ ] T017 [US2] Implement message passing (updateGraph, nodeSelected) in `src/panels/GraphPanel.ts`
- [ ] T018 [US2] Register `SpecKit: Show Graph` command in `src/extension.ts`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T019 [P] Add error handling for API failures in `src/services/translation/FridayClient.ts`
- [ ] T020 [P] Update `README.md` with usage instructions
- [ ] T021 [P] Add unit tests for `ParserService` in `test/unit/ParserService.test.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P3)**: Can start after Foundational (Phase 2) - Independent of US1

### Within Each User Story

- Models before services
- Services before endpoints/UI
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- React components (Webviews) can be built in parallel with Extension Host logic

---

## Parallel Example: User Story 1

```bash
# Launch UI and Service implementation in parallel:
Task: "Create React component TranslationView in webviews/pages/TranslationView.tsx"
Task: "Implement TranslationService real API call (streaming) in src/services/translation/FridayClient.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Each story adds value without breaking previous stories