import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const config: NextConfig = { transpilePackages: ['@samanid/ui', '@samanid/i18n', '@samanid/tokens'] };
export default withNextIntl(config);
