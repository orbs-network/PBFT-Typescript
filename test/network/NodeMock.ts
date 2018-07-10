import { Block } from "../../src/Block";
import { BlockStorage } from "../../src/blockStorage/BlockStorage";
import { PBFT } from "../../src/PBFT";
import { Node } from "./Node";
import { InMemoryBlockStorage } from "../blockStorage/InMemoryBlockStorage";

export class NodeMock implements Node {
    public id: string;

    constructor(public pbft: PBFT, private blockStorage: InMemoryBlockStorage) {
        this.id = pbft.id;
        this.pbft.registerOnCommitted(block => this.onNewBlock(block));
    }

    public async getLatestBlock(): Promise<Block> {
        const block: Block = await this.blockStorage.getLastBlockHash();
        return block;
    }

    public isLeader(): boolean {
        return this.pbft.isLeader();
    }

    public onNewBlock(block: Block): Promise<void> {
        this.blockStorage.appendBlockToChain(block);
        return Promise.resolve();
    }

    public startConsensus(): void {
        if (this.pbft) {
            this.pbft.start();
        }
    }

    public dispose(): void {
        if (this.pbft) {
            this.pbft.dispose();
        }
    }
}