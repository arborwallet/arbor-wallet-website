import { spawn } from 'child_process';

export function exec(
    command: string,
    args: string[],
    encoding: BufferEncoding = 'utf8'
): Promise<string> {
    return new Promise((resolve, reject) => {
        let result: string = '';
        const child = spawn(command, args);
        child.stdout.on(
            'data',
            (data: Buffer) => (result = data.toString(encoding))
        );
        child.stderr.on(
            'data',
            (data: Buffer) => (result = data.toString(encoding))
        );
        child.on('close', (code) =>
            code === 0
                ? resolve(result)
                : reject(new Error(`Process terminated with exit code ${code}`))
        );
        child.on('error', (error: Error) => reject(error));
    });
}
