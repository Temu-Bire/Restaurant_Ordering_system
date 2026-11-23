import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

function ProblemChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test Explosion');
  }
  return <div>Smooth Sailing</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Smooth Sailing')).toBeTruthy();
  });

  it('catches render errors and displays fallback UI', () => {
    // Suppress React error boundary console output in test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Try Again')).toBeTruthy();
    expect(screen.getByText('Reload Page')).toBeTruthy();

    spy.mockRestore();
  });

  it('resets error state when Try Again is clicked', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    let throwError = true;
    function DynamicChild() {
      if (throwError) throw new Error('Boom');
      return <div>Recovered Content</div>;
    }

    const { rerender } = render(
      <ErrorBoundary>
        <DynamicChild />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();

    throwError = false;
    fireEvent.click(screen.getByText('Try Again'));

    rerender(
      <ErrorBoundary>
        <DynamicChild />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Recovered Content')).toBeTruthy();

    spy.mockRestore();
  });
});
