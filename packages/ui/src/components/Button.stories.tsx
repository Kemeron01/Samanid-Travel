import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = { title: 'UI-Kit/Button', component: Button, args: { children: 'Забронировать' } };
export default meta;
type S = StoryObj<typeof Button>;

const variants = ['primary', 'secondary', 'outline', 'ghost', 'danger'] as const;

export const Matrix: S = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      {(['L', 'M'] as const).map((size) => (
        <div key={size} className="flex flex-wrap items-center gap-4">
          {variants.map((v) => (
            <div key={v} className="flex flex-col gap-2">
              <Button {...args} variant={v} size={size}>{v} {size}</Button>
              <Button {...args} variant={v} size={size} disabled>disabled</Button>
              <Button {...args} variant={v} size={size} loading>loading</Button>
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
};
export const Primary: S = { args: { variant: 'primary', size: 'L' } };
