# Planning Guide

How to create implementation plans for func-console features.

## Process

1. Use the `superpowers:brainstorming` skill to explore requirements and design before writing the plan
2. Read `docs/ARCHITECTURE.md` + `docs/STYLEGUIDE.md` + `docs/TESTING.md` for constraints
3. Write the plan to `docs/plans/active/<NNN>-<type>-<short-name>.md` where `<NNN>` is the next incrementing number

## What Goes in a Plan

- **Goal** — one sentence describing the deliverable
- **Architecture** — how the pieces fit together (layers, data flow)
- **Tasks** — ordered list of implementation steps with file paths
- **Test case outlines** — bullet points describing what each test verifies (one-liners)
- **Critical code snippets** — only when the approach is non-obvious (e.g. mapping rules, type definitions, unusual API usage)
- **Architectural decisions** — trade-offs, alternatives considered, why this approach

## What Does NOT Go in a Plan

- Full implementation code — the agent figures this out during TDD
- Full test code — the agent writes tests one at a time following red/green/refactor
- Commit messages — the agent drafts these from the actual diff
- Step-by-step bash commands — the agent knows how to run tests and commit

## Task Structure

Each task should have:

- A short description and the files involved
- Test case outlines (if the task involves testable code)
- E2e test case outlines (if the task involves user-facing changes)
- Checkboxes for tracking: `- [ ] TDD cycle per test case`, `- [ ] yarn test`, `- [ ] Commit`

## Plan Size

A good plan is 50–150 lines. If it's longer, it probably contains too much code. If it's shorter, it might be missing architectural context.
