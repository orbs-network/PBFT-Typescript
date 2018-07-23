import * as chai from "chai";
import { expect } from "chai";
import * as sinonChai from "sinon-chai";
import { Logger } from "../../src/logger/Logger";
import { InMemoryPBFTStorage } from "../../src/storage/InMemoryPBFTStorage";
import { aBlock, theGenesisBlock } from "../builders/BlockBuilder";
import { SilentLogger } from "../logger/SilentLogger";
import { calculateBlockHash } from "../blockUtils/BlockUtilsMock";
import { aPrePreparePayload } from "../builders/PayloadBuilder";

chai.use(sinonChai);

describe("PBFT In Memory Storage", () => {
    const logger: Logger = new SilentLogger();

    it("storing a preprepare returns true if it stored a new value, false if it already exists", () => {
        const storage = new InMemoryPBFTStorage(logger);
        const term = Math.floor(Math.random() * 1000);
        const view = Math.floor(Math.random() * 1000);
        const block = aBlock(theGenesisBlock);
        const payload = aPrePreparePayload("pk", {}, block);
        const firstTime = storage.storePrePrepare(term, view, block, payload);
        expect(firstTime).to.be.true;
        const secondstime = storage.storePrePrepare(term, view, block, payload);
        expect(secondstime).to.be.false;
    });

    it("storing a prepare returns true if it stored a new value, false if it already exists", () => {
        const storage = new InMemoryPBFTStorage(logger);
        const term = Math.floor(Math.random() * 1000);
        const view = Math.floor(Math.random() * 1000);
        const senderId1 = Math.floor(Math.random() * 1000).toString();
        const senderId2 = Math.floor(Math.random() * 1000).toString();
        const block = aBlock(theGenesisBlock);
        const blockHash = calculateBlockHash(block);
        const firstTime = storage.storePrepare(term, view, blockHash, senderId1, undefined);
        expect(firstTime).to.be.true;
        const secondstime = storage.storePrepare(term, view, blockHash, senderId2, undefined);
        expect(secondstime).to.be.true;
        const thirdTime = storage.storePrepare(term, view, blockHash, senderId2, undefined);
        expect(thirdTime).to.be.false;
    });

    it("storing a commit returns true if it stored a new value, false if it already exists", () => {
        const storage = new InMemoryPBFTStorage(logger);
        const term = Math.floor(Math.random() * 1000);
        const view = Math.floor(Math.random() * 1000);
        const senderId1 = Math.floor(Math.random() * 1000).toString();
        const senderId2 = Math.floor(Math.random() * 1000).toString();
        const block = aBlock(theGenesisBlock);
        const blockHash = calculateBlockHash(block);
        const firstTime = storage.storeCommit(term, view, blockHash, senderId1, undefined);
        expect(firstTime).to.be.true;
        const secondstime = storage.storeCommit(term, view, blockHash, senderId2, undefined);
        expect(secondstime).to.be.true;
        const thirdTime = storage.storeCommit(term, view, blockHash, senderId2, undefined);
        expect(thirdTime).to.be.false;
    });

    it("storing a view-change returns true if it stored a new value, false if it already exists", () => {
        const storage = new InMemoryPBFTStorage(logger);
        const view = Math.floor(Math.random() * 1000);
        const term = Math.floor(Math.random() * 1000);
        const senderId1 = Math.floor(Math.random() * 1000).toString();
        const senderId2 = Math.floor(Math.random() * 1000).toString();
        const firstTime = storage.storeViewChange(term, view, senderId1);
        expect(firstTime).to.be.true;
        const secondstime = storage.storeViewChange(term, view, senderId2);
        expect(secondstime).to.be.true;
        const thirdTime = storage.storeViewChange(term, view, senderId2);
        expect(thirdTime).to.be.false;
    });

    it("stores a prepare on the storage", () => {
        const storage = new InMemoryPBFTStorage(logger);
        const term1 = Math.floor(Math.random() * 1000);
        const term2 = Math.floor(Math.random() * 1000);
        const view1 = Math.floor(Math.random() * 1000);
        const view2 = Math.floor(Math.random() * 1000);
        const sender1Id = Math.random().toString();
        const sender2Id = Math.random().toString();
        const sender3Id = Math.random().toString();
        const block1 = aBlock(theGenesisBlock);
        const block2 = aBlock(theGenesisBlock);
        const block1Hash = calculateBlockHash(block1);
        const block2Hash = calculateBlockHash(block2);
        storage.storePrepare(term1, view1, block1Hash, sender1Id, undefined);
        storage.storePrepare(term1, view1, block1Hash, sender2Id, undefined);
        storage.storePrepare(term1, view1, block2Hash, sender2Id, undefined);
        storage.storePrepare(term1, view2, block1Hash, sender3Id, undefined);
        storage.storePrepare(term2, view1, block2Hash, sender3Id, undefined);
        const actual = storage.getPrepare(term1, view1, block1Hash);
        const expected = [sender1Id, sender2Id];
        expect(actual).to.deep.equal(expected);
    });

    it("stores a commit on the storage", () => {
        const storage = new InMemoryPBFTStorage(logger);
        const term1 = Math.floor(Math.random() * 1000);
        const term2 = Math.floor(Math.random() * 1000);
        const view1 = Math.floor(Math.random() * 1000);
        const view2 = Math.floor(Math.random() * 1000);
        const sender1Id = Math.random().toString();
        const sender2Id = Math.random().toString();
        const sender3Id = Math.random().toString();
        const block1 = aBlock(theGenesisBlock);
        const block2 = aBlock(theGenesisBlock);
        const block1Hash = calculateBlockHash(block1);
        const block2Hash = calculateBlockHash(block2);
        storage.storeCommit(term1, view1, block1Hash, sender1Id, undefined);
        storage.storeCommit(term1, view1, block1Hash, sender2Id, undefined);
        storage.storeCommit(term1, view2, block1Hash, sender3Id, undefined);
        storage.storeCommit(term2, view1, block2Hash, sender3Id, undefined);
        const actual = storage.getCommit(term1, view1, block1Hash);
        const expected = [sender1Id, sender2Id];
        expect(actual).to.deep.equal(expected);
    });

    it("stores a view-change on the storage", () => {
        const storage = new InMemoryPBFTStorage(logger);
        const term1 = Math.floor(Math.random() * 1000);
        const term2 = Math.floor(Math.random() * 1000);
        const view1 = Math.floor(Math.random() * 1000);
        const view2 = Math.floor(Math.random() * 1000);
        const sender1Id = Math.random().toString();
        const sender2Id = Math.random().toString();
        const sender3Id = Math.random().toString();
        const block1 = aBlock(theGenesisBlock);
        const block2 = aBlock(theGenesisBlock);
        storage.storeViewChange(term1, view1, sender1Id);
        storage.storeViewChange(term1, view1, sender2Id);
        storage.storeViewChange(term1, view2, sender3Id);
        storage.storeViewChange(term2, view1, sender3Id);
        const actual = storage.countOfViewChange(term1, view1);
        expect(actual).to.deep.equal(2);
    });
});