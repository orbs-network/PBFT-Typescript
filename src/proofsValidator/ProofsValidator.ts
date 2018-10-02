import { KeyManager } from "../keyManager/KeyManager";
import { PreparedProof } from "../networkCommunication/Messages";

export function validatePreparedProof(
    targetTerm: number,
    targetView: number,
    preparedProof: PreparedProof,
    f: number,
    keyManager: KeyManager,
    membersPKs: string[],
    calcLeaderPk: (view: number) => string): boolean {

    if (!preparedProof) {
        return true;
    }

    const { prepareBlockRefMessages, preprepareBlockRefMessage } = preparedProof;
    if (!prepareBlockRefMessages || !preprepareBlockRefMessage) {
        return false;
    }

    const { term, view, blockHash } = preprepareBlockRefMessage.signedHeader;
    if (term !== targetTerm) {
        return false;
    }

    if (view >= targetView) {
        return false;
    }

    if (prepareBlockRefMessages.length < 2 * f) {
        return false;
    }

    const { signedHeader: expectedPrePrepareMessageContent, signer } = preprepareBlockRefMessage;
    const { signerPublicKey: leaderPk, contentSignature } = signer;
    if (keyManager.verify(expectedPrePrepareMessageContent, contentSignature, leaderPk) === false) {
        return false;
    }

    if (calcLeaderPk(view) !== leaderPk) {
        return false;
    }

    const allPreparesPkAreUnique = prepareBlockRefMessages.reduce((prev, current) => prev.set(current.signer.signerPublicKey, true), new Map()).size === prepareBlockRefMessages.length;
    if (!allPreparesPkAreUnique) {
        return false;
    }

    const allPreparesPKsAreMembers = prepareBlockRefMessages.every(p => membersPKs.indexOf(p.signer.signerPublicKey) > -1);
    if (allPreparesPKsAreMembers == false) {
        return false;
    }

    const allPrepraresAreNotLeaders = prepareBlockRefMessages.every(p => p.signer.signerPublicKey !== leaderPk);
    if (allPrepraresAreNotLeaders === false) {
        return false;
    }

    if (prepareBlockRefMessages.every(p => keyManager.verify(p.signedHeader, p.signer.contentSignature, p.signer.signerPublicKey)) === false) {
        return false;
    }

    const isPrepareMisMatch = prepareBlockRefMessages
        .map(p => p.signedHeader)
        .findIndex(p => p.view !== view || p.term !== term || !p.blockHash.equals(blockHash)) > -1;

    if (isPrepareMisMatch) {
        return false;
    }

    return true;
}