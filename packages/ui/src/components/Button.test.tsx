import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('disables and marks busy when loading', () => {
    render(<Button loading>Pay</Button>);
    const b = screen.getByRole('button', { name: 'Pay' });
    expect(b).toBeDisabled();
    expect(b).toHaveAttribute('aria-busy', 'true');
  });
});
