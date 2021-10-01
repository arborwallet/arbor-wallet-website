export interface NetworkInfo {
    name: string;
    unit: string;
    logo: string;
    ticker: string;
    precision: number;
    network_fee: number;
}

export type NetworkName = 'xch' | 'xfl' | 'xdg';

export const networks: Record<NetworkName, NetworkInfo> = {
    xch: {
        name: 'Chia',
        unit: 'Mojo',
        logo: '/icons/forks/chia.png',
        ticker: 'xch',
        precision: 12,
        network_fee: 0,
    },
    xfl: {
        name: 'Flora',
        unit: 'Mojo',
        logo: '/icons/forks/flora.png',
        ticker: 'xfl',
        precision: 12,
        network_fee: 0,
    },
    xdg: {
        name: 'Dogechia',
        unit: 'Mojo',
        logo: '/icons/forks/dogechia.png',
        ticker: 'xdg',
        precision: 12,
        network_fee: 0,
    },
};
