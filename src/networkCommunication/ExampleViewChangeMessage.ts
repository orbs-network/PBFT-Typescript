import { Block } from "../Block";
import { SenderSignature, ViewChangeMessage, MessageType, NewViewMessage } from "./Messages";

const VC_BLOCK_HEIGHT = 0;
const VC_VIEW = 1;
const PREPARED_VIEW = 0; // < VC_VIEW;
const BLOCK: Block = undefined;
const BLOCK_HASH: Buffer = undefined;
const VC_SIGNATURE: SenderSignature = undefined;
const PP_SIGNATURE: SenderSignature = undefined;
const P_SIGNATURE1: SenderSignature = undefined;
const P_SIGNATURE2: SenderSignature = undefined;

const exampleViewChangeMessage: ViewChangeMessage = {
    signedHeader: {
        messageType: MessageType.VIEW_CHANGE,
        blockHeight: VC_BLOCK_HEIGHT,
        view: VC_VIEW,
        preparedProof: {
            preprepareBlockRefMessage: {
                signedHeader: {
                    messageType: MessageType.PREPREPARE,
                    blockHeight: VC_BLOCK_HEIGHT,
                    view: PREPARED_VIEW,
                    blockHash: BLOCK_HASH
                },
                sender: PP_SIGNATURE
            },
            prepareBlockRefMessages: [
                {
                    signedHeader: {
                        messageType: MessageType.PREPARE,
                        blockHeight: VC_BLOCK_HEIGHT,
                        view: PREPARED_VIEW,
                        blockHash: BLOCK_HASH
                    },
                    sender: P_SIGNATURE1
                },
                {
                    signedHeader: {
                        messageType: MessageType.PREPARE,
                        blockHeight: VC_BLOCK_HEIGHT,
                        view: PREPARED_VIEW,
                        blockHash: BLOCK_HASH
                    },
                    sender: P_SIGNATURE2
                },
            ]
        }
    },
    sender: VC_SIGNATURE,
    block: BLOCK
};
