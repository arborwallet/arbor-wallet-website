export type Result<T extends Success> = ErrorResponse | T;

export interface ErrorResponse {
    success: false;
    error: string;
}

export interface Success {
    success: true;
}
