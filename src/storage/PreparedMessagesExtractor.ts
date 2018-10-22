import { PBFTStorage } from "./PBFTStorage";
import { PrePrepareMessage, PrepareMessage } from "../networkCommunication/Messages";

export interface PreparedMessages {
    preprepareMessage: PrePrepareMessage;
    prepareMessages: PrepareMessage[];
}

export function extractPreparedMessages(blockHeight: number, pbftStorage: PBFTStorage, q: number): PreparedMessages {
    const preprepareMessage: PrePrepareMessage = pbftStorage.getLatestPrePrepare(blockHeight);
    if (preprepareMessage) {
        const lastView = preprepareMessage.content.signedHeader.view;
        const prepareMessages: PrepareMessage[] = pbftStorage.getPrepareMessages(blockHeight, lastView, preprepareMessage.content.signedHeader.blockHash);
        if (prepareMessages.length >= q - 1) {
            return { preprepareMessage, prepareMessages };
        }
    }
}