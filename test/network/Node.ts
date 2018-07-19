import { Config } from "../../src";
import { Block } from "../../src/Block";
import { PBFT } from "../../src/PBFT";
import { InMemoryBlockStorage } from "../blockStorage/InMemoryBlockStorage";

export class Node {
    private pbft: PBFT;

    constructor(public pk: string, public config: Config, private blockStorage: InMemoryBlockStorage) {
        this.pbft = new PBFT(config);
        this.pbft.registerOnCommitted(block => this.onNewBlock(block));
    }

    public getLatestCommittedBlock(): Block {
        return this.blockStorage.getLastBlock();
    }

    public isLeader(): boolean {
        return this.pbft.isLeader();
    }

    public onNewBlock(block: Block): void {
        this.blockStorage.appendBlockToChain(block);
    }

    public startConsensus(): void {
        if (this.pbft) {
            const lastCommittedBlock: Block = this.getLatestCommittedBlock();
            this.pbft.start(lastCommittedBlock);
        }
    }

    public dispose(): void {
        if (this.pbft) {
            this.pbft.dispose();
        }
    }
}