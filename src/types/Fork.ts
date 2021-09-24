export interface ForkInfo {
    name: string;
    unit: string;
    logo: string;
    ticker: string;
    precision: number;
}

export type ForkName = 'xch' | 'xfl' | 'xdg';

export const forks: Record<ForkName, ForkInfo> = {
    xch: {
        name: 'Chia',
        unit: 'Mojo',
        logo: '/icons/forks/chia.png',
        ticker: 'xch',
        precision: 12,
    },
    xfl: {
        name: 'Flora',
        unit: 'Mojo',
        logo: '/icons/forks/flora.png',
        ticker: 'xfl',
        precision: 12,
    },
    xdg: {
        name: 'Dogechia',
        unit: 'Mojo',
        logo: '/icons/forks/dogechia.png',
        ticker: 'xdg',
        precision: 12,
    },
};
