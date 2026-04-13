import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('renders modal with token input when isOpen is true', () => {
    render(<PatModal isOpen={true} onSave={jest.fn()} />);

    expect(screen.getByText('GitHub Personal Access Token')).toBeInTheDocument();
    expect(screen.getByText('Personal Access Token')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save/ })).toBeInTheDocument();
  });

  it('disables Save button when input is empty', () => {
    render(<PatModal isOpen={true} onSave={jest.fn()} />);

    expect(screen.getByRole('button', { name: /Save/ })).toBeDisabled();
  });

  it('calls onSave when PAT is valid', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    mockGetAuthenticated.mockResolvedValue({ data: { login: 'testuser' } });

    render(<PatModal isOpen={true} onSave={onSave} />);

    const input = document.getElementById('pat-input') as HTMLInputElement;
    await user.type(input, 'ghp_valid');
    await user.click(screen.getByRole('button', { name: /Save/ }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('ghp_valid');
    });
  });

  it('shows error when PAT is invalid', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    mockGetAuthenticated.mockRejectedValue(new Error('Bad credentials'));

    render(<PatModal isOpen={true} onSave={onSave} />);

    const input = document.getElementById('pat-input') as HTMLInputElement;
    await user.type(input, 'ghp_invalid');
    await user.click(screen.getByRole('button', { name: /Save/ }));

    await waitFor(() => {
      expect(screen.getByText('Bad credentials')).toBeInTheDocument();
    });
    expect(onSave).not.toHaveBeenCalled();
  });
});
