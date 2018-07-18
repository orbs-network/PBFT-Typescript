import * as chai from "chai";
import { expect } from "chai";
import * as sinonChai from "sinon-chai";
import { PBFTStorage } from "../src/storage/PBFTStorage";
import { BlocksProviderMock } from "./blocksProvider/BlocksProviderMock";
import { BlocksValidatorMock } from "./blocksValidator/BlocksValidatorMock";
import { aBlock, theGenesisBlock } from "./builders/BlockBuilder";
import { aTestNetwork } from "./builders/TestNetworkBuilder";
import { aNode } from "./builders/NodeBuilder";
import { SilentLogger } from "./logger/SilentLogger";
import { nextTick } from "./timeUtils";
import { aPayload } from "./builders/PayloadBuilder";
import { InMemoryPBFTStorage } from "../src/storage/InMemoryPBFTStorage";
import { BlockUtils } from "../src/blockUtils/BlockUtils";

chai.use(sinonChai);

describe("Spam Prevention", () => {
    it("should store the PREPARE on the same term only one time", async () => {
        const logger = new SilentLogger();
        const inspectedStorage: PBFTStorage = new InMemoryPBFTStorage(logger);
        const nodeBuilder = aNode().storingOn(inspectedStorage);
        const block = aBlock(theGenesisBlock);
        const blocksValidator = new BlocksValidatorMock();
        const blocksProvider = new BlocksProviderMock([block]);
        const testNetwork = aTestNetwork()
            .with(4).nodes
            .withCustomNode(nodeBuilder)
            .gettingBlocksVia(blocksProvider)
            .validateUsing(blocksValidator)
            .build();

        const leader = testNetwork.nodes[0];
        const node = testNetwork.nodes[4];

        testNetwork.startConsensusOnAllNodes();
        await nextTick(); // await for blockStorage.getBlockChainHeight();
        await blocksProvider.provideNextBlock();
        const gossip = testNetwork.getNodeGossip(leader.pk);
        gossip.unicast(node.pk, "preprepare", aPayload(leader.pk, { block, view: 0, term: 1 }));
        gossip.unicast(node.pk, "preprepare", aPayload(leader.pk, { block, view: 0, term: 1 }));
        await nextTick();
        await blocksValidator.resolveAllValidations(true);

        const blockHash = BlockUtils.calculateBlockHash(block);
        expect(inspectedStorage.getPrepare(1, 0, blockHash).length).to.equal(4);
        testNetwork.shutDown();
    });
});