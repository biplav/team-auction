import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge } from '../badge';

describe('Badge Component', () => {
  it('should render with default variant', () => {
    render(<Badge>Default Badge</Badge>);
    const badge = screen.getByText('Default Badge');
    expect(badge).toBeInTheDocument();
    expect(badge.tagName).toBe('SPAN');
  });

  it('should render with secondary variant', () => {
    render(<Badge variant="secondary">Secondary Badge</Badge>);
    const badge = screen.getByText('Secondary Badge');
    expect(badge).toBeInTheDocument();
  });

  it('should render with destructive variant', () => {
    render(<Badge variant="destructive">Destructive Badge</Badge>);
    const badge = screen.getByText('Destructive Badge');
    expect(badge).toBeInTheDocument();
  });

  it('should render with outline variant', () => {
    render(<Badge variant="outline">Outline Badge</Badge>);
    const badge = screen.getByText('Outline Badge');
    expect(badge).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    render(<Badge className="custom-class">Custom Badge</Badge>);
    const badge = screen.getByText('Custom Badge');
    expect(badge).toHaveClass('custom-class');
  });

  it('should have data-slot attribute', () => {
    render(<Badge>Test Badge</Badge>);
    const badge = screen.getByText('Test Badge');
    expect(badge).toHaveAttribute('data-slot', 'badge');
  });

  it('should render children correctly', () => {
    render(
      <Badge>
        <span>Icon</span>
        Text
      </Badge>
    );
    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText(/Text/)).toBeInTheDocument();
  });

  it('should pass through other props', () => {
    render(<Badge title="Badge Title">Test</Badge>);
    const badge = screen.getByText('Test');
    expect(badge).toHaveAttribute('title', 'Badge Title');
  });
});
