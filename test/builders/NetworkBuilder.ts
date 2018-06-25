import { Block } from "../../src/Block";
import { BlocksProvider } from "../../src/blocksProvider/BlocksProvider";
import { BlocksValidator } from "../../src/blocksValidator/BlocksValidator";
import { ElectionTriggerFactory } from "../../src/electionTrigger/ElectionTrigger";
import { Logger, LoggerConstructor } from "../../src/logger/Logger";
import { BlocksProviderMock } from "../blocksProvider/BlocksProviderMock";
import { BlocksValidatorMock } from "../blocksValidator/BlocksValidatorMock";
import { ElectionTriggerMock } from "../electionTrigger/ElectionTriggerMock";
import { InMemoryGossip } from "../gossip/InMemoryGossip";
import { InMemoryGossipDiscovery } from "../gossip/InMemoryGossipDiscovery";
import { ConsoleLogger } from "../logger/ConsoleLogger";
import { SilentLogger } from "../logger/SilentLogger";
import { InMemoryNetwork } from "../network/InMemoryNetwork";
import { Node } from "../network/Node";
import { aNode, NodeBuilder } from "./NodeBuilder";

export class With {
    constructor(private networkBuilder: NetworkBuilder, private count: number) {

    }
    get nodes() {
        this.networkBuilder.countOfNodes = this.count;
        return this.networkBuilder;
    }
}

class NetworkBuilder {
    private network: InMemoryNetwork;
    private loggerCtor: LoggerConstructor = SilentLogger;
    private customNodes: NodeBuilder[] = [];
    private electionTriggerFactory: ElectionTriggerFactory;
    private blocksValidator: BlocksValidator;
    private blocksPool: Block[] = [];

    public countOfNodes: number = 0;
    public and = this;
    public a = this;

    public get thatLogsToConsole(): this {
        this.thatLogsToCustomeLogger(ConsoleLogger);
        return this;
    }

    public thatLogsToCustomeLogger(ctor: LoggerConstructor): this {
        this.loggerCtor = ctor;
        return this;
    }

    public electingLeaderUsing(electionTriggerFactory: ElectionTriggerFactory): this {
        this.electionTriggerFactory = electionTriggerFactory;
        return this;
    }

    public validateUsing(blocksValidator: BlocksValidator): this {
        this.blocksValidator = blocksValidator;
        return this;
    }

    public with(count?: number) {
        return new With(this, count);
    }

    public blocksInPool(blocks: Block[]): this {
        this.blocksPool = blocks;
        return this;
    }

    public withCustomNode(nodeBuilder: NodeBuilder): this {
        this.customNodes.push(nodeBuilder);
        return this;
    }

    public build(): InMemoryNetwork {
        this.network = new InMemoryNetwork();
        this.createNodes();
        return this.network;
    }

    private buildNode(builder: NodeBuilder, id: string, discovery: InMemoryGossipDiscovery): Node {
        const logger: Logger = new this.loggerCtor(id);
        const gossip = new InMemoryGossip(discovery, logger);
        const electionTriggerFactory: ElectionTriggerFactory = this.electionTriggerFactory ? this.electionTriggerFactory : view => new ElectionTriggerMock(view);
        const blocksValidator: BlocksValidator = this.blocksValidator ? this.blocksValidator : new BlocksValidatorMock();
        const blocksProvider: BlocksProvider = new BlocksProviderMock(this.blocksPool);
        discovery.registerGossip(id, gossip);
        return builder
            .thatIsPartOf(this.network)
            .communicatesVia(gossip)
            .gettingBlocksVia(blocksProvider)
            .electingLeaderUsing(electionTriggerFactory)
            .validateUsing(blocksValidator)
            .named(id)
            .thatLogsTo(logger)
            .build();
    }

    private createNodes(): void {
        const discovery = new InMemoryGossipDiscovery();

        const nodes: Node[] = [];

        for (let i = 0; i < this.countOfNodes; i++) {
            const node = this.buildNode(aNode(), `Node${i}`, discovery);
            nodes.push(node);
        }

        const customNodes = this.customNodes.map((nodeBuilder, idx) => this.buildNode(nodeBuilder, `Custom-Node${idx}`, discovery));
        nodes.push(...customNodes);
        this.network.registerNodes(nodes);
    }
}

export const aNetwork = () => new NetworkBuilder();