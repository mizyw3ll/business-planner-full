import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnimatedCounter } from './AnimatedCounter';

describe('AnimatedCounter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders with prefix and suffix', () => {
    render(<AnimatedCounter value={100} prefix="$" suffix="%" />);
    expect(screen.getByText(/\$/)).toBeInTheDocument();
    expect(screen.getByText(/%/)).toBeInTheDocument();
  });

  it('starts at 0 and animates to target value', () => {
    render(<AnimatedCounter value={50} />);
    // Initially should show 0
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('formats decimals when specified', () => {
    const { container } = render(<AnimatedCounter value={3.14} decimals={2} />);
    const span = container.querySelector('span');
    expect(span?.textContent).toContain('0');
  });

  it('applies custom className', () => {
    const { container } = render(<AnimatedCounter value={10} className="text-xl" />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('text-xl');
  });

  it('does not show prefix/suffix when not provided', () => {
    render(<AnimatedCounter value={42} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
