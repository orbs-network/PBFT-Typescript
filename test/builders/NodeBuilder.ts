import { ElectionTrigger } from "../../src/electionTrigger/ElectionTrigger";
import { TimerBasedElectionTrigger } from "../../src/electionTrigger/TimerBasedElectionTrigger";
import { Logger } from "../../src/logger/Logger";
import { Network } from "../../src/network/Network";
import { Node } from "../../src/network/Node";
import { InMemoryPBFTStorage } from "../../src/storage/InMemoryPBFTStorage";
import { PBFTStorage } from "../../src/storage/PBFTStorage";
import { ConsoleLogger } from "../logger/ConsoleLogger";
import { SilentLogger } from "../logger/SilentLogger";
import { ByzantineNode } from "../network/ByzantineNode";
import { LoyalNode } from "../network/LoyalNode";

export class NodeBuilder {
    private isByzantine: boolean = false;
    private network: Network;
    private name: string;
    private pbftStorage: PBFTStorage;
    private logger: Logger;
    private electionTrigger: ElectionTrigger;

    public and = this;

    constructor() {
    }

    public thatIsPartOf(network: Network): this {
        this.network = network;
        return this;
    }

    public named(name: string): this {
        this.name = name;
        return this;
    }

    public storingOn(pbftStorage: PBFTStorage): this {
        this.pbftStorage = pbftStorage;
        return this;
    }

    public thatLogsTo(logger: Logger): this {
        this.logger = logger;
        return this;
    }

    public electingLeaderUsing(electionTrigger: ElectionTrigger): this {
        this.electionTrigger = electionTrigger;
        return this;
    }

    public get thatLogsToConsole(): this {
        return this.thatLogsTo(new ConsoleLogger());
    }

    public get thatIsByzantine(): this {
        this.isByzantine = true;
        return this;
    }

    public build(): Node {
        const logger: Logger = this.logger ? this.logger : new SilentLogger();
        const electionTrigger: ElectionTrigger = this.electionTrigger ? this.electionTrigger : new TimerBasedElectionTrigger(300);
        const pbftStorage: PBFTStorage = this.pbftStorage ? this.pbftStorage : new InMemoryPBFTStorage(logger);
        if (this.isByzantine) {
            return new ByzantineNode(this.network, pbftStorage, logger, electionTrigger, this.name || "Byzantine-Node");
        } else {
            return new LoyalNode(this.network, pbftStorage, logger, electionTrigger, this.name || "Loyal-Node");
        }
    }
}

export const aNode = () => new NodeBuilder();
export const aLoyalNode = aNode;
export const aByzantineNode = () => aNode().thatIsByzantine;