import { BlocksProvider } from "./blocksProvider/BlocksProvider";
import { BlocksValidator } from "./blocksValidator/BlocksValidator";
import { ElectionTrigger } from "./electionTrigger/ElectionTrigger";
import { Gossip } from "./gossip/Gossip";
import { Logger } from "./logger/Logger";
import { Network } from "./network/Network";
import { PBFTStorage } from "./storage/PBFTStorage";

export interface Config {
    id: string;
    genesisBlockHash: string;
    network: Network;
    gossip: Gossip;
    pbftStorage: PBFTStorage;
    logger: Logger;
    electionTrigger: ElectionTrigger;
    blocksValidator: BlocksValidator;
    blocksProvider: BlocksProvider;
}