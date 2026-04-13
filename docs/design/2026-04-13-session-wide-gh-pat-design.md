# Session-Wide GitHub Personal Access Token

**Date:** 2026-04-13
**Status:** Draft
**Feature:** Session wide GitHub Personal Access Token (features.json)

## Problem

The GitHub PAT is currently injected at build time via webpack `DefinePlugin` from the `GITHUB_PAT` environment variable. This compiles the PAT as a string literal into the distributed JavaScript bundle — anyone with access to the bundle can extract it. Additionally, the Function Create form has a separate PAT text input, creating two inconsistent PAT entry points.

## Solution

Replace the build-time PAT with a session-wide runtime PAT. On first visit to any plugin page, a modal prompts the user to enter their PAT. The PAT is validated against the GitHub API, stored in `sessionStorage` (survives refresh, cleared on tab close), and used by all services that need GitHub access.

## Architecture

### PAT Storage Hook — `usePat`

Location: `src/hooks/usePat.ts`

A custom hook backed by `sessionStorage`. Returns `{ pat, setPat, clearPat }`.

- Reads initial value from `sessionStorage` key `func-console-gh-pat` on mount.
- `setPat(value)` writes to `sessionStorage` and updates React state.
- `clearPat()` removes from `sessionStorage` and resets state to empty string.

No React Context is needed. OCP dynamic plugins load each page as an independent module with no shared parent component. Since `sessionStorage` is the actual cross-page shared state, each page calls `usePat()` independently and gets the current value.

### PAT Modal — `PatModal`

Location: `src/components/PatModal.tsx`

A PatternFly `Modal` component displayed when no PAT is set.

**Props:**
- `isOpen: boolean` — controls visibility
- `onSave: (pat: string) => void` — called with validated PAT

**Behavior:**
- Non-dismissable: no close button, no backdrop click dismiss. The user must provide a valid PAT to use the plugin.
- Contains a password `TextInput` for the PAT.
- Save button triggers validation: calls GitHub API `GET /user` via Octokit with the entered PAT.
- On success: calls `onSave` with the PAT.
- On failure: shows an inline PatternFly `Alert` with the error message.
- Save button shows a loading spinner (`isLoading`) while validating.

### Service Layer Changes

**`useSourceControl(pat: string): SourceControlService`**

The hook accepts a `pat` parameter. Returns a `GithubService` instance memoized on `pat` via `useMemo`. No more module-level singleton. The `GithubService` class is unchanged — constructor still takes PAT, creates Octokit once per instance.

**`OctokitGitHubService.pushFiles`** — unchanged. Already accepts PAT as a parameter.

**`useGitHubService`** — unchanged. The `pushFiles` method already takes PAT as an argument.

### Webpack Cleanup

- Remove `DefinePlugin` entry for `__GITHUB_PAT__` from `webpack.config.ts`.
- Remove `declare const __GITHUB_PAT__: string` from `src/globals.d.ts`.

### Page Integration

Each page that requires a PAT renders the modal conditionally:

```tsx
function SomePage() {
  const { pat, setPat } = usePat();

  return (
    <>
      <PatModal isOpen={!pat} onSave={setPat} />
      {/* page content */}
    </>
  );
}
```

**FunctionsListPage:**
- Add `usePat()` in the page component, pass `pat` to `useFunctionListPage(pat)`.
- `useFunctionListPage(pat)` passes `pat` to `useSourceControl(pat)`.
- The `useEffect` that fetches repos skips the API call when `pat` is empty (avoids a failed request while the modal is visible).
- Render `PatModal` when `pat` is empty.

**FunctionCreatePage:**
- Add `usePat()`, pass `pat` to `gitHubService.pushFiles()` instead of `data.pat`.
- Render `PatModal` when `pat` is empty.

**CreateFunctionForm:**
- Remove the PAT `TextInput` field.
- Remove `pat` from `CreateFunctionFormData` interface.
- Remove `pat` from form validation and local state.

**FunctionEditPage:** Not modified — PAT integration deferred to when that page is built out.

## Files Changed

| File | Change |
|------|--------|
| `src/hooks/usePat.ts` | New — sessionStorage-backed PAT hook |
| `src/components/PatModal.tsx` | New — modal with PAT validation |
| `webpack.config.ts` | Remove `__GITHUB_PAT__` DefinePlugin entry |
| `src/globals.d.ts` | Remove `__GITHUB_PAT__` declaration |
| `src/services/source-control/useSourceControl.ts` | Accept `pat` param, `useMemo` instance |
| `src/components/CreateFunctionForm.tsx` | Remove PAT field, update interface |
| `src/views/FunctionCreatePage.tsx` | Use `usePat()`, render `PatModal` |
| `src/views/FunctionsListPage.tsx` | Use `usePat()`, pass to `useSourceControl`, render `PatModal` |

## Test Strategy

**New test suites:**

- `usePat.test.ts` — returns empty string when sessionStorage is empty; `setPat` writes to sessionStorage and updates state; `clearPat` removes from sessionStorage and resets state.
- `PatModal.test.tsx` — renders when `isOpen` is true; does not render when false; shows error on invalid PAT (mock Octokit rejects); calls `onSave` with valid PAT (mock Octokit resolves); Save button shows spinner while validating.

**Modified test suites:**

- `CreateFunctionForm.test.tsx` — remove PAT field assertions, update form data expectations.
- `FunctionCreatePage.test.tsx` — remove PAT from form submit data, mock `usePat` to return a token.
- `FunctionsListPage.test.tsx` — mock `usePat`, verify `PatModal` renders when PAT is empty.

**Mocking:** sessionStorage is available in jsdom. Octokit validation call mocked via jest module mock, consistent with existing patterns.
