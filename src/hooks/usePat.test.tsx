import { render, screen, act } from '@testing-library/react';
import { usePat } from './usePat';

beforeEach(() => {
  sessionStorage.clear();
});

function TestComponent() {
  const { pat } = usePat();
  return <span data-testid="pat">{pat}</span>;
}

function SetTestComponent() {
  const { pat, setPat } = usePat();
  return (
    <>
      <span data-testid="pat">{pat}</span>
      <button onClick={() => setPat('ghp_new')}>set</button>
    </>
  );
}

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

describe('usePat', () => {
  it('returns empty string when sessionStorage is empty', () => {
    render(<TestComponent />);

    expect(screen.getByTestId('pat').textContent).toBe('');
  });

  it('setPat writes to sessionStorage and updates state', () => {
    render(<SetTestComponent />);

    act(() => {
      screen.getByRole('button', { name: 'set' }).click();
    });

    expect(screen.getByTestId('pat').textContent).toBe('ghp_new');
    expect(sessionStorage.getItem('func-console-gh-pat')).toBe('ghp_new');
  });

  it('reads initial value from sessionStorage', () => {
    sessionStorage.setItem('func-console-gh-pat', 'ghp_stored');

    render(<TestComponent />);

    expect(screen.getByTestId('pat').textContent).toBe('ghp_stored');
  });

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
});
