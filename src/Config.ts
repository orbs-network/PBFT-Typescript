import { Block } from "./Block";
import { Gossip } from "./gossip/Gossip";
import { Logger } from "./logger/Logger";
import { Network } from "./network/Network";
import { PBFTStorage } from "./storage/PBFTStorage";

export interface Config {
    genesisBlockHash: string;
    publicKey: string;
    network: Network;
    gossip: Gossip;
    pbftStorage: PBFTStorage;
    logger: Logger;
    onNewBlock: (block: Block) => void;
    validateBlock?: (block: Block) => Promise<boolean>;
}