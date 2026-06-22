import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GlassCard } from './GlassCard';

describe('GlassCard', () => {
  it('renders children', () => {
    render(<GlassCard><span>Content</span></GlassCard>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<GlassCard onClick={onClick}><span>Click me</span></GlassCard>);
    fireEvent.click(screen.getByText('Click me'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders as anchor when as="a"', () => {
    render(<GlassCard as="a" href="/test"><span>Link</span></GlassCard>);
    const anchor = screen.getByText('Link').closest('a');
    expect(anchor).toHaveAttribute('href', '/test');
  });

  it('renders as button when as="button"', () => {
    const onClick = vi.fn();
    render(<GlassCard as="button" onClick={onClick}><span>Btn</span></GlassCard>);
    const btn = screen.getByText('Btn').closest('button');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn!);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('applies custom className', () => {
    const { container } = render(<GlassCard className="my-custom"><span>X</span></GlassCard>);
    const card = container.firstElementChild;
    expect(card?.className).toContain('my-custom');
  });

  it('applies accent color bar', () => {
    const { container } = render(<GlassCard accent="emerald"><span>X</span></GlassCard>);
    const bar = container.querySelector('.absolute.top-0');
    expect(bar).toBeInTheDocument();
  });

  it('applies compact padding when padding=compact', () => {
    const { container } = render(<GlassCard padding="compact"><span>X</span></GlassCard>);
    const card = container.firstElementChild;
    expect(card?.className).toContain('p-4');
  });

  it('applies no padding when padding=none', () => {
    const { container } = render(<GlassCard padding="none"><span>X</span></GlassCard>);
    const card = container.firstElementChild;
    expect(card?.className).toContain('p-0');
  });
});
