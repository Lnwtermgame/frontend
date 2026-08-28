import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const files = [
    resolve(__dirname, 'app/[locale]/layout.tsx'),
    resolve(__dirname, 'components/cookie/CookieNotice.tsx'),
    resolve(__dirname, 'components/tawk-to.tsx'),
];

describe('removed external integrations', () => {
    it('contains no Tawk source references', () => {
        const source = files
            .map((file) => {
                try {
                    return readFileSync(file, 'utf8');
                } catch {
                    return '';
                }
            })
            .join('\n');

        expect(source).not.toMatch(/tawk|Tawk_API|NEXT_PUBLIC_TAWK_TO/i);
    });
});
