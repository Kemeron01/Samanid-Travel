import type { Preview } from '@storybook/react';
import '@fontsource-variable/manrope';
import '../src/styles.css';

const preview: Preview = {
  parameters: {
    layout: 'padded',
    viewport: { viewports: { mobile: { name: 'Mobile 390', styles: { width: '390px', height: '844px' } } } },
  },
};
export default preview;
