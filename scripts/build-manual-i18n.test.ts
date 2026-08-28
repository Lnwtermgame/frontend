import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(__dirname, 'build-manual-i18n.js'), 'utf8');

describe('manual i18n generator safety contract', () => {
    it('targets the sibling messages directory', () => {
        expect(source).toMatch(
            /const MESSAGES_DIR = path\.join\(__dirname, ['"]\.\.\/messages['"]\);/
        );
    });

    it('does not blanket-delete locale JSON files', () => {
        expect(source).not.toContain('unlinkSync');
    });

    it('loads, merges, and preserves existing locale data', () => {
        expect(source).toMatch(/function loadLocale\(/);
        expect(source).toMatch(/JSON\.parse\(fs\.readFileSync/);
        expect(source).toMatch(/function deepMerge\(/);
        expect(source).toMatch(/existingLocales/);
        expect(source).toMatch(/if \(existingLocales\[locale\]\)/);
        expect(source).toMatch(/writeLocale\(locale, mergedEn\)/);
    });

    it('contains no removed chat integration literals or network calls', () => {
        expect(source).not.toMatch(/tawk|live_chat/i);
        expect(source).not.toMatch(/https?:\/\//i);
        expect(source).not.toMatch(/fetch\s*\(|axios|https\.request/);
    });
});
