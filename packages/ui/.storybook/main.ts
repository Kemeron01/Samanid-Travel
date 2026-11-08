import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-a11y'],
  framework: '@storybook/react-vite',
  viteFinal: (cfg) => ({ ...cfg, plugins: [...(cfg.plugins ?? []), tailwindcss()] }),
};
export default config;
