import { exec } from 'child_process';

export function executeCommand(
    command: string,
    encoding: BufferEncoding = 'utf8'
): Promise<string> {
    return new Promise((resolve, reject) => {
        const results: string[] = [];
        const errors: string[] = [];
        const child = exec(command);
        if (!child.stdout || !child.stderr) {
            throw new Error('Could not start the command process.');
        }
        child.stdout.on('data', (data: Buffer) =>
            results.push(data.toString(encoding))
        );
        child.stderr.on('data', (data: Buffer) =>
            errors.push(data.toString(encoding))
        );
        child.on('close', (code) =>
            code === 0
                ? resolve(results.join(''))
                : reject(
                      new Error(
                          `Process terminated with exit code ${code}: ${errors.join(
                              ''
                          )}`
                      )
                  )
        );
        child.on('error', (error: Error) => reject(error));
    });
}
