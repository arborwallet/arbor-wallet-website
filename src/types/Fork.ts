export interface ForkInfo {
    name: string;
    ticker: string;
    unit: string;
    precision: number;
}

export type ForkName = 'xch';

export const forks: Record<ForkName, ForkInfo> = {
    xch: {
        name: 'Chia',
        ticker: 'xch',
        unit: 'mojo',
        precision: 12,
    },
};
