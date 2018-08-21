import { Block } from "../Block";

/// STORAGE ///
type StorePrePrepare = {
    StorageType: "PrePrepare",
    term: number,
    view: number,
    blockHash: string,
    senderPk: string
};

type StorePrepare = {
    StorageType: "Prepare",
    term: number,
    view: number,
    blockHash: string,
    senderPk: string
};

type StoreCommit = {
    StorageType: "Commit",
    term: number,
    view: number,
    blockHash: string,
    senderPk: string
};

type StoreViewChange = {
    StorageType: "ViewChange",
    term: number,
    view: number,
    senderPk: string
};

type ClearTerm = {
    StorageType: "ClearTerm",
    term: number
};

type StorageLogData = { subject: "Storage" } & (StorePrePrepare | StorePrepare | StoreCommit | StoreViewChange | ClearTerm);

/// GOSSIP ///
type GossipSendLogData = {
    subject: "GossipSend",
    message: string,
    targetPks: string[],
    senderPk: string,
    term: number,
    view: number,
    blockHash?: string
};


// FLOW
type FlowElected = {
    FlowType: "Elected",
    term: number,
    view: number
};

type FlowCommit = {
    FlowType: "Commit",
    term: number,
    view: number,
    blockHash: string
};

type FlowLeaderChange = {
    FlowType: "LeaderChange",
    term: number,
    newView: number,
    leaderPk: string
};

type FlowLogData = { subject: "Flow" } & (FlowElected | FlowCommit | FlowLeaderChange);

// WARNING
type WarningLogData = { subject: "Warning", message: string, metaData?: object };

// WARNING
type InfoLogData = { subject: "Info", message: string, metaData?: object };

export type LogTypes = StorageLogData | GossipSendLogData | FlowLogData | WarningLogData | InfoLogData;

export interface Logger {
    log(data: LogTypes): void;
}
