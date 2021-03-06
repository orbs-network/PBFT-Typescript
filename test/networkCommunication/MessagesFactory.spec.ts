import * as chai from "chai";
import { expect } from "chai";
import * as sinonChai from "sinon-chai";
import { KeyManager } from "../../src";
import { BlockRef, CommitMessage, MessageType, NewViewHeader, NewViewMessage, PrepareMessage, PrePrepareMessage, ViewChangeMessage, ViewChangeHeader, ViewChangeContent, SenderSignature } from "../../src/networkCommunication/Messages";
import { aBlock, theGenesisBlock } from "../builders/BlockBuilder";
import { KeyManagerMock } from "../keyManager/KeyManagerMock";
import { PreparedMessages } from "../../src/storage/PreparedMessagesExtractor";
import { aPreparedProofByMessages } from "../builders/ProofBuilder";
import { MessagesFactory } from "../../src/networkCommunication/MessagesFactory";
import { calculateBlockHash } from "../blockUtils/BlockUtilsMock";
chai.use(sinonChai);

describe("Messages Factory", () => {
    const keyManager: KeyManager = new KeyManagerMock("My PK");
    const blockHeight = Math.floor(Math.random() * 1_000_000);
    const view = Math.floor(Math.random() * 1_000_000);
    const block = aBlock(theGenesisBlock, "Messages Factory Block");
    const blockHash = calculateBlockHash(block);
    const messagesFactory: MessagesFactory = new MessagesFactory(keyManager);

    it("should be able to construct a PrePrepare message", async () => {
        const signedHeader: BlockRef = { messageType: MessageType.PREPREPARE, blockHeight, view, blockHash };
        const dataToSign: string = JSON.stringify(signedHeader);
        const sender: SenderSignature = {
            senderPublicKey: keyManager.getMyPublicKey(),
            signature: keyManager.sign(dataToSign)
        };
        const expectedMessage: PrePrepareMessage = {
            content: {
                signedHeader,
                sender,
            },
            block
        };
        const actualMessage: PrePrepareMessage = messagesFactory.createPreprepareMessage(blockHeight, view, block, blockHash);
        expect(actualMessage).to.deep.equal(expectedMessage);
    });

    it("should be able to construct a Prepare message", async () => {
        const signedHeader: BlockRef = { messageType: MessageType.PREPARE, blockHeight, view, blockHash };
        const dataToSign: string = JSON.stringify(signedHeader);
        const sender: SenderSignature = {
            senderPublicKey: keyManager.getMyPublicKey(),
            signature: keyManager.sign(dataToSign)
        };
        const expectedMessage: PrepareMessage = {
            content: {
                signedHeader,
                sender
            }
        };
        const actualMessage: PrepareMessage = messagesFactory.createPrepareMessage(blockHeight, view, blockHash);
        expect(actualMessage).to.deep.equal(expectedMessage);
    });

    it("should be able to construct a Commit message", async () => {
        const signedHeader: BlockRef = { messageType: MessageType.COMMIT, blockHeight, view, blockHash };
        const dataToSign: string = JSON.stringify(signedHeader);
        const sender: SenderSignature = {
            senderPublicKey: keyManager.getMyPublicKey(),
            signature: keyManager.sign(dataToSign)
        };
        const expectedMessage: CommitMessage = {
            content: {
                signedHeader,
                sender
            }
        };
        const actualMessage: CommitMessage = messagesFactory.createCommitMessage(blockHeight, view, blockHash);
        expect(actualMessage).to.deep.equal(expectedMessage);
    });

    it("should be able to construct a ViewChange message without prepared proof", async () => {
        const signedHeader: ViewChangeHeader = { messageType: MessageType.VIEW_CHANGE, blockHeight, view, preparedProof: undefined };
        const dataToSign: string = JSON.stringify(signedHeader);
        const sender: SenderSignature = {
            senderPublicKey: keyManager.getMyPublicKey(),
            signature: keyManager.sign(dataToSign)
        };
        const expectedMessage: ViewChangeMessage = {
            content: {
                signedHeader,
                sender,
            },
            block: undefined
        };
        const actualMessage: ViewChangeMessage = messagesFactory.createViewChangeMessage(blockHeight, view);
        expect(actualMessage).to.deep.equal(expectedMessage);
    });

    it("should be able to construct a ViewChange message with a prepared proof", async () => {
        const preprepareMessage: PrePrepareMessage = messagesFactory.createPreprepareMessage(blockHeight, view, block, blockHash);
        const prepareMessage1: PrepareMessage = messagesFactory.createPrepareMessage(blockHeight, view, blockHash);
        const prepareMessage2: PrepareMessage = messagesFactory.createPrepareMessage(blockHeight, view, blockHash);
        const preparedMessages: PreparedMessages = {
            preprepareMessage,
            prepareMessages: [prepareMessage1, prepareMessage2]
        };
        const signedHeader: ViewChangeHeader = {
            messageType: MessageType.VIEW_CHANGE,
            blockHeight,
            view,
            preparedProof: aPreparedProofByMessages(preprepareMessage, preparedMessages.prepareMessages)
        };
        const dataToSign: string = JSON.stringify(signedHeader);
        const sender: SenderSignature = {
            senderPublicKey: keyManager.getMyPublicKey(),
            signature: keyManager.sign(dataToSign)
        };
        const expectedMessage: ViewChangeMessage = {
            content: {
                signedHeader,
                sender,
            },
            block
        };
        const actualMessage: ViewChangeMessage = messagesFactory.createViewChangeMessage(blockHeight, view, preparedMessages);
        expect(actualMessage).to.deep.equal(expectedMessage);
    });

    it("should be able to construct a New View message", async () => {
        const preprepareMessage: PrePrepareMessage = messagesFactory.createPreprepareMessage(blockHeight, view, block, blockHash);
        const viewChange1: ViewChangeMessage = messagesFactory.createViewChangeMessage(blockHeight, view);
        const vote1: ViewChangeContent = { signedHeader: viewChange1.content.signedHeader, sender: viewChange1.content.sender };
        const viewChange2: ViewChangeMessage = messagesFactory.createViewChangeMessage(blockHeight, view);
        const vote2: ViewChangeContent = { signedHeader: viewChange2.content.signedHeader, sender: viewChange2.content.sender };
        const viewChangeConfirmations: ViewChangeContent[] = [vote1, vote2];

        const signedHeader: NewViewHeader = { messageType: MessageType.NEW_VIEW, blockHeight, view, viewChangeConfirmations };
        const dataToSign: string = JSON.stringify(signedHeader);
        const sender: SenderSignature = {
            senderPublicKey: keyManager.getMyPublicKey(),
            signature: keyManager.sign(dataToSign)
        };
        const expectedMessage: NewViewMessage = {
            content: {
                signedHeader,
                sender,
                preprepareContent: preprepareMessage.content
            },
            block
        };
        const actualMessage: NewViewMessage = messagesFactory.createNewViewMessage(blockHeight, view, preprepareMessage, viewChangeConfirmations);
        expect(actualMessage).to.deep.equal(expectedMessage);
    });
});