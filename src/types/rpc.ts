export type PushTX = PushTXSuccess | RPCError;

export interface PushTXSuccess {
    status: string;
    success: true;
}

export type GetCoinRecordsByPuzzleHash =
    | GetCoinRecordsByPuzzleHashSuccess
    | RPCError;

export interface GetCoinRecordsByPuzzleHashSuccess {
    coin_records: CoinRecord[];
    success: true;
}

export type GetBlockRecordByHeight = GetBlockRecordByHeightSuccess | RPCError;

export interface GetBlockRecordByHeightSuccess {
    block_record: BlockRecord;
    success: true;
}

export type GetAdditionsAndRemovals = GetAdditionsAndRemovalsSuccess | RPCError;

export interface GetAdditionsAndRemovalsSuccess {
    additions: CoinRecord[];
    removals: CoinRecord[];
    success: true;
}

export interface BlockRecord {
    challenge_block_info_hash: string;
    challenge_vdf_output: ChallengeVDFOutput;
    deficit: number;
    farmer_puzzle_hash: string;
    fees: number;
    finished_challenge_slot_hashes: string[] | null;
    finished_infused_challenge_slot_hashes: string[] | null;
    finished_reward_slot_hashes: string[] | null;
    header_hash: string;
    height: number;
    infused_challenge_vdf_output: ChallengeVDFOutput;
    overflow: boolean;
    pool_puzzle_hash: string;
    prev_hash: string;
    prev_transaction_block_hash: string;
    prev_transaction_block_height: number;
    required_iters: number;
    reward_claims_incorporated: Coin[] | null;
    reward_infusion_new_challenge: string;
    signage_point_index: number;
    sub_epoch_summary_included: SubEpochSummary | null;
    sub_slot_iters: number;
    timestamp: number;
    total_iters: number;
    weight: number;
}

export interface SubEpochSummary {
    prev_subepoch_summary_hash: string;
    reward_chain_hash: string;
    num_blocks_overflow: number;
    new_difficulty: number | null;
    new_sub_slot_iters: number | null;
}

export interface ChallengeVDFOutput {
    data: string;
}

export interface CoinRecord {
    coin: Coin;
    coinbase: boolean;
    confirmed_block_index: number;
    spent: boolean;
    spent_block_index: number;
    timestamp: number;
}

export interface Coin {
    amount: number;
    parent_coin_info: string;
    puzzle_hash: string;
}

export interface RPCError {
    error: string;
    success: false;
}
