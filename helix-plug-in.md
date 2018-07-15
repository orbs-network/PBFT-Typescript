# HelixPlugin Spec
> PBFT based algorithm with rotating leader, randomly selected for each block height based on a verifiable random function.

## Architecture - components and interfaces
> Wrap PBFT blockchain consensus with random committee. 

#### Consensus Algo
* Interfaces:
  * `SetTime(height, force)` - update state according to future height (force=true for rollback). 
  * `Commit (block, proof)` - emit commit event. 
  * `AcknowledgeBlockConsensus (block headers + proof)` - verify valid block proof (deduce members, pbft_proof). 
  * Used by 'PBFT':  
    * `CommitBlock (block, pbft_proof)` - triggered by 'PBFT', attach new seed, emit commit(block, proof) event.
    * `GetNodesList(height)` - Returns an ordered nodes list based on random seed of height-1.
* Internal methods:
  * `GetNodesList(seed)` - Returns an ordered nodes list.


## Design notes
* Continuously runs, once initiated.




Config:
* Gossip - subscribe on Gossip passed to PBFT.
* Network - Membership management.
* BlockUtils.
* Storage.
* Crypto.
* 



## Databases

#### Threshold Signature by height
> Stores the signatures on random seed of previous height, stripped from the COMMIT message.
* Accessed by (height)
* Persistent
* Stores valid signatures. 
 


#### GossipFilter
* Interfaces:
  * `GossipMessageReceived` - triggered by the gossip service upon message received with Helix topic.
  * `SetHandler (handler)` - push messages to handler (validate threshold signatures first).





&nbsp;
## `AcknowledgeBlockConsensus` (method)

> Validates the consensus for an untrusted block header. Called internally and by ConsensusService.

#### Check previous block pointer
* Verify the previous block hash pointer matches the hash of the previous block (given).

#### Get the block committee
* Calculate the random seed from the previous block (given).
* Get the desired committee size from [configuration](../config/services.md).
* Get a sorted list of committee members for the block by calling `ConsensusContext.RequestOrderingCommittee`.
* Note: If the consensus algorithm relies on a single committee for both, call `ConsensusContext.RequestValidationCommittee` only based on the Results block random seed.

#### Verify the block proof
* Verify the block proof based on the committee members.
* If all valid, update the consensus algorithm about the block commit (with block height and consensus dependent data).









atach the threshold signatures of random_seed(block.height-1), emit commit(block, pbft_proof) event.



Responsible:
* Random committee - validate and aggregate threshold signatures of random seed (height-1) 
* Provide context to PBFT consensus 



#### Interacts with services
* `ConsensusService` - Receive BlockStorage and communucation services. 
* `ConsensusContext` - Calls it during consensus when system interface regarding the block content is required.


#### GossipFilter
* Interfaces:
  * `GossipMessageReceived` - triggered by the gossip service upon message received with ConensusAlgo topic (sorted by height).
  * `SetHandler (height, handler)` - push messages, with relevant height, to handler.













Implements a raw consensus algorithm. The system supports pluggable consensus, meaning multiple consensus algorithms running side by side on different virtual chains. Abstracts away the details of how the consensus algorithm works and provides the system with a single unified interface.

Controls and drives the timing of consensus, for example when new blocks are committed or when new blocks need to be proposed and populated with transaction from the pool.

Note: `ConsensusAlgo` is not in charge of block sync (`BlockStorage` is) and it does not deal with block content (`ConsensusContext` does).

Currently a single instance per virtual chain per node (per supported algorithm).

#### Interacts with services

* `ConsensusContext` - Calls it during consensus when system interface regarding the block content is required.
* `BlockStorage` - Requests block headers from it in order to be on the consensus frontline and participate.
* `Gossip` - Uses it to communicate with other nodes.

&nbsp;
## `Data Structures`

#### Algorithm-specific data
* Needs to be persistent.

#### Synchronization state
* `last_committed_block` - The last valid committed block from the previous round (persistent).

&nbsp;
## `Init` (flow)

* Initialize the [configuration](../config/services.md).
* Load persistent data.
* Subscribe to gossip messages in the relevant consensus topic by calling `Gossip.TopicSubscribe`.
* Start the consensus algorithm.

&nbsp;
## `OnNewConsensusRound` (method)

> Called internally when the consensus algorithm decides a new term (block height) starts, probably after the last block was committed.

* Assumes the [block height](../../terminology.md) for the upcoming round is known.
* Get the previously committed block pair by calling `BlockStorage.GetTransactionsBlockHeader` and `BlockStorage.GetResultsBlockHeader`.
  * Store it in `last_committed_block` for the benefit of the next steps in this round.
  * It is recommended to cache the committed block from the previous round in order to prevent fetching this data.
  * If fails or times out, skip this round and don't participate (the node is probably out of sync).
* Calculate the random seed from the previous block.
* Get the desired committee size from [configuration](../config/services.md).
* Get a sorted list of committee members for the upcoming Transactions block (ordering phase) by calling `ConsensusContext.RequestOrderingCommittee`.
* Get a sorted list of committee members for the upcoming Results block (validation phase) by calling `ConsensusContext.RequestValidationCommittee`.
* Note: If the consensus algorithm relies on a single committee for both, call `ConsensusContext.RequestValidationCommittee` only based on the Results block random seed.

#### If leader
* Note to self that participating in this round as leader.
* Get the desired block size from [configuration](../config/services.md).
* Request new Transactions block proposal (ordering phase) by calling `ConsensusContext.RequestNewTransactionsBlock`.
* Request new Results block proposal (validation phase) by calling `ConsensusContext.RequestNewResultsBlock`.
* Sign both proposals (according to the algo spec) - on hash of the header.
* Send signed proposals to the algo of all committee nodes (according to the algo spec) by calling `Gossip.SendMessage`.

#### If non-leader committee member
* Note to self that participating in this round as non-leader committee member.

#### If not a committee member
* Note to self that participating in this round as a non-committee member.
  * Just waiting for the committed block, not actually taking part in the consensus itself.

&nbsp;
## `OnBlockProposalReceived` (method)

> Called internally when during consensus, a non-leader committee member receives a proposal for a new block by the leader.

#### Participation
* Wait until decided if participating in this round or not (`OnNewConsensusRound`) as a non-leader committee member.

#### Validate the proposal
* Perform algorithm related checks on the proposal:
  * Signature, block height, previous block pair hash pointers.
* Get the desired block size from [configuration](../config/services.md) and validate it.
* Validate the Transactions block (ordering phase) by calling `ConsensusContext.ValidateTransactionsBlock`.
* Validate the Results block (validation phase) by calling `ConsensusContext.ValidateResultsBlock`.

#### Reply approval
* Sign both approvals (according to the algo spec) - on hash of the header.
* Send signed approvals to the algo of all committee nodes (according to the algo spec) by calling `Gossip.SendMessage`.

&nbsp;
## `OnCommitBlockInsideCommittee` (method)

> Called internally for committee members (leader or not) when the consensus algorithm has decided a block proposal can be committed.

#### Participation
* Wait until decided if participating in this round or not (`OnNewConsensusRound`) as a committee member (leader or not).

#### Commit block
* Pass the committed block (including the block proofs) to block storage by calling `BlockStorage.CommitBlock`.

&nbsp;
## `OnCommitBlockOutsideCommittee` (method)

> Called internally for non-committee members when they receive a new claimed committed block in order to validate that it was committed under consensus.

#### Participation
* Wait until decided if participating in this round or not (`OnNewConsensusRound`) as not a committee member.

#### Check the Transactions block (stateless)
* Correct block protocol version.
* Correct virtual chain.
* Check block height:
  * If the block isn't the next of `last_commited_block` according to height, discard.
* Check the block's `transactions_root_hash`:
  * Calculate the merkle root hash of the block's transactions and verify the hash in the header.
* Check the block's metadata hash:
  * Calculate the hash of the block's metadata and verify the hash in the header.

#### Check the Results block (stateless)
* Correct block protocol version.
* Correct virtual chain.
* Check block height:
  * If the block isn't the next of `last_commited_block` according to height, discard.
* Check the block's `receipts_root_hash`:
  * Calculate the merkle root hash of the block's receipts and verify the hash in the header.
* Check the block's `state_diff_hash`:
  * Calculate the hash of the block's state diff and verify the hash in the header.

*Note: The logic up to here also appears in `BlockStorage` and should probably be extracted to avoid duplication.*

#### Check the block consensus
* Check consensus of the Transactions block header by calling `AcknowledgeTransactionsBlockConsensus`.
* Check consensus of the Results block header by calling `AcknowledgeResultsBlockConsensus`.

#### Commit block
* Pass the committed block (including the block proofs) to block storage by calling `BlockStorage.CommitBlock`.

&nbsp;
## `AcknowledgeTransactionsBlockConsensus` (method)

> Validates the consensus for an untrusted block header. Ignores whether the block body (content) is valid and its relevant hash values match the ones in the header. Called internally and by block storage during block sync.

#### Check previous block pointer
* Verify the previous block hash pointer matches the hash of the previous block (given).

#### Get the block committee
* Calculate the random seed from the previous block (given).
* Get the desired committee size from [configuration](../config/services.md).
* Get a sorted list of committee members for the block by calling `ConsensusContext.RequestOrderingCommittee`.
* Note: If the consensus algorithm relies on a single committee for both, call `ConsensusContext.RequestValidationCommittee` only based on the Results block random seed.

#### Verify the block proof
* Verify the block proof based on the committee members.
* If all valid, update the consensus algorithm about the block commit (with block height and consensus dependent data).

&nbsp;
## `AcknowledgeResultsBlockConsensus` (method)

> Validates the consensus for an untrusted block header. Ignores whether the block body (content) is valid and its relevant hash values match the ones in the header. Called internally and by block storage during block sync.

#### Check previous block pointer
* Verify the previous block hash pointer matches the hash of the previous block (given).

#### Get the block committee
* Calculate the random seed from the previous block (given).
* Get the desired committee size from [configuration](../config/services.md).
* Get a sorted list of committee members for the block by calling `ConsensusContext.RequestValidationCommittee`.

#### Verify the block proof
* Verify the block proof based on the committee members.
* If all valid, update the consensus algorithm about the block commit (with block height and consensus dependent data).

&nbsp;
## `GossipMessageReceived` (method)

> Handles a gossip message from another node. Relevant messages include algorithm-specific consensus messages.

* Depends on consensus algorithm.
