import * as chai from "chai";
import { expect } from "chai";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";
import { Network } from "../../src/network/Network";
import { aNetwork } from "../builders/NetworkBuilder";
import { aLoyalNode } from "../builders/NodeBuilder";

chai.use(sinonChai);

describe("Network", () => {
    it("should be able to register nodes", () => {
        const network = new Network();
        const node1 = aLoyalNode().thatIsPartOf(network).build();
        const node2 = aLoyalNode().thatIsPartOf(network).build();
        network.registerNode(node1);
        network.registerNode(node2);
        expect(network.nodes[0]).to.equal(node1);
        expect(network.nodes[1]).to.equal(node2);
        network.shutDown();
    });

    it("should be able to register several nodes in the same call", () => {
        const network = new Network();
        const node1 = aLoyalNode().thatIsPartOf(network).build();
        const node2 = aLoyalNode().thatIsPartOf(network).build();
        network.registerNodes([node1, node2]);
        expect(network.nodes[0]).to.equal(node1);
        expect(network.nodes[1]).to.equal(node2);
        network.shutDown();
    });

    it("should return the node index by its id", () => {
        const network = aNetwork().leadBy.a.loyalLeader.with(2).loyalNodes.build();
        const node2 = network.nodes[1];
        const result = network.getNodeIndexById(node2.id);
        expect(result).to.equal(1);
        network.shutDown();
    });

    it("should return the total number of nodes when calling getNodesCount", () => {
        const network = aNetwork().leadBy.a.loyalLeader.with(2).loyalNodes.build();
        expect(network.getNodesCount()).to.equal(3);
        network.shutDown();
    });

    it("should return a node by index", () => {
        const network = aNetwork().leadBy.a.loyalLeader.with(2).loyalNodes.build();
        const node2 = network.nodes[1];
        const result = network.getNodeByIdx(1);

        expect(result).to.equal(node2);
        network.shutDown();
    });

    it("should return a node by a given seed (Cycling the nodes using modulo)", () => {
        const network = aNetwork().leadBy.a.loyalLeader.with(2).loyalNodes.build();
        expect(network.getNodeIdBySeed(0)).to.equal(network.nodes[0].id);
        expect(network.getNodeIdBySeed(1)).to.equal(network.nodes[1].id);
        expect(network.getNodeIdBySeed(2)).to.equal(network.nodes[2].id);
        expect(network.getNodeIdBySeed(3)).to.equal(network.nodes[0].id);
        network.shutDown();
    });

    it("should call init on all the nodes when calling initAllNodes", () => {
        const network = new Network();
        const node1 = aLoyalNode().thatIsPartOf(network).build();
        const node2 = aLoyalNode().thatIsPartOf(network).build();
        const node3 = aLoyalNode().thatIsPartOf(network).build();
        const spy1 = sinon.spy(node1, "init");
        const spy2 = sinon.spy(node2, "init");
        const spy3 = sinon.spy(node3, "init");

        network.registerNode(node1);
        network.registerNode(node2);
        network.registerNode(node3);
        network.initAllNodes();

        const result = network.getNodeIndexById("node2");
        expect(spy1).to.have.been.calledOnce;
        expect(spy2).to.have.been.calledOnce;
        expect(spy3).to.have.been.calledOnce;
        network.shutDown();
    });

});