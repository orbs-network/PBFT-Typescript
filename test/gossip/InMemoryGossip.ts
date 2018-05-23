import { Gossip, NewViewCallback, PrepareCallback, PreprepareCallback, ViewChangeCallback } from "../../src/gossip/Gossip";
import { InMemoryGossipDiscovery } from "./InMemoryGossipDiscovery";

type GossipCallback = PreprepareCallback | PrepareCallback | NewViewCallback | ViewChangeCallback;
type SubscriptionsValue = {
    message: string;
    cb: (senderId: string, payload: any) => void;
};

interface RemoteListener {
    onRemoteMessage(senderId: string, message: string, payload?: any): void;
}

export class InMemoryGossip implements Gossip, RemoteListener {
    private totalSubscriptions: number = 0;
    private subscriptions: Map<number, SubscriptionsValue> = new Map();

    constructor(private discovery: InMemoryGossipDiscovery) {
    }

    onRemoteMessage(senderId: string, message: string, payload?: any): void {
        this.subscriptions.forEach(subscription => {
            if (subscription.message === message) {
                subscription.cb(senderId, payload);
            }
        });
    }

    subscribe(message: string, cb: GossipCallback): number {
        this.totalSubscriptions++;
        this.subscriptions.set(this.totalSubscriptions, { message, cb });
        return this.totalSubscriptions;
    }

    unsubscribe(subscriptionToken: number): void {
        this.subscriptions.delete(subscriptionToken);
    }

    broadcast(senderId: string, message: string, payload?: any): void {
        this.discovery.getAllGossips().forEach(gossip => {
            if (gossip !== this) {
                gossip.onRemoteMessage(senderId, message, payload);
            }
        });
    }

    unicast(senderId: string, targetId: string, message: string, payload?: any): void {
        const targetGossip = this.discovery.getGossipById(targetId);
        if (targetGossip) {
            targetGossip.onRemoteMessage(senderId, message, payload);
        }
    }
}