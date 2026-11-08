import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Calendar } from './Calendar';

const base = { locale: 'en-US', prevLabel: 'prev', nextLabel: 'next' };

describe('Calendar', () => {
  it('disables past dates and picks a range', () => {
    const onChange = vi.fn();
    render(<Calendar {...base} mode="range" value={['2027-05-12']} minDate="2027-05-05" onChange={onChange} />);
    expect(screen.getByRole('button', { name: /May 4, 2027/ })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /May 18, 2027/ }));
    expect(onChange).toHaveBeenCalledWith(['2027-05-12', '2027-05-18']);
  });
  it('starts the week on Monday', () => {
    render(<Calendar {...base} mode="single" value={['2027-05-12']} minDate="2027-05-01" onChange={() => {}} />);
    expect(screen.getAllByRole('columnheader')[0]).toHaveTextContent('Mon');
  });
  it('blocks navigating before min month', () => {
    render(<Calendar {...base} mode="single" value={[]} minDate="2027-05-05" onChange={() => {}} />);
    expect(screen.getByLabelText('prev')).toBeDisabled();
  });
});
