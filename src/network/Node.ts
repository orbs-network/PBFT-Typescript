import { Block } from "../../src/Block";
import { Gossip } from "../../src/gossip/Gossip";
import { PBFT } from "../PBFT";

export interface Node {
    publicKey: string;
    gossip: Gossip;
    isLeader(): boolean;
    init(): void;
    suggestBlock(block: Block): void;
    getLatestBlock(): Block;
}