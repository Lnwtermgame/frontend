import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('locale routing defaults', () => {
    it('configures Thai as the default with locale detection disabled', () => {
        const source = readFileSync(resolve(__dirname, 'routing.ts'), 'utf8');

        expect(source).toMatch(/defaultLocale:\s*'th'/);
        expect(source).toMatch(/localeDetection:\s*false\b/);
    });
});
