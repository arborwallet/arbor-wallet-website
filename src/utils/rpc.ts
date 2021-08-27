import { FullNode as BaseFullNode } from 'chia-client';
import { ChiaOptions } from 'chia-client/dist/src/RpcClient';
import { CertPath } from 'chia-client/dist/src/types/CertPath';
import { CoinResponse } from 'chia-client/dist/src/types/FullNode/RpcResponse';
import { SpendBundle } from 'chia-client/dist/src/types/Wallet/SpendBundle';

export class FullNode extends BaseFullNode {
    constructor(options?: Partial<ChiaOptions> & CertPath) {
        super(options);
    }
    public getCoins(
        puzzleHash: string,
        startHeight?: number,
        endHeight?: number
    ): Promise<CoinResponse> {
        return this.request<CoinResponse>('get_coin_records_by_puzzle_hash', {
            puzzle_hash: puzzleHash,
            start_height: startHeight,
            end_height: endHeight,
            include_spent_coins: true,
        });
    }
    public pushTransaction(
        spendBundle: SpendBundle
    ): Promise<PushTransactionResponse> {
        return this.request<PushTransactionResponse>('push_tx', {
            spend_bundle: spendBundle,
        } as any);
    }
}

export type PushTransactionResponse =
    | {
          success: true;
          status: 'SUCCESS';
      }
    | {
          success: false;
          error: string;
      };
