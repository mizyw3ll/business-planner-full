import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MarkdownPreview } from '../components/MarkdownPreview';

describe('MarkdownPreview', () => {
  it('renders plain text', () => {
    render(<MarkdownPreview content="Hello world" />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders bold text', () => {
    render(<MarkdownPreview content="**bold text**" />);
    expect(screen.getByText('bold text')).toBeInTheDocument();
  });

  it('renders italic text', () => {
    render(<MarkdownPreview content="*italic text*" />);
    expect(screen.getByText('italic text')).toBeInTheDocument();
  });

  it('renders headings', () => {
    render(<MarkdownPreview content="# Heading 1" />);
    expect(screen.getByText('Heading 1')).toBeInTheDocument();
  });

  it('renders links', () => {
    render(<MarkdownPreview content="[link](https://example.com)" />);
    const link = screen.getByText('link');
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('renders unordered lists', () => {
    render(<MarkdownPreview content={'- item 1\n- item 2'} />);
    expect(screen.getByText(/item 1/)).toBeInTheDocument();
    expect(screen.getByText(/item 2/)).toBeInTheDocument();
  });

  it('converts ==highlight== to <mark>', () => {
    render(<MarkdownPreview content="==highlighted==" />);
    const mark = screen.getByText('highlighted');
    expect(mark.tagName).toBe('MARK');
  });

  it('renders empty content gracefully', () => {
    const { container } = render(<MarkdownPreview content="" />);
    expect(container.textContent).toBe('');
  });
});
