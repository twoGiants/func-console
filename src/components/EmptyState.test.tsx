import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FunctionsEmptyState } from './EmptyState';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

afterEach(() => {
  jest.restoreAllMocks();
});

describe('FunctionsEmptyState', () => {
  it('renders a heading with "noFunctionsFound"', () => {
    render(
      <MemoryRouter>
        <FunctionsEmptyState />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'noFunctionsFound' }),
    ).toBeInTheDocument();
  });

  it('renders a "createFunction" link pointing to /functions/create', () => {
    render(
      <MemoryRouter>
        <FunctionsEmptyState />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: 'createFunction' });
    expect(link).toHaveAttribute('href', '/functions/create');
  });
});
