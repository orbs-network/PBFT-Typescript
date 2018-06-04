import * as chai from "chai";
import { expect } from "chai";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";
import { aNetwork } from "./builders/NetworkBuilder";
import { aNode } from "./builders/NodeBuilder";
import { ElectionTriggerMock } from "./electionTrigger/ElectionTriggerMock";
import { InMemoryGossip } from "./gossip/InMemoryGossip";

chai.use(sinonChai);

describe("Leader Election", () => {
    it("should notify the next leader when the timeout expired", () => {
        const electionTriggerMock = new ElectionTriggerMock();
        const nodeBuilder = aNode().electingLeaderUsing(electionTriggerMock);
        const network = aNetwork().with(4).nodes.withCustomeNode(nodeBuilder).build();
        const testedNode = network.nodes[4];
        const nextLeader = network.nodes[1];

        const unicastSpy = sinon.spy(testedNode.pbft.gossip, "unicast");
        electionTriggerMock.trigger();
        expect(unicastSpy).to.have.been.calledWith(testedNode.id, nextLeader.id, "view-change", { newView: 1 });
        network.shutDown();
    });

    it("should cycle to the first node when the current leader is the last node", () => {
        const electionTriggerMock = new ElectionTriggerMock();
        const nodeBuilder = aNode().electingLeaderUsing(electionTriggerMock);
        const network = aNetwork().with(1).nodes.withCustomeNode(nodeBuilder).build();
        const node1 = network.nodes[0];
        const node2 = network.nodes[1];

        const unicastSpy = sinon.spy(node2.pbft.gossip, "unicast");
        electionTriggerMock.trigger();
        expect(unicastSpy).to.have.been.calledWith(node2.id, node2.id, "view-change", { newView: 1 });
        electionTriggerMock.trigger();
        expect(unicastSpy).to.have.been.calledWith(node2.id, node1.id, "view-change", { newView: 2 });
        electionTriggerMock.trigger();
        expect(unicastSpy).to.have.been.calledWith(node2.id, node2.id, "view-change", { newView: 3 });
        network.shutDown();
    });

    it("should count 2f+1 view-change to be elected", () => {
        const network = aNetwork().with(4).nodes.build();
        const node0 = network.nodes[0];
        const node1 = network.nodes[1];
        const node2 = network.nodes[2];
        const node3 = network.nodes[3];

        const gossip = node1.pbft.gossip as InMemoryGossip;
        const multicastSpy = sinon.spy(gossip, "multicast");
        gossip.onRemoteMessage(node0.id, "view-change", { newView: 1 });
        gossip.onRemoteMessage(node2.id, "view-change", { newView: 1 });
        gossip.onRemoteMessage(node3.id, "view-change", { newView: 1 });
        expect(multicastSpy).to.have.been.calledWith(node1.id, [node0.id, node2.id, node3.id], "new-view", { view: 1 });
        network.shutDown();
    });

    it("should not fire new-view if count of view-change is less than 2f+1", () => {
        const network = aNetwork().with(4).nodes.build();
        const leader = network.nodes[0];
        const node1 = network.nodes[1];
        const node2 = network.nodes[2];
        const node3 = network.nodes[3];

        const gossip = node1.pbft.gossip as InMemoryGossip;
        const broadcastSpy = sinon.spy(gossip, "broadcast");
        gossip.onRemoteMessage("view-change", leader.id, { newView: 1 });
        gossip.onRemoteMessage("view-change", node2.id, { newView: 1 });
        expect(broadcastSpy).to.not.have.been.called;
        network.shutDown();
    });

    it("should not count view-change votes from the same node", () => {
        const network = aNetwork().with(4).nodes.build();
        const leader = network.nodes[0];
        const node1 = network.nodes[1];

        const gossip = node1.pbft.gossip as InMemoryGossip;
        const broadcastSpy = sinon.spy(gossip, "broadcast");
        gossip.onRemoteMessage("view-change", leader.id, { newView: 1 });
        gossip.onRemoteMessage("view-change", leader.id, { newView: 1 });
        gossip.onRemoteMessage("view-change", leader.id, { newView: 1 });
        expect(broadcastSpy).to.not.have.been.called;
        network.shutDown();
    });
});