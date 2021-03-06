import * as chai from "chai";
import { expect } from "chai";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";
import { Block } from "../src/Block";
import { aBlock, theGenesisBlock } from "./builders/BlockBuilder";
import { aTestNetwork } from "./builders/TestNetworkBuilder";
import { Node } from "./network/Node";
import { TestNetwork } from "./network/TestNetwork";
import { nextTick } from "./timeUtils";

chai.use(sinonChai);

describe("Block Validation", () => {
    let block: Block;
    let testNetwork: TestNetwork;

    beforeEach(() => {
        block = aBlock(theGenesisBlock);
        testNetwork = aTestNetwork(4, [block]);
    });

    afterEach(() => {
        testNetwork.shutDown();
    });

    it("should call validateBlock on onPrepare", async () => {
        const node1: Node = testNetwork.nodes[1];
        const spy = sinon.spy(node1.blockUtils, "validateBlock");
        testNetwork.startConsensusOnAllNodes();
        await nextTick();
        await testNetwork.provideNextBlock();
        await nextTick();
        await testNetwork.resolveAllValidations(true);
        await nextTick();

        expect(spy).to.have.been.calledWithMatch(block);
        expect(testNetwork.nodes).to.agreeOnBlock(block);
    });

    it("should reach consensus if validateBlock returned true", async () => {
        testNetwork.startConsensusOnAllNodes();
        await nextTick();
        await testNetwork.provideNextBlock();
        await testNetwork.resolveAllValidations(true);
        await nextTick();

        expect(testNetwork.nodes).to.agreeOnBlock(block);
    });

    it("should not reach consensus if validateBlock returned false", async () => {
        testNetwork.startConsensusOnAllNodes();
        await nextTick();
        await testNetwork.provideNextBlock();
        await testNetwork.resolveAllValidations(false);
        await nextTick();

        expect(testNetwork.nodes).to.not.agreeOnBlock(block);
    });
});