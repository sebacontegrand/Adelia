/**
 * Minifies a script string by removing newlines and extra spaces.
 * Useful for GAM (Google Ad Manager) uploads.
 */
export function minifyScript(script: string): string {
    return script
        .replace(/\r?\n|\r/g, " ") // Replace newlines with spaces
        .replace(/\s+/g, " ")      // Collapse multiple spaces into one
        .trim();
}
