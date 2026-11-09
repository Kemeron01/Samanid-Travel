import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { OtpInput } from './OtpInput';

function Harness({ onValue }: { onValue: (v: string) => void }) {
  const [v, setV] = useState('');
  return <OtpInput label="code" value={v} onChange={(x) => { setV(x); onValue(x); }} />;
}

describe('OtpInput', () => {
  it('keeps every digit when typing fast (no stale closure)', () => {
    let last = '';
    render(<Harness onValue={(v) => { last = v; }} />);
    const cells = screen.getAllByRole('textbox');
    // Два события подряд без промежуточного ре-рендера в старом замыкании.
    '482913'.split('').forEach((d, i) => fireEvent.change(cells[i]!, { target: { value: d } }));
    expect(last).toBe('482913');
  });
  it('fills all cells from one-time-code autofill into the first cell', () => {
    let last = '';
    render(<Harness onValue={(v) => { last = v; }} />);
    fireEvent.change(screen.getAllByRole('textbox')[0]!, { target: { value: '482913' } });
    expect(last).toBe('482913');
  });
});
