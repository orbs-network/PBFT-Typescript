import { Block } from "./Block";
import { BlockUtils, calculateBlockHash } from "./blockUtils/BlockUtils";
import { Config } from "./Config";
import { NetworkMessagesFilter } from "./networkCommunication/NetworkMessagesFilter";
import { PBFTTerm, TermConfig } from "./PBFTTerm";
import { InMemoryPBFTStorage } from "./storage/InMemoryPBFTStorage";

export type onCommittedCB = (block: Block) => void;

export class PBFT {
    private readonly onCommittedListeners: onCommittedCB[];
    private readonly pbftTermConfig: TermConfig;
    private pbftTerm: PBFTTerm;
    private networkMessagesFilter: NetworkMessagesFilter;

    constructor(config: Config) {
        this.onCommittedListeners = [];

        this.pbftTermConfig = PBFT.buildTermConfig(config);
        this.networkMessagesFilter = new NetworkMessagesFilter(config.networkCommunication, config.keyManager.getMyPublicKey());
    }

    public static buildTermConfig(config: Config): TermConfig {
        return {
            electionTriggerFactory: config.electionTriggerFactory,
            networkCommunication: config.networkCommunication,
            pbftStorage: config.pbftStorage || new InMemoryPBFTStorage(config.logger),
            keyManager: config.keyManager,
            logger: config.logger,
            blockUtils: new BlockUtils(config.blocksValidator, config.blocksProvider)
        };
    }

    private notifyCommitted(block: Block): void {
        this.onCommittedListeners.map(cb => cb(block));
    }

    private disposePBFTTerm(): void {
        if (this.pbftTerm) {
            this.pbftTerm.dispose();
            this.pbftTerm = undefined;
        }
    }

    private createPBFTTerm(height: number): void {
        this.pbftTerm = new PBFTTerm(this.pbftTermConfig, height, block => {
            this.notifyCommitted(block);
            this.start(block);
        });
        this.networkMessagesFilter.setTerm(height, this.pbftTerm);
    }

    public isLeader(): boolean {
        if (this.pbftTerm !== undefined) {
            return this.pbftTerm.isLeader();
        }
    }

    public registerOnCommitted(bc: onCommittedCB): void {
        this.onCommittedListeners.push(bc);
    }

    public start(lastCommittedBlock: Block): void {
        this.pbftTermConfig.blockUtils.setLastCommittedBlockHash(calculateBlockHash(lastCommittedBlock));
        this.disposePBFTTerm();
        this.createPBFTTerm(lastCommittedBlock.header.height + 1);
    }

    public dispose(): any {
        this.onCommittedListeners.length = 0;
        this.disposePBFTTerm();
        this.networkMessagesFilter.dispose();
    }
}