# Session-Wide GitHub PAT Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace build-time compiled GitHub PAT with a runtime session-wide PAT entered via modal dialog, validated against GitHub API, and stored in `sessionStorage`.

**Architecture:** Bottom-up — hook first (`usePat`), then modal component (`PatModal`), then service layer update (`useSourceControl`), then page integration (list page, create page), then webpack cleanup. TDD throughout.

**Tech Stack:** React 17, TypeScript, PatternFly 6 (`Modal`, `TextInput`, `Alert`, `Button`), Octokit (`@octokit/rest`), Jest + React Testing Library.

**Docs to read before starting:**

- `docs/ARCHITECTURE.md` — layered architecture, dependency rules, page/component/hook rules
- `docs/STYLEGUIDE.md` — code style, naming, no `any`, no `console.log`
- `docs/TESTING.md` — TDD flow, mock patterns, forbidden patterns
- `docs/design/2026-04-13-session-wide-gh-pat-design.md` — full spec for this feature

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/hooks/usePat.ts` | sessionStorage-backed PAT hook |
| Create | `src/hooks/usePat.test.ts` | Unit tests for usePat |
| Create | `src/components/PatModal.tsx` | Modal for PAT entry with GitHub API validation |
| Create | `src/components/PatModal.test.tsx` | Component tests for PatModal |
| Modify | `src/services/source-control/useSourceControl.ts` | Accept `pat` param, memoize instance |
| Modify | `src/services/source-control/useSourceControl.ts` test references | Existing tests mock this — update mock signatures |
| Modify | `src/views/FunctionsListPage.tsx` | Use `usePat()`, pass pat to hook, render PatModal |
| Modify | `src/views/FunctionsListPage.test.tsx` | Update mocks, add PAT modal tests |
| Modify | `src/components/CreateFunctionForm.tsx` | Remove PAT field |
| Modify | `src/components/CreateFunctionForm.test.tsx` | Remove PAT assertions |
| Modify | `src/views/FunctionCreatePage.tsx` | Use `usePat()`, render PatModal |
| Modify | `src/views/FunctionCreatePage.test.tsx` | Mock usePat, remove PAT from form flow |
| Modify | `webpack.config.ts` | Remove `__GITHUB_PAT__` DefinePlugin entry |
| Modify | `src/globals.d.ts` | Remove `__GITHUB_PAT__` declaration |
| Modify | `locales/en/plugin__console-functions-plugin.json` | Add new i18n strings |

---

### Task 1: Create `usePat` hook

**Files:**

- Create: `src/hooks/usePat.ts`
- Create: `src/hooks/usePat.test.ts`

- [ ] **Step 1: Write failing test — returns empty string when sessionStorage is empty**

Create `src/hooks/usePat.test.ts`:

```typescript
import { render, screen, act } from '@testing-library/react';
import { usePat } from './usePat';

beforeEach(() => {
  sessionStorage.clear();
});

function TestComponent() {
  const { pat } = usePat();
  return <span data-testid="pat">{pat}</span>;
}

describe('usePat', () => {
  it('returns empty string when sessionStorage is empty', () => {
    render(<TestComponent />);

    expect(screen.getByTestId('pat').textContent).toBe('');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/hooks/usePat.test.ts`
Expected: FAIL — module `./usePat` not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/hooks/usePat.ts`:

```typescript
import { useState } from 'react';

const SESSION_KEY = 'func-console-gh-pat';

export function usePat(): { pat: string; setPat: (value: string) => void; clearPat: () => void } {
  const [pat, setPatState] = useState(() => sessionStorage.getItem(SESSION_KEY) ?? '');

  const setPat = (value: string) => {
    sessionStorage.setItem(SESSION_KEY, value);
    setPatState(value);
  };

  const clearPat = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setPatState('');
  };

  return { pat, setPat, clearPat };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/hooks/usePat.test.ts`
Expected: PASS

- [ ] **Step 5: Write failing test — reads initial value from sessionStorage**

Add to `src/hooks/usePat.test.ts`:

```typescript
  it('reads initial value from sessionStorage', () => {
    sessionStorage.setItem('func-console-gh-pat', 'ghp_stored');

    render(<TestComponent />);

    expect(screen.getByTestId('pat').textContent).toBe('ghp_stored');
  });
```

- [ ] **Step 6: Run test to verify it passes** (implementation already handles this)

Run: `yarn test src/hooks/usePat.test.ts`
Expected: PASS

- [ ] **Step 7: Write failing test — setPat writes to sessionStorage and updates state**

Add `SetTestComponent` and test to `src/hooks/usePat.test.ts`:

```typescript
function SetTestComponent() {
  const { pat, setPat } = usePat();
  return (
    <>
      <span data-testid="pat">{pat}</span>
      <button onClick={() => setPat('ghp_new')}>set</button>
    </>
  );
}
```

```typescript
  it('setPat writes to sessionStorage and updates state', () => {
    render(<SetTestComponent />);

    act(() => {
      screen.getByRole('button', { name: 'set' }).click();
    });

    expect(screen.getByTestId('pat').textContent).toBe('ghp_new');
    expect(sessionStorage.getItem('func-console-gh-pat')).toBe('ghp_new');
  });
```

- [ ] **Step 8: Run test to verify it passes**

Run: `yarn test src/hooks/usePat.test.ts`
Expected: PASS

- [ ] **Step 9: Write failing test — clearPat removes from sessionStorage and resets state**

Add `ClearTestComponent` and test to `src/hooks/usePat.test.ts`:

```typescript
function ClearTestComponent() {
  const { pat, setPat, clearPat } = usePat();
  return (
    <>
      <span data-testid="pat">{pat}</span>
      <button onClick={() => setPat('ghp_temp')}>set</button>
      <button onClick={() => clearPat()}>clear</button>
    </>
  );
}
```

```typescript
  it('clearPat removes from sessionStorage and resets state', () => {
    render(<ClearTestComponent />);

    act(() => {
      screen.getByRole('button', { name: 'set' }).click();
    });
    expect(screen.getByTestId('pat').textContent).toBe('ghp_temp');

    act(() => {
      screen.getByRole('button', { name: 'clear' }).click();
    });
    expect(screen.getByTestId('pat').textContent).toBe('');
    expect(sessionStorage.getItem('func-console-gh-pat')).toBeNull();
  });
```

- [ ] **Step 10: Run test to verify it passes**

Run: `yarn test src/hooks/usePat.test.ts`
Expected: PASS

- [ ] **Step 11: Commit**

```bash
git add src/hooks/usePat.ts src/hooks/usePat.test.ts
git commit -m "feat: add usePat hook backed by sessionStorage"
```

---

### Task 2: Create `PatModal` component

**Files:**

- Create: `src/components/PatModal.tsx`
- Create: `src/components/PatModal.test.tsx`

- [ ] **Step 1: Write failing test — does not render when isOpen is false**

Create `src/components/PatModal.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { PatModal } from './PatModal';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockGetAuthenticated = jest.fn();

jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    users: { getAuthenticated: mockGetAuthenticated },
  })),
}));

afterEach(() => {
  jest.restoreAllMocks();
});

describe('PatModal', () => {
  it('does not render when isOpen is false', () => {
    render(<PatModal isOpen={false} onSave={jest.fn()} />);

    expect(screen.queryByText('GitHub Personal Access Token')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/components/PatModal.test.tsx`
Expected: FAIL — module `./PatModal` not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/PatModal.tsx`:

```typescript
import { useState } from 'react';
import {
  Alert,
  Button,
  Form,
  FormGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
} from '@patternfly/react-core';
import { Octokit } from '@octokit/rest';
import { useTranslation } from 'react-i18next';

interface PatModalProps {
  isOpen: boolean;
  onSave: (pat: string) => void;
}

export function PatModal({ isOpen, onSave }: PatModalProps) {
  const { t } = useTranslation('plugin__console-functions-plugin');
  const [token, setToken] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsValidating(true);
    setError('');

    try {
      const octokit = new Octokit({ auth: token });
      await octokit.users.getAuthenticated();
      onSave(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Modal
      isOpen
      variant="small"
      aria-label={t('GitHub Personal Access Token')}
      onClose={() => {}}
    >
      <ModalHeader title={t('GitHub Personal Access Token')} />
      <ModalBody>
        {error && (
          <Alert variant="danger" title={t('Invalid token')} isInline>
            {error}
          </Alert>
        )}
        <Form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <FormGroup label={t('Personal Access Token')} isRequired fieldId="pat-input">
            <TextInput
              id="pat-input"
              type="password"
              isRequired
              value={token}
              onChange={(_e, val) => setToken(val)}
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={handleSave}
          isDisabled={!token || isValidating}
          isLoading={isValidating}
        >
          {t('Save')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/components/PatModal.test.tsx`
Expected: PASS

- [ ] **Step 5: Write failing test — renders modal when isOpen is true**

Add to `src/components/PatModal.test.tsx`:

```typescript
  it('renders modal with token input when isOpen is true', () => {
    render(<PatModal isOpen={true} onSave={jest.fn()} />);

    expect(screen.getByText('GitHub Personal Access Token')).toBeInTheDocument();
    expect(screen.getByLabelText(/Personal Access Token/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save/ })).toBeInTheDocument();
  });
```

- [ ] **Step 6: Run test to verify it passes**

Run: `yarn test src/components/PatModal.test.tsx`
Expected: PASS

- [ ] **Step 7: Write failing test — Save is disabled when input is empty**

Add to `src/components/PatModal.test.tsx`:

```typescript
  it('disables Save button when input is empty', () => {
    render(<PatModal isOpen={true} onSave={jest.fn()} />);

    expect(screen.getByRole('button', { name: /Save/ })).toBeDisabled();
  });
```

- [ ] **Step 8: Run test to verify it passes**

Run: `yarn test src/components/PatModal.test.tsx`
Expected: PASS

- [ ] **Step 9: Write failing test — calls onSave with valid PAT**

Add to `src/components/PatModal.test.tsx`:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
```

(Update the import at the top of the file to include `waitFor`, and add `userEvent`.)

```typescript
  it('calls onSave when PAT is valid', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    mockGetAuthenticated.mockResolvedValue({ data: { login: 'testuser' } });

    render(<PatModal isOpen={true} onSave={onSave} />);

    await user.type(screen.getByLabelText(/Personal Access Token/), 'ghp_valid');
    await user.click(screen.getByRole('button', { name: /Save/ }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('ghp_valid');
    });
  });
```

- [ ] **Step 10: Run test to verify it passes**

Run: `yarn test src/components/PatModal.test.tsx`
Expected: PASS

- [ ] **Step 11: Write failing test — shows error on invalid PAT**

Add to `src/components/PatModal.test.tsx`:

```typescript
  it('shows error when PAT is invalid', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    mockGetAuthenticated.mockRejectedValue(new Error('Bad credentials'));

    render(<PatModal isOpen={true} onSave={onSave} />);

    await user.type(screen.getByLabelText(/Personal Access Token/), 'ghp_invalid');
    await user.click(screen.getByRole('button', { name: /Save/ }));

    await waitFor(() => {
      expect(screen.getByText('Bad credentials')).toBeInTheDocument();
    });
    expect(onSave).not.toHaveBeenCalled();
  });
```

- [ ] **Step 12: Run test to verify it passes**

Run: `yarn test src/components/PatModal.test.tsx`
Expected: PASS

- [ ] **Step 13: Commit**

```bash
git add src/components/PatModal.tsx src/components/PatModal.test.tsx
git commit -m "feat: add PatModal component with GitHub PAT validation"
```

---

### Task 3: Update `useSourceControl` to accept PAT parameter

**Files:**

- Modify: `src/services/source-control/useSourceControl.ts`

- [ ] **Step 1: Update `useSourceControl` to accept `pat` parameter**

Replace the full content of `src/services/source-control/useSourceControl.ts`:

```typescript
import { useMemo } from 'react';
import { GithubService } from './GithubService';
import { SourceControlService } from './SourceControlService';

export function useSourceControl(pat: string): SourceControlService {
  return useMemo(() => new GithubService(pat), [pat]);
}
```

- [ ] **Step 2: Run all tests to verify nothing is broken**

Run: `yarn test`
Expected: Tests that mock `useSourceControl` still pass because they mock the entire module. The mock call sites return mock objects regardless of the argument.

- [ ] **Step 3: Commit**

```bash
git add src/services/source-control/useSourceControl.ts
git commit -m "refactor: useSourceControl accepts pat parameter instead of build-time global"
```

---

### Task 4: Integrate `usePat` and `PatModal` into `FunctionsListPage`

**Files:**

- Modify: `src/views/FunctionsListPage.tsx`
- Modify: `src/views/FunctionsListPage.test.tsx`

- [ ] **Step 1: Write failing test — renders PatModal when PAT is empty**

Add mock for `usePat` and new test to `src/views/FunctionsListPage.test.tsx`.

Add these mock declarations near the top with the other mocks:

```typescript
const mockUsePat = jest.fn();
jest.mock('../hooks/usePat', () => ({
  usePat: () => mockUsePat(),
}));

jest.mock('../components/PatModal', () => ({
  PatModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? 'PatModal-open' : null,
}));
```

Add test:

```typescript
  it('renders PatModal when PAT is empty', () => {
    mockUsePat.mockReturnValue({ pat: '', setPat: jest.fn(), clearPat: jest.fn() });
    mockUseSourceControl.mockReturnValue({
      listFunctionRepos: jest.fn().mockResolvedValue([]),
      fetchFileContent: jest.fn(),
    });
    mockUseClusterService.mockReturnValue({ deployments: [], loaded: true, error: null });

    render(
      <MemoryRouter>
        <FunctionsListPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('PatModal-open')).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/views/FunctionsListPage.test.tsx`
Expected: FAIL — module `../hooks/usePat` not found or PatModal not rendered.

- [ ] **Step 3: Update FunctionsListPage to use `usePat` and render `PatModal`**

In `src/views/FunctionsListPage.tsx`, add imports:

```typescript
import { usePat } from '../hooks/usePat';
import { PatModal } from '../components/PatModal';
```

Update the `FunctionsListPage` default export to use `usePat` and pass `pat` to `useFunctionListPage`:

```typescript
export default function FunctionsListPage() {
  const { t } = useTranslation('plugin__console-functions-plugin');
  const { pat, setPat } = usePat();
  const { functions, loaded, onEdit } = useFunctionListPage(pat);

  return (
    <>
      <PatModal isOpen={!pat} onSave={setPat} />
      <DocumentTitle>{t('Functions')}</DocumentTitle>
      <ListPageHeader title={t('Functions')} />
      <PageSection>
        {!loaded && (
          <Spinner aria-label={t('Loading')} style={{ display: 'block', margin: '4rem auto' }} />
        )}
        {loaded && functions.length === 0 && <FunctionsEmptyState />}
        {loaded && functions.length > 0 && (
          <>
            <Content component={ContentVariants.p}>
              {t(
                'Serverless functions in your repository and deployed to your cluster. Manage lifecycle, monitor status, and scale on demand.',
              )}
            </Content>
            <Content component={ContentVariants.p}>
              <Button
                variant="primary"
                component={(props) => <Link {...props} to="/functions2/create" />}
              >
                {t('Create new function')}
              </Button>
            </Content>
            <FunctionTable functions={functions} onEdit={onEdit} />
          </>
        )}
      </PageSection>
    </>
  );
}
```

Update `useFunctionListPage` to accept `pat` and pass it to `useSourceControl`:

```typescript
function useFunctionListPage(pat: string): {
  functions: FunctionTableItem[];
  loaded: boolean;
  onEdit: (name: string) => void;
} {
  const sourceControl = useSourceControl(pat);
  const { deployments, loaded: clusterLoaded } = useClusterService();
  const navigate = useNavigate();

  const [functionItems, setFunctionItems] = useState<FunctionTableItem[]>([]);
  const [reposLoaded, setReposLoaded] = useState(false);

  useEffect(() => {
    if (!pat) {
      setReposLoaded(true);
      return;
    }

    let ignore = false;

    async function loadFunctionTableItems() {
      const repos = await sourceControl.listFunctionRepos();
      const items = await Promise.all(
        repos.map(async (repo) => {
          const funcYaml = await sourceControl.fetchFileContent(repo, 'func.yaml');
          const { namespace, runtime } = parseNamespaceAndRuntime(funcYaml, repo.name);
          return newItem(repo.name, namespace, runtime);
        }),
      );
      if (!ignore) {
        setFunctionItems(items);
        setReposLoaded(true);
      }
    }

    loadFunctionTableItems().catch(() => {
      if (!ignore) {
        setReposLoaded(true);
      }
    });
    return () => {
      ignore = true;
    };
  }, [sourceControl, pat]);

  const functions = useMemo(
    () =>
      functionItems.map((item) => {
        const deployment = deployments.find(
          (d) => d.metadata?.labels?.['function.knative.dev/name'] === item.name,
        );
        return deployment ? enrichItem(item, deployment) : item;
      }),
    [functionItems, deployments],
  );

  const loaded = reposLoaded && clusterLoaded;

  const onEdit = (name: string) => navigate(`/functions2/edit/${name}`);
  return { functions, loaded, onEdit };
}
```

- [ ] **Step 4: Update existing tests to mock `usePat` with a valid token**

In `src/views/FunctionsListPage.test.tsx`, add to each existing test's setup (inside each `it` block, before `render`):

```typescript
    mockUsePat.mockReturnValue({ pat: 'ghp_test', setPat: jest.fn(), clearPat: jest.fn() });
```

Also update the `useSourceControl` mock to accept a parameter (the mock already ignores it since it returns `mockUseSourceControl()`, so this requires no functional change to the mock definition).

- [ ] **Step 5: Run all tests to verify they pass**

Run: `yarn test src/views/FunctionsListPage.test.tsx`
Expected: PASS — all existing tests pass plus the new PatModal test.

- [ ] **Step 6: Write failing test — does not render PatModal when PAT is set**

Add to `src/views/FunctionsListPage.test.tsx`:

```typescript
  it('does not render PatModal when PAT is set', () => {
    mockUsePat.mockReturnValue({ pat: 'ghp_valid', setPat: jest.fn(), clearPat: jest.fn() });
    mockUseSourceControl.mockReturnValue({
      listFunctionRepos: jest.fn().mockResolvedValue([]),
      fetchFileContent: jest.fn(),
    });
    mockUseClusterService.mockReturnValue({ deployments: [], loaded: true, error: null });

    render(
      <MemoryRouter>
        <FunctionsListPage />
      </MemoryRouter>,
    );

    expect(screen.queryByText('PatModal-open')).not.toBeInTheDocument();
  });
```

- [ ] **Step 7: Run test to verify it passes**

Run: `yarn test src/views/FunctionsListPage.test.tsx`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/views/FunctionsListPage.tsx src/views/FunctionsListPage.test.tsx
git commit -m "feat: integrate session PAT into FunctionsListPage with PatModal gate"
```

---

### Task 5: Remove PAT field from `CreateFunctionForm`

**Files:**

- Modify: `src/components/CreateFunctionForm.tsx`
- Modify: `src/components/CreateFunctionForm.test.tsx`

- [ ] **Step 1: Update test — remove PAT field assertion from 'renders all form fields'**

In `src/components/CreateFunctionForm.test.tsx`, remove this line from the 'renders all form fields' test:

```typescript
    expect(screen.getByLabelText(/Personal Access Token/)).toBeInTheDocument();
```

- [ ] **Step 2: Update test — remove PAT from 'calls onSubmit with form data'**

In `src/components/CreateFunctionForm.test.tsx`, in the 'calls onSubmit with form data when form is filled and Create is clicked' test:

Remove:

```typescript
    await user.type(screen.getByLabelText(/Personal Access Token/), 'ghp_token');
```

Update the `toHaveBeenCalledWith` expectation — remove `pat: 'ghp_token'`:

```typescript
    expect(onSubmit).toHaveBeenCalledWith({
      owner: 'testuser',
      repo: 'my-repo',
      branch: 'main',
      name: 'my-func',
      runtime: 'node',
      registry: 'quay.io/test',
      namespace: 'default',
    });
```

- [ ] **Step 3: Run tests to verify they fail** (PAT field still exists in component)

Run: `yarn test src/components/CreateFunctionForm.test.tsx`
Expected: FAIL — the onSubmit assertion fails because the component still sends `pat`.

- [ ] **Step 4: Remove PAT from `CreateFunctionForm` component**

In `src/components/CreateFunctionForm.tsx`:

Remove `pat` from the `CreateFunctionFormData` interface:

```typescript
export interface CreateFunctionFormData {
  owner: string;
  repo: string;
  branch: string;
  name: string;
  runtime: FunctionRuntime;
  registry: string;
  namespace: string;
}
```

Remove the PAT state line:

```typescript
  const [pat, setPat] = useState('');
```

Update validation — remove `pat` from the condition:

```typescript
  const isValid = owner && repo && branch && name && registry && namespace;
```

Update handleSubmit — remove `pat` from the data object:

```typescript
  const handleSubmit = () => {
    onSubmit({ owner, repo, branch, name, runtime, registry, namespace });
  };
```

Remove the PAT FormGroup JSX block (lines 84-92 in the original file):

```tsx
        <FormGroup label={t('Personal Access Token')} isRequired fieldId="pat">
          <TextInput
            id="pat"
            type="password"
            isRequired
            value={pat}
            onChange={(_e, val) => setPat(val)}
          />
        </FormGroup>
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `yarn test src/components/CreateFunctionForm.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/CreateFunctionForm.tsx src/components/CreateFunctionForm.test.tsx
git commit -m "refactor: remove PAT field from CreateFunctionForm"
```

---

### Task 6: Integrate `usePat` and `PatModal` into `FunctionCreatePage`

**Files:**

- Modify: `src/views/FunctionCreatePage.tsx`
- Modify: `src/views/FunctionCreatePage.test.tsx`

- [ ] **Step 1: Update test — add usePat mock and remove PAT from form fill**

In `src/views/FunctionCreatePage.test.tsx`, add these mocks near the top with the other mocks:

```typescript
const mockUsePat = jest.fn();
jest.mock('../hooks/usePat', () => ({
  usePat: () => mockUsePat(),
}));

jest.mock('../components/PatModal', () => ({
  PatModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? 'PatModal-open' : null,
}));
```

Update the `fillForm` helper — remove the PAT line:

```typescript
const fillForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByRole('textbox', { name: /Owner/ }), 'testuser');
  await user.type(screen.getByRole('textbox', { name: /Repository/ }), 'my-repo');
  await user.type(screen.getByRole('textbox', { name: /Branch/ }), 'main');
  await user.type(screen.getByRole('textbox', { name: /^Name$/ }), 'my-func');
  await user.type(screen.getByRole('textbox', { name: /Registry/ }), 'quay.io/test');
  await user.type(screen.getByRole('textbox', { name: /Namespace/ }), 'default');
};
```

Add `mockUsePat` setup to each existing test (before `render`):

```typescript
    mockUsePat.mockReturnValue({ pat: 'ghp_session', setPat: jest.fn(), clearPat: jest.fn() });
```

Update the `pushFiles` assertion — the PAT should now be `'ghp_session'` (from usePat), not `'ghp_token'` (from form):

```typescript
    await waitFor(() => {
      expect(mockPushFiles).toHaveBeenCalledWith(
        { owner: 'testuser', repo: 'my-repo', branch: 'main' },
        'ghp_session',
        files,
        'Initialize Knative function project',
      );
    });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test src/views/FunctionCreatePage.test.tsx`
Expected: FAIL — `FunctionCreatePage` doesn't use `usePat` yet, so pushFiles still receives the old PAT.

- [ ] **Step 3: Update FunctionCreatePage to use `usePat` and `PatModal`**

Replace `src/views/FunctionCreatePage.tsx`:

```typescript
import { useState } from 'react';
import { DocumentTitle, ListPageHeader } from '@openshift-console/dynamic-plugin-sdk';
import { Alert, PageSection } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import { CreateFunctionForm, CreateFunctionFormData } from '../components/CreateFunctionForm';
import { useFunctionService } from '../services/function/useFunctionService';
import { useGitHubService } from '../services/github/useGitHubService';
import { usePat } from '../hooks/usePat';
import { PatModal } from '../components/PatModal';

export default function FunctionCreatePage() {
  const { t } = useTranslation('plugin__console-functions-plugin');
  const navigate = useNavigate();
  const functionService = useFunctionService();
  const gitHubService = useGitHubService();
  const { pat, setPat } = usePat();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateFunctionFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const files = await functionService.generateFunction({
        name: data.name,
        runtime: data.runtime,
        registry: data.registry,
        namespace: data.namespace,
        branch: data.branch,
      });

      await gitHubService.pushFiles(
        { owner: data.owner, repo: data.repo, branch: data.branch },
        pat,
        files,
        'Initialize Knative function project',
      );

      navigate('/functions2');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/functions2');
  };

  return (
    <>
      <PatModal isOpen={!pat} onSave={setPat} />
      <DocumentTitle>{t('Create function')}</DocumentTitle>
      <ListPageHeader title={t('Create function')} />
      <PageSection>
        {error && (
          <Alert variant="danger" title={t('Error creating function')} isInline>
            {error}
          </Alert>
        )}
        <CreateFunctionForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </PageSection>
    </>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn test src/views/FunctionCreatePage.test.tsx`
Expected: PASS

- [ ] **Step 5: Write failing test — renders PatModal when PAT is empty**

Add to `src/views/FunctionCreatePage.test.tsx`:

```typescript
  it('renders PatModal when PAT is empty', () => {
    mockUsePat.mockReturnValue({ pat: '', setPat: jest.fn(), clearPat: jest.fn() });

    render(
      <MemoryRouter>
        <FunctionCreatePage />
      </MemoryRouter>,
    );

    expect(screen.getByText('PatModal-open')).toBeInTheDocument();
  });
```

- [ ] **Step 6: Run test to verify it passes**

Run: `yarn test src/views/FunctionCreatePage.test.tsx`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/views/FunctionCreatePage.tsx src/views/FunctionCreatePage.test.tsx
git commit -m "feat: integrate session PAT into FunctionCreatePage with PatModal gate"
```

---

### Task 7: Remove `__GITHUB_PAT__` from webpack and globals

**Files:**

- Modify: `webpack.config.ts`
- Modify: `src/globals.d.ts`

- [ ] **Step 1: Remove DefinePlugin entry from `webpack.config.ts`**

In `webpack.config.ts`, change the plugins array. Remove the `__GITHUB_PAT__` entry from `DefinePlugin`. If `DefinePlugin` has no other entries, remove the entire `DefinePlugin` usage and its import.

Current code:

```typescript
  plugins: [
    new DefinePlugin({
      __GITHUB_PAT__: JSON.stringify(process.env.GITHUB_PAT || ''),
    }),
    new ConsoleRemotePlugin(),
```

Replace with:

```typescript
  plugins: [
    new ConsoleRemotePlugin(),
```

Also remove `DefinePlugin` from the webpack import. Change:

```typescript
import { Configuration as WebpackConfiguration, DefinePlugin } from 'webpack';
```

To:

```typescript
import { Configuration as WebpackConfiguration } from 'webpack';
```

- [ ] **Step 2: Remove `__GITHUB_PAT__` declaration from `src/globals.d.ts`**

Delete the file `src/globals.d.ts` — it only contains the `__GITHUB_PAT__` declaration and nothing else.

- [ ] **Step 3: Run all tests to verify nothing is broken**

Run: `yarn test`
Expected: PASS — all tests pass. No code references `__GITHUB_PAT__` anymore.

- [ ] **Step 4: Commit**

```bash
git add webpack.config.ts src/globals.d.ts
git commit -m "chore: remove build-time __GITHUB_PAT__ from webpack DefinePlugin and globals"
```

---

### Task 8: Add i18n strings and run final verification

**Files:**

- Modify: `locales/en/plugin__console-functions-plugin.json`

- [ ] **Step 1: Add new i18n keys**

Add these keys to `locales/en/plugin__console-functions-plugin.json` (in alphabetical order):

```
"GitHub Personal Access Token": "GitHub Personal Access Token",
"Invalid token": "Invalid token",
"Save": "Save",
```

Note: `"Personal Access Token"` already exists in the locale file.

- [ ] **Step 2: Run full test suite**

Run: `yarn test`
Expected: PASS — all tests across all suites pass.

- [ ] **Step 3: Verify webpack build succeeds**

Run: `yarn build-dev`
Expected: Build completes without errors.

- [ ] **Step 4: Commit**

```bash
git add locales/en/plugin__console-functions-plugin.json
git commit -m "chore: add i18n strings for PatModal"
```

---

### Task 9: Update `features.json`

**Files:**

- Modify: `docs/features.json`

- [ ] **Step 1: Mark the feature as passing**

In `docs/features.json`, find the "Session wide GitHub Personal Access Token" entry and set `"passes": true`.

- [ ] **Step 2: Commit**

```bash
git add docs/features.json
git commit -m "chore: mark session-wide GH PAT feature as passing"
```
