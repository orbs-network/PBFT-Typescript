import { Logger } from "../../src/logger/Logger";
import { PBFTStorage } from "../../src/storage/PBFTStorage";

export class InMemoryPBFTStorage implements PBFTStorage {
    private prePrepareStorage: Map<string, string>;
    private prepareStorage: Map<string, string[]>;
    private commitStorage: Map<string, string[]>;
    private viewChangeStorage: Map<string, string[]>;

    constructor(private logger: Logger) {
        this.prePrepareStorage = new Map();
        this.prepareStorage = new Map();
        this.commitStorage = new Map();
        this.viewChangeStorage = new Map();
    }

    storePrePrepare(term: number, view: number, blockHash: string, blockContent: string): boolean {
        const key = term.toString() + "_" + view.toString();
        if (this.prePrepareStorage.get(key) !== undefined) {
            return false;
        }
        this.prePrepareStorage.set(key, blockHash);
        this.logger.log({ Subject: "Storage", StorageType: "PrePrepare", term, view, blockHash, blockContent });
        return true;
    }

    getPrePrepare(term: number, view: number): string {
        const key = term.toString() + "_" + view.toString();
        return this.prePrepareStorage.get(key);
    }

    storePrepare(term: number, view: number, blockHash: string, senderId: string): boolean {
        const key = term.toString() + "_" + view.toString() + "_" + blockHash;
        const prepares = this.prepareStorage.get(key);
        if (prepares) {
            if (prepares.indexOf(senderId) === -1) {
                prepares.push(senderId);
            } else {
                return false;
            }
        } else {
            this.prepareStorage.set(key, [senderId]);
        }
        this.logger.log({ Subject: "Storage", StorageType: "Prepare", term, view, blockHash, senderId });
        return true;
    }

    getPrepare(term: number, view: number, blockHash: string): string[] {
        const key = term.toString() + "_" + view.toString() + "_" + blockHash;
        return this.prepareStorage.get(key) || [];
    }

    storeCommit(term: number, view: number, blockHash: string, senderId: string): boolean {
        const key = term.toString() + "_" + view.toString() + "_" + blockHash;
        const commits = this.commitStorage.get(key);
        if (commits) {
            if (commits.indexOf(senderId) === -1) {
                commits.push(senderId);
            } else {
                return false;
            }
        } else {
            this.commitStorage.set(key, [senderId]);
        }
        this.logger.log({ Subject: "Storage", StorageType: "Commit", term, view, blockHash, senderId });
        return true;
    }

    getCommit(term: number, view: number, blockHash: string): string[] {
        const key = term.toString() + "_" + view.toString() + "_" + blockHash;
        return this.commitStorage.get(key) || [];
    }

    storeViewChange(term: number, view: number, senderId: string): boolean {
        const key = term.toString() + "_" + view.toString();
        const senders = this.viewChangeStorage.get(key);
        if (senders) {
            if (senders.indexOf(senderId) === -1) {
                senders.push(senderId);
            } else {
                return false;
            }
        } else {
            this.viewChangeStorage.set(key, [senderId]);
        }
        this.logger.log({ Subject: "Storage", StorageType: "ViewChange", term, view, senderId });
        return true;
    }

    countOfViewChange(term: number, view: number): number {
        const key = term.toString() + "_" + view.toString();
        const viewChanges = this.viewChangeStorage.get(key) || [];
        return viewChanges.length;
    }
}