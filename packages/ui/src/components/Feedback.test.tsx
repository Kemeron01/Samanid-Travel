import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Checkbox } from './Controls';
import { HoldTimer, formatMmSs, holdState } from './Feedback';
import { Counter } from './Counter';

describe('hold timer', () => {
  it('state thresholds', () => {
    expect(holdState(900)).toBe('normal');
    expect(holdState(179)).toBe('warning');
    expect(holdState(0)).toBe('expired');
  });
  it('formats mm:ss', () => { expect(formatMmSs(167)).toBe('02:47'); expect(formatMmSs(-5)).toBe('00:00'); });
  it('renders polite timer', () => {
    render(<HoldTimer remainingSeconds={150} labels={{ normal: 'n', warning: 'w', expired: 'e' }} />);
    expect(screen.getByRole('timer')).toHaveAttribute('aria-live', 'polite');
  });
});

describe('counter', () => {
  it('disables at min and max', () => {
    render(<Counter label="g" decrementLabel="dec" incrementLabel="inc" value={1} min={1} max={1} onChange={() => {}} />);
    expect(screen.getByLabelText('dec')).toBeDisabled();
    expect(screen.getByLabelText('inc')).toBeDisabled();
  });
});

describe('checkbox', () => {
  it('has text label', () => {
    render(<Checkbox label="Ребёнок" />);
    expect(screen.getByRole('checkbox', { name: 'Ребёнок' })).toBeInTheDocument();
  });
});
