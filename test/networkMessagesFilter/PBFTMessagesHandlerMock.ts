import { CommitPayload, NewViewPayload, PreparePayload, PrePreparePayload, ViewChangePayload } from "../../src/networkCommunication/Payload";
import { PBFTMessagesHandler } from "../../src/networkCommunication/PBFTMessagesHandler";

export class PBFTMessagesHandlerMock implements PBFTMessagesHandler {
    public onReceivePrePrepare(payload: PrePreparePayload): any {

    }
    public onReceivePrepare(payload: PreparePayload): any {

    }
    public onReceiveViewChange(payload: ViewChangePayload): any {

    }
    public onReceiveCommit(payload: CommitPayload): any {

    }
    public onReceiveNewView(payload: NewViewPayload): any {

    }
}