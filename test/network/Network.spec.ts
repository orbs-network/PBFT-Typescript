import * as chai from "chai";
import { expect } from "chai";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";
import { Network } from "../../src/network/Network";
import { aNetwork } from "../builders/NetworkBuilder";
import { LoyalNode } from "./LoyalNode";

chai.use(sinonChai);

describe("Network", () => {
    it("should be able to register nodes", () => {
        const network = new Network();
        const node1 = new LoyalNode(network, "node1");
        const node2 = new LoyalNode(network, "node2");
        network.registerNode(node1);
        network.registerNode(node2);
        expect(network.nodes[0]).to.equal(node1);
        expect(network.nodes[1]).to.equal(node2);
    });

    it("should be able to register several nodes in the same call", () => {
        const network = new Network();
        const node1 = new LoyalNode(network, "node1");
        const node2 = new LoyalNode(network, "node2");
        network.registerNodes([node1, node2]);
        expect(network.nodes[0]).to.equal(node1);
        expect(network.nodes[1]).to.equal(node2);
    });

    it("should return the node index by its publicKey", () => {
        const network = aNetwork().leadBy.a.loyalLeader.with(2).loyalNodes.build();
        const node2 = network.nodes[1];
        const result = network.getNodeIdxByPublicKey(node2.publicKey);
        expect(result).to.equal(1);
    });

    it("should return the total number of nodes when calling getNodesCount", () => {
        const network = aNetwork().leadBy.a.loyalLeader.with(2).loyalNodes.build();
        expect(network.getNodesCount()).to.equal(3);
    });

    it("should return a node by index", () => {
        const network = aNetwork().leadBy.a.loyalLeader.with(2).loyalNodes.build();
        const node2 = network.nodes[1];
        const result = network.getNodeByIdx(1);

        expect(result).to.equal(node2);
    });

    it("should call init on all the nodes when calling initAllNodes", () => {
        const network = new Network();
        const node1 = new LoyalNode(network, "node1");
        const node2 = new LoyalNode(network, "node2");
        const node3 = new LoyalNode(network, "node3");
        const spy1 = sinon.spy(node1, "init");
        const spy2 = sinon.spy(node2, "init");
        const spy3 = sinon.spy(node3, "init");

        network.registerNode(node1);
        network.registerNode(node2);
        network.registerNode(node3);
        network.initAllNodes();

        const result = network.getNodeIdxByPublicKey("node2");
        expect(spy1).to.have.been.calledOnce;
        expect(spy2).to.have.been.calledOnce;
        expect(spy3).to.have.been.calledOnce;
    });

});