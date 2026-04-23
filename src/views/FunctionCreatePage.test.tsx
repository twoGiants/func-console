import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import FunctionCreatePage from './FunctionCreatePage';
import { PAT_KEY } from '../services/types';

const mockGenerateFunction = jest.fn();
const mockPush = jest.fn();
const mockNavigate = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  DocumentTitle: ({ children }: { children: string }) => children,
  ListPageHeader: ({ title, children }: { title: string; children?: React.ReactNode }) => (
    <>
      {title}
      {children}
    </>
  ),
}));

jest.mock('../services/function/useFunctionService', () => ({
  useFunctionService: () => ({ generateFunction: mockGenerateFunction }),
}));

jest.mock('../services/source-control/useSourceControlService', () => ({
  useSourceControlService: () => ({
    push: mockPush,
    listFunctionRepos: jest.fn(),
    fetchFileContent: jest.fn(),
  }),
}));

jest.mock('react-router-dom-v5-compat', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('../components/UserAvatar', () => ({
  UserAvatar: ({ enableReconnect }: { enableReconnect: boolean }) => (
    <span data-testid="user-avatar">{enableReconnect ? 'reconnect' : 'no-reconnect'}</span>
  ),
}));

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  sessionStorage.clear();
});

const fillForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByRole('textbox', { name: /Owner/ }), 'testuser');
  await user.type(screen.getByRole('textbox', { name: /Repository/ }), 'my-repo');
  await user.type(screen.getByRole('textbox', { name: /Branch/ }), 'main');
  await user.type(screen.getByRole('textbox', { name: /^Name$/ }), 'my-func');
  await user.type(screen.getByRole('textbox', { name: /Registry/ }), 'quay.io/test');
  await user.type(screen.getByRole('textbox', { name: /Namespace/ }), 'default');
};

describe('FunctionCreatePage', () => {
  it('renders CreateFunctionForm', () => {
    sessionStorage.setItem(PAT_KEY, 'ghp_test');

    render(
      <MemoryRouter>
        <FunctionCreatePage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('textbox', { name: /Owner/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create/ })).toBeInTheDocument();
  });

  it('calls generateFunction then push on submit, and navigates on success', async () => {
    sessionStorage.setItem(PAT_KEY, 'ghp_test');
    const user = userEvent.setup();
    const files = [{ path: 'func.yaml', mode: '100644', content: 'name: f', type: 'blob' }];
    mockGenerateFunction.mockResolvedValue(files);
    mockPush.mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <FunctionCreatePage />
      </MemoryRouter>,
    );

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /Create/ }));

    await waitFor(() => {
      expect(mockGenerateFunction).toHaveBeenCalledWith({
        name: 'my-func',
        runtime: 'node',
        registry: 'quay.io/test',
        namespace: 'default',
        branch: 'main',
      });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        { owner: 'testuser', repo: 'my-repo', branch: 'main' },
        files,
        'Initialize Knative function project',
      );
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/faas');
    });
  });

  it('shows an alert on error', async () => {
    sessionStorage.setItem(PAT_KEY, 'ghp_test');
    const user = userEvent.setup();
    mockGenerateFunction.mockRejectedValue(new Error('Backend error'));

    render(
      <MemoryRouter>
        <FunctionCreatePage />
      </MemoryRouter>,
    );

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /Create/ }));

    await waitFor(() => {
      expect(screen.getByText('Backend error')).toBeInTheDocument();
    });
  });

  it('renders UserAvatar in header', () => {
    render(
      <MemoryRouter>
        <FunctionCreatePage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
  });

  it('shows warning and hides form when no PAT is set', () => {
    render(
      <MemoryRouter>
        <FunctionCreatePage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/A GitHub Personal Access Token is required to create functions/),
    ).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /Owner/ })).not.toBeInTheDocument();
  });
});
