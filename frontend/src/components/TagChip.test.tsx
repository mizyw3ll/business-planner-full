import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TagChip } from '../components/TagChip';

describe('TagChip', () => {
  const mockTag = { id: 1, name: 'react', color_idx: 0 };

  it('renders tag name with # prefix', () => {
    render(<TagChip tag={mockTag} />);
    expect(screen.getByText('#react')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<TagChip tag={mockTag} onClick={onClick} />);
    fireEvent.click(screen.getByText('#react'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('shows remove button when removable=true', () => {
    const onRemove = vi.fn();
    render(<TagChip tag={mockTag} removable onRemove={onRemove} />);
    expect(screen.getByLabelText('Удалить тег')).toBeInTheDocument();
  });

  it('calls onRemove when remove button clicked (not onClick)', () => {
    const onClick = vi.fn();
    const onRemove = vi.fn();
    render(<TagChip tag={mockTag} onClick={onClick} removable onRemove={onRemove} />);
    fireEvent.click(screen.getByLabelText('Удалить тег'));
    expect(onRemove).toHaveBeenCalledOnce();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies sm size classes when size=sm', () => {
    const { container } = render(<TagChip tag={mockTag} size="sm" />);
    const span = container.querySelector('span.inline-flex');
    expect(span?.className).toContain('text-xs');
  });

  it('applies md size classes by default', () => {
    const { container } = render(<TagChip tag={mockTag} />);
    const span = container.querySelector('span.inline-flex');
    expect(span?.className).toContain('text-sm');
  });

  it('cycles through color palette based on color_idx', () => {
    const tag0 = { id: 1, name: 'a', color_idx: 0 };
    const tag5 = { id: 2, name: 'b', color_idx: 5 };
    const { container: c1 } = render(<TagChip tag={tag0} />);
    const { container: c2 } = render(<TagChip tag={tag5} />);
    const class1 = c1.querySelector('span.inline-flex')?.className || '';
    const class2 = c2.querySelector('span.inline-flex')?.className || '';
    expect(class1).not.toBe(class2);
  });
});
