import { Block } from "../Block";

export enum MessageType {
    PREPREPARE = 0,
    PREPARE = 1,
    COMMIT = 2,
    VIEW_CHANGE = 3,
    NEW_VIEW = 4,
}
export interface LeanHelixMessage {
    sender: SenderSignature;
    signedHeader: {
        messageType: MessageType;
        term: number;
        view: number;
    };
}

export interface BlockRefMessage extends LeanHelixMessage {
    signedHeader: BlockMessageContent;
    sender: SenderSignature;
}

export type PrePrepareMessage = BlockRefMessage & { block: Block };
export type PrepareMessage = BlockRefMessage;
export type CommitMessage = BlockRefMessage;

export interface ViewChangeMessage extends LeanHelixMessage {
    signedHeader: ViewChangeMessageContent;
    sender: SenderSignature;
    block?: Block;
}

export interface NewViewMessage extends LeanHelixMessage {
    signedHeader: NewViewContent;
    sender: SenderSignature;
    preprepareMessage: PrePrepareMessage;
}

export interface SenderSignature {
    senderPublicKey: string;
    contentSignature: string;
}

export interface BlockMessageContent {
    messageType: MessageType;
    term: number;
    view: number;
    blockHash: Buffer;
}

export interface ViewChangeMessageContent {
    messageType: MessageType;
    term: number;
    view: number;
    preparedProof?: PreparedProof;
}

export interface PreparedProof {
    preprepareBlockRefMessage: BlockRefMessage;
    prepareBlockRefMessages: BlockRefMessage[];
}

export interface NewViewContent {
    messageType: MessageType;
    term: number;
    view: number;
    viewChangeConfirmations: ViewChangeConfirmation[];
}

export interface ViewChangeConfirmation {
    signedHeader: ViewChangeMessageContent;
    sender: SenderSignature;
}
