import os from 'os';
import { join } from 'path';

export function withHomeDirectory(path: string) {
    const homedir = os.homedir();
    if (!path) return path;
    if (path === '~') return homedir;
    if (path.slice(0, 2) !== '~/') return path;
    return join(homedir, path.slice(2));
}
