import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FunctionListItem } from '../services/types';
import FunctionsListPage from './FunctionsListPage';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  DocumentTitle: ({ children }: { children: string }) => children,
  ListPageHeader: ({ title }: { title: string }) => title,
}));

const mockUseFunctionsList = jest.fn<
  { functions: FunctionListItem[]; loaded: boolean },
  []
>();

jest.mock('../hooks/useFunctionsList', () => ({
  useFunctionsList: () => mockUseFunctionsList(),
}));

afterEach(() => {
  jest.restoreAllMocks();
});

const deployed: FunctionListItem = {
  name: 'func-demo-26',
  namespace: 'demo',
  runtime: 'go',
  status: 'Running',
  url: 'http://func-demo-26.demo.svc',
  replicas: 1,
};

describe('FunctionsListPage', () => {
  it('renders empty state when no functions exist', () => {
    mockUseFunctionsList.mockReturnValue({ functions: [], loaded: true });

    render(
      <MemoryRouter>
        <FunctionsListPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'noFunctionsFound' }),
    ).toBeInTheDocument();
  });

  it('renders "createFunction" link to /functions/create', () => {
    mockUseFunctionsList.mockReturnValue({ functions: [], loaded: true });

    render(
      <MemoryRouter>
        <FunctionsListPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('link', { name: 'createFunction' }),
    ).toHaveAttribute('href', '/functions/create');
  });

  it('renders function table when functions exist', () => {
    mockUseFunctionsList.mockReturnValue({
      functions: [deployed],
      loaded: true,
    });

    render(
      <MemoryRouter>
        <FunctionsListPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getByText('func-demo-26')).toBeInTheDocument();
  });

  it('does not render empty state when functions exist', () => {
    mockUseFunctionsList.mockReturnValue({
      functions: [deployed],
      loaded: true,
    });

    render(
      <MemoryRouter>
        <FunctionsListPage />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole('heading', { name: 'noFunctionsFound' }),
    ).not.toBeInTheDocument();
  });
});
