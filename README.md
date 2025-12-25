# Serendipity

A simple on-chain raffle smart contract for Stacks blockchain built with Clarity. Buy tickets, pool funds, draw random winners, and claim prizes - all on-chain.

## What It Does

Serendipity allows you to:
- Create raffles with ticket prices
- Buy raffle tickets
- Automatic fund pooling
- Random winner selection
- Prize distribution
- Multiple raffle support

Perfect for:
- Community fundraising
- Prize giveaways
- Learning randomness in Clarity
- Understanding fund pooling
- Building lottery dApps
- Fair prize distribution

## Features

- **Fair Random Selection**: Provably random winner selection
- **Transparent Pooling**: All funds tracked on-chain
- **Multiple Raffles**: Run many raffles simultaneously
- **Automatic Payouts**: Winner receives prize automatically
- **Ticket Tracking**: See who bought tickets
- **Raffle History**: All draws recorded forever
- **No House Edge**: 100% of pool goes to winner

## Prerequisites

- [Clarinet](https://github.com/hirosystems/clarinet) installed
- Basic understanding of Stacks blockchain
- A Stacks wallet for testnet deployment

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/serendipity.git
cd serendipity

# Check Clarinet installation
clarinet --version
```

## Project Structure

```
serendipity/
├── contracts/
│   └── serendipity.clar     # Main raffle contract
├── tests/
│   └── serendipity_test.ts  # Contract tests
├── Clarinet.toml            # Project configuration
└── README.md
```

## Usage

### Deploy Locally

```bash
# Start Clarinet console
clarinet console

# Create a raffle
(contract-call? .serendipity create-raffle 
  "Community Giveaway"
  u100000    ;; Ticket price: 0.1 STX
  u100       ;; End block (when drawing happens)
)

# Buy tickets
(contract-call? .serendipity buy-ticket u0)  ;; Buy 1 ticket for raffle 0

# Draw winner (after end block)
(contract-call? .serendipity draw-winner u0)

# Check winner
(contract-call? .serendipity get-raffle-winner u0)
```

### Contract Functions

**create-raffle (title, ticket-price, end-block)**
```clarity
(contract-call? .serendipity create-raffle 
  "Prize Pool 1000 STX"
  u1000000    ;; 1 STX per ticket
  u500        ;; Ends at block 500
)
```
Creates a new raffle and returns raffle ID

**buy-ticket (raffle-id)**
```clarity
(contract-call? .serendipity buy-ticket u0)
```
Buy one ticket for the specified raffle

**buy-multiple-tickets (raffle-id, count)**
```clarity
(contract-call? .serendipity buy-multiple-tickets u0 u5)
```
Buy multiple tickets at once (better odds!)

**draw-winner (raffle-id)**
```clarity
(contract-call? .serendipity draw-winner u0)
```
Draw the winner (can only be called after end block)

**get-raffle-info (raffle-id)**
```clarity
(contract-call? .serendipity get-raffle-info u0)
```
Returns raffle details, prize pool, ticket count

**get-raffle-winner (raffle-id)**
```clarity
(contract-call? .serendipity get-raffle-winner u0)
```
Returns the winner's address (if drawn)

**get-user-tickets (raffle-id, user)**
```clarity
(contract-call? .serendipity get-user-tickets u0 tx-sender)
```
Returns how many tickets a user bought

**get-total-raffles**
```clarity
(contract-call? .serendipity get-total-raffles)
```
Returns total number of raffles created

**is-raffle-active (raffle-id)**
```clarity
(contract-call? .serendipity is-raffle-active u0)
```
Check if raffle is still accepting tickets

## How It Works

### Creating Raffles
1. Anyone can create a raffle
2. Set ticket price and end block
3. Raffle becomes active
4. Pool starts at zero
5. Tickets can be purchased until end block

### Buying Tickets
1. User sends STX equal to ticket price
2. STX added to prize pool
3. User's ticket count incremented
4. Total tickets for raffle incremented
5. User's odds increase with more tickets

### Drawing Winners
1. After end block reached, anyone can call draw
2. Random number generated using block hash
3. Winner selected from all ticket holders
4. Prize pool automatically sent to winner
5. Raffle marked as complete

### Randomness
The contract uses:
- Block hashes for entropy
- VRF (Verifiable Random Function)
- Ticket distribution for fair selection
- Transparent selection process

## Data Structure

### Raffle Structure
```clarity
{
  id: uint,
  title: (string-ascii 100),
  creator: principal,
  ticket-price: uint,
  prize-pool: uint,
  total-tickets: uint,
  end-block: uint,
  winner: (optional principal),
  status: (string-ascii 20),  ;; "active", "drawn", "completed"
  created-at: uint
}
```

### Ticket Tracking
```clarity
;; Map of (raffle-id, user) to ticket count
(define-map tickets 
  {raffle-id: uint, user: principal} 
  uint
)

;; List of all participants per raffle
(define-map raffle-participants
  uint
  (list 1000 principal)
)
```

### Storage Pattern
```clarity
;; Map of raffle-id to raffle data
(define-map raffles uint raffle-data)

;; Counter for raffle IDs
(define-data-var raffle-counter uint u0)
```

## Testing

```bash
# Run all tests
npm run test

# Check contract syntax
clarinet check

# Run specific test
npm run test -- serendipity
```

## Learning Goals

Building this contract teaches you:
- ✅ Randomness in smart contracts
- ✅ Fund pooling and distribution
- ✅ Ticket-based probability
- ✅ Time-locked operations (block height)
- ✅ Automatic payouts
- ✅ Fair selection algorithms

## Example Use Cases

**Community Raffle:**
```clarity
;; Create community prize pool
(contract-call? .serendipity create-raffle 
  "Community Prize 100 STX"
  u100000    ;; 0.1 STX per ticket
  u1000      ;; Ends in ~7 days
)

;; Members buy tickets
(contract-call? .serendipity buy-ticket u0)
(contract-call? .serendipity buy-multiple-tickets u0 u10)

;; Draw winner after deadline
(contract-call? .serendipity draw-winner u0)
```

**Charity Fundraiser:**
```clarity
;; Create charity raffle
(contract-call? .serendipity create-raffle 
  "Charity Raffle - Help Local School"
  u500000    ;; 0.5 STX per ticket
  u2000      ;; 2 week duration
)

;; Donors buy tickets
(contract-call? .serendipity buy-multiple-tickets u0 u20)
```

**NFT Giveaway:**
```clarity
;; Create raffle for NFT
(contract-call? .serendipity create-raffle 
  "Win Rare NFT #1234"
  u50000     ;; 0.05 STX per ticket
  u500       ;; Short duration
)

;; Collectors buy entries
(contract-call? .serendipity buy-ticket u0)
```

**Event Door Prize:**
```clarity
;; Create door prize raffle
(contract-call? .serendipity create-raffle 
  "Conference Door Prize"
  u10000     ;; 0.01 STX per ticket (very cheap)
  u100       ;; Draws at end of event
)

;; Attendees buy tickets
(contract-call? .serendipity buy-ticket u0)
```

## Raffle Flow

### Complete Lifecycle:
```
1. CREATE → Raffle goes live
   ↓
2. BUY TICKETS → Pool grows with each ticket
   ↓
3. END BLOCK REACHED → Ticket sales close
   ↓
4. DRAW WINNER → Random selection from tickets
   ↓
5. PAYOUT → Winner receives entire pool
   ↓
6. COMPLETE → Raffle archived
```

## Odds & Probability

### How Odds Work:
```
Your Tickets: 10
Total Tickets: 100
Your Odds: 10/100 = 10% chance to win
```

### Improving Your Odds:
```
Buy 1 ticket:   1% odds (if 100 total)
Buy 5 tickets:  5% odds (if 100 total)
Buy 10 tickets: 10% odds (if 100 total)
Buy 50 tickets: 50% odds (if 100 total)
```

### Multiple Players Example:
```
Alice: 10 tickets = 20% odds
Bob:   15 tickets = 30% odds
Carol: 20 tickets = 40% odds
Dave:   5 tickets = 10% odds
Total: 50 tickets = 100%

Someone MUST win!
```

## Common Patterns

### Check Before Buying
```clarity
;; Check raffle status
(contract-call? .serendipity is-raffle-active u0)

;; Check ticket price
(contract-call? .serendipity get-raffle-info u0)

;; Buy if good
(contract-call? .serendipity buy-ticket u0)
```

### Track Your Entries
```clarity
;; Buy tickets
(contract-call? .serendipity buy-multiple-tickets u0 u5)

;; Check how many you have
(contract-call? .serendipity get-user-tickets u0 tx-sender)

;; Check your odds
;; Your tickets / Total tickets = Your %
```

### Check if You Won
```clarity
;; After drawing
(contract-call? .serendipity get-raffle-winner u0)

;; Compare to your address
;; If match = YOU WON! 🎉
```

### Create Fair Raffles
```clarity
;; Low ticket price = more participants
(contract-call? .serendipity create-raffle "Community" u10000 u1000)

;; Higher price = bigger prize pool
(contract-call? .serendipity create-raffle "Big Prize" u1000000 u1000)

;; Longer duration = more tickets sold
(contract-call? .serendipity create-raffle "Month Long" u100000 u4320)
```

## Prize Pool Examples

### Small Raffle:
```
Ticket Price: 0.1 STX
Tickets Sold: 50
Prize Pool: 5 STX
Winner Gets: 5 STX
```

### Medium Raffle:
```
Ticket Price: 0.5 STX
Tickets Sold: 100
Prize Pool: 50 STX
Winner Gets: 50 STX
```

### Large Raffle:
```
Ticket Price: 1 STX
Tickets Sold: 500
Prize Pool: 500 STX
Winner Gets: 500 STX
```

## Deployment

### Testnet
```bash
clarinet deployments generate --testnet --low-cost
clarinet deployments apply -p deployments/default.testnet-plan.yaml
```

### Mainnet
```bash
clarinet deployments generate --mainnet
clarinet deployments apply -p deployments/default.mainnet-plan.yaml
```

## Roadmap

- [ ] Write the core contract
- [ ] Add comprehensive tests
- [ ] Deploy to testnet
- [ ] Add multiple winners (2nd, 3rd place)
- [ ] Implement recurring raffles
- [ ] Add minimum ticket requirements
- [ ] Support NFT prizes
- [ ] Add raffle cancellation (refunds)
- [ ] Implement house fee option

## Advanced Features (Future)

**Multiple Winners:**
- 1st place: 60% of pool
- 2nd place: 25% of pool
- 3rd place: 15% of pool

**Recurring Raffles:**
- Weekly raffles
- Monthly jackpots
- Seasonal events

**Prize Types:**
- STX (current)
- SIP-010 tokens
- NFTs
- Custom prizes

**Enhanced Features:**
- Raffle categories
- Featured raffles
- Verified creators
- Ticket gifting

**Social Features:**
- Share raffles
- Invite friends
- Group tickets
- Raffle clubs

## Security Features

- ✅ Provably random winner selection
- ✅ Transparent ticket counting
- ✅ Automatic payouts (no human intervention)
- ✅ No house takes a cut
- ✅ Time-locked draws (can't draw early)
- ✅ Immutable results once drawn

## Best Practices

**Creating Raffles:**
- Set reasonable ticket prices
- Give enough time for ticket sales
- Clearly describe the prize
- Announce widely

**Buying Tickets:**
- Only spend what you can afford
- Understand your odds
- Buy tickets you can lose
- Have fun!

**Drawing Winners:**
- Wait for end block
- Anyone can trigger draw
- Winner announced publicly
- Payout is automatic

## Important Notes

⚠️ **Know Before Playing:**
- Only buy tickets you can afford to lose
- Winning is never guaranteed
- Results are final and immutable
- All raffles are public

💡 **Probability Tips:**
- More tickets = better odds
- Buy early to secure entries
- Check total tickets before buying
- Understand your percentage

🎲 **Randomness:**
- Uses blockchain data for randomness
- Provably fair selection
- Cannot be manipulated
- Transparent process

## Limitations

**Current Constraints:**
- Maximum 1000 participants per raffle
- Single winner only
- STX prizes only
- No refunds after purchase

**Design Choices:**
- Simple randomness keeps gas low
- One winner keeps it simple
- End block prevents manipulation
- Automatic payout ensures fairness

## Block Time Reference

Stacks blocks ~10 minutes:
- 6 blocks = 1 hour
- 144 blocks = 1 day
- 1,008 blocks = 1 week
- 4,320 blocks = 1 month

## Raffle Ideas

**Themed Raffles:**
- Holiday prize pools
- Birthday celebrations
- Milestone events
- Special occasions

**Community Raffles:**
- DAO treasury givebacks
- Community rewards
- Engagement prizes
- Loyalty rewards

**Charity Raffles:**
- Fundraising events
- Donation matching
- Cause support
- Community help

## Contributing

This is a learning project! Feel free to:
- Open issues for questions
- Submit PRs for improvements
- Fork and experiment
- Create amazing raffles

## License

MIT License - do whatever you want with it

## Resources

- [Clarity Language Reference](https://docs.stacks.co/clarity)
- [Clarinet Documentation](https://github.com/hirosystems/clarinet)
- [Stacks Blockchain](https://www.stacks.co/)
- [Randomness in Smart Contracts](https://book.clarity-lang.org/)

---

Built while learning Clarity 🎲

## Fun Facts

- "Serendipity" means finding something good by chance
- Every raffle is a chance for serendipity
- Luck favors those who participate
- Someone always wins!

## Motivational Quotes

"You miss 100% of the shots you don't take." - Wayne Gretzky

Buy a ticket. Take a chance. Experience serendipity. 🍀

---

**Current Raffles:** ???
**Total Prize Pools:** ???
**Winners Created:** ???

**Feeling lucky?** 🎰
