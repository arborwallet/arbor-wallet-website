export interface BlockchainInfo {
    name: string;
    unit: string;
    logo: string;
    ticker: string;
    precision: number;
    blockchain_fee: number;
}

export type BlockchainName = 'xch' | 'xfl' | 'xdg';

export const blockchains: Record<BlockchainName, BlockchainInfo> = {
    xch: {
        name: 'Chia',
        unit: 'Mojo',
        logo: '/icons/forks/chia.png',
        ticker: 'xch',
        precision: 12,
        blockchain_fee: 0,
    },
    xfl: {
        name: 'Flora',
        unit: 'Mojo',
        logo: '/icons/forks/flora.png',
        ticker: 'xfl',
        precision: 12,
        blockchain_fee: 0,
    },
    xdg: {
        name: 'Dogechia',
        unit: 'Mojo',
        logo: '/icons/forks/dogechia.png',
        ticker: 'xdg',
        precision: 12,
        blockchain_fee: 0,
    },
};
