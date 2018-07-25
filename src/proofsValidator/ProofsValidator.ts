import { BlockUtils } from "../blockUtils/BlockUtils";
import { KeyManager } from "../keyManager/KeyManager";
import { PreparedProof } from "../storage/PBFTStorage";

export function validatePrepared(
    preparedProof: PreparedProof,
    f: number,
    keyManager: KeyManager,
    blockUtils: BlockUtils,
    calcLeaderPk: (view: number) => string): boolean {

    const { preparePayloads, prepreparePayload } = preparedProof;
    if (!preparePayloads && !prepreparePayload) {
        return true;
    }

    if (!preparePayloads || !prepreparePayload) {
        return false;
    }

    if (preparePayloads.length < 2 * f) {
        return false;
    }

    const { block, pk: leaderPk } = prepreparePayload;
    if (!block) {
        return false;
    }

    if (keyManager.verify(prepreparePayload.data, prepreparePayload.signature, prepreparePayload.pk) === false) {
        return false;
    }

    const { view, term, blockHash } = prepreparePayload.data;
    if (calcLeaderPk(view) !== leaderPk) {
        return false;
    }

    const allPreparesPkAreUnique = preparePayloads.reduce((prev, current) => prev.set(current.pk, true), new Map()).size === preparePayloads.length;
    if (!allPreparesPkAreUnique) {
        return false;
    }

    if (preparePayloads.every(p => keyManager.verify(p.data, p.signature, p.pk)) === false) {
        return false;
    }

    const isPrepareMisMatch = preparePayloads
        .map(p => p.data)
        .findIndex(p => p.view !== view || p.term !== term || p.blockHash !== blockHash) > -1;

    if (isPrepareMisMatch) {
        return false;
    }

    const isValidDigest = blockUtils.calculateBlockHash(block).equals(blockHash);
    if (!isValidDigest) {
        return false;
    }

    return true;
}