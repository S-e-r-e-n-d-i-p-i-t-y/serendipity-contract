import { Cl, ClarityType } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("Counter Functions Tests", () => {
  it("allows incrementing the counter", () => {
    const incrementResponse = simnet.callPublicFn(
      "serendipity",
      "increment",
      [],
      deployer
    );

    expect(incrementResponse.result).toBeOk(Cl.uint(1));
  });

  it("emits event when incrementing counter", () => {
    const currentBlock = simnet.blockHeight;
    const incrementResponse = simnet.callPublicFn(
      "serendipity",
      "increment",
      [],
      deployer
    );

    expect(incrementResponse.result).toBeOk(Cl.uint(1));

    // Check for print event
    const printEvents = incrementResponse.events.filter(
      (e) => e.event === "print_event"
    );
    expect(printEvents).toHaveLength(1);
    expect(printEvents[0].data.value).toStrictEqual(
      Cl.tuple({
        event: Cl.stringAscii("counter-incremented"),
        caller: Cl.principal(deployer),
        "new-value": Cl.uint(1),
        "block-height": Cl.uint(currentBlock),
      })
    );
  });

  it("allows multiple increments", () => {
    simnet.callPublicFn("serendipity", "increment", [], deployer);
    simnet.callPublicFn("serendipity", "increment", [], deployer);
    const incrementResponse = simnet.callPublicFn(
      "serendipity",
      "increment",
      [],
      deployer
    );

    expect(incrementResponse.result).toBeOk(Cl.uint(3));
  });

  it("allows decrementing the counter", () => {
    simnet.callPublicFn("serendipity", "increment", [], deployer);
    simnet.callPublicFn("serendipity", "increment", [], deployer);

    const decrementResponse = simnet.callPublicFn(
      "serendipity",
      "decrement",
      [],
      deployer
    );

    expect(decrementResponse.result).toBeOk(Cl.uint(1));
  });

  it("prevents underflow when decrementing at zero", () => {
    const decrementResponse = simnet.callPublicFn(
      "serendipity",
      "decrement",
      [],
      deployer
    );

    // Should return ERR_UNDERFLOW (err u101)
    expect(decrementResponse.result).toBeErr(Cl.uint(101));
  });

  it("returns the current counter value", () => {
    simnet.callPublicFn("serendipity", "increment", [], deployer);
    simnet.callPublicFn("serendipity", "increment", [], deployer);

    const counterValue = simnet.callReadOnlyFn(
      "serendipity",
      "get-counter",
      [],
      deployer
    );

    expect(counterValue.result).toBeOk(Cl.uint(2));
  });
});

describe("Raffle Creation Tests", () => {
  it("allows anyone to create a raffle", () => {
    const title = "Community Raffle";
    const ticketPrice = 100000;
    const currentBlock = simnet.blockHeight;
    const endBlock = currentBlock + 100;

    const response = simnet.callPublicFn(
      "serendipity",
      "create-raffle",
      [Cl.stringAscii(title), Cl.uint(ticketPrice), Cl.uint(endBlock)],
      wallet1
    );

    expect(response.result).toBeOk(Cl.uint(0)); // First raffle should have ID 0

    // Check for event
    const printEvents = response.events.filter((e) => e.event === "print_event");
    expect(printEvents).toHaveLength(1);
    expect(printEvents[0].data.value).toMatchObject(
      Cl.tuple({
        event: Cl.stringAscii("raffle-created"),
        "raffle-id": Cl.uint(0),
        title: Cl.stringAscii(title),
        creator: Cl.principal(wallet1),
        "ticket-price": Cl.uint(ticketPrice),
        "end-block": Cl.uint(endBlock),
        "current-block": Cl.uint(currentBlock),
      })
    );
  });

  it("rejects raffle with end block in the past or now", () => {
    const title = "Past Raffle";
    const ticketPrice = 100000;
    const currentBlock = simnet.blockHeight;

    const response = simnet.callPublicFn(
      "serendipity",
      "create-raffle",
      [Cl.stringAscii(title), Cl.uint(ticketPrice), Cl.uint(currentBlock)],
      wallet1
    );

    expect(response.result).toBeErr(Cl.uint(102)); // ERR_INVALID_BLOCK
  });
});

describe("Ticket Purchasing Tests", () => {
  const title = "Raffle Test";
  const ticketPrice = 1000000; // 1 STX

  it("allows buying a single ticket", () => {
    const endBlock = simnet.blockHeight + 10;
    simnet.callPublicFn(
      "serendipity",
      "create-raffle",
      [Cl.stringAscii(title), Cl.uint(ticketPrice), Cl.uint(endBlock)],
      deployer
    );

    const buyResponse = simnet.callPublicFn(
      "serendipity",
      "buy-ticket",
      [Cl.uint(0)],
      wallet1
    );

    expect(buyResponse.result).toBeOk(Cl.uint(1));

    // Check STX transfer to contract
    const stxEvents = buyResponse.events.filter((e) => e.event === "stx_transfer_event");
    expect(stxEvents).toHaveLength(1);
    expect(stxEvents[0].data).toMatchObject({
      amount: ticketPrice.toString(),
      sender: wallet1,
      recipient: `${deployer}.serendipity`,
    });
  });

  it("allows buying multiple tickets", () => {
    const endBlock = simnet.blockHeight + 10;
    simnet.callPublicFn(
      "serendipity",
      "create-raffle",
      [Cl.stringAscii(title), Cl.uint(ticketPrice), Cl.uint(endBlock)],
      deployer
    );

    const count = 5;
    const totalCost = ticketPrice * count;

    const buyResponse = simnet.callPublicFn(
      "serendipity",
      "buy-multiple-tickets",
      [Cl.uint(0), Cl.uint(count)],
      wallet2
    );

    expect(buyResponse.result).toBeOk(Cl.uint(5));

    // Check STX transfer
    const stxEvents = buyResponse.events.filter((e) => e.event === "stx_transfer_event");
    expect(stxEvents).toHaveLength(1);
    expect(stxEvents[0].data.amount).toBe(totalCost.toString());
  });

  it("rejects ticket purchase after end block", () => {
    const endBlock = simnet.blockHeight + 10;
    simnet.callPublicFn(
      "serendipity",
      "create-raffle",
      [Cl.stringAscii(title), Cl.uint(ticketPrice), Cl.uint(endBlock)],
      deployer
    );

    simnet.mineEmptyBlocks(10); // Reach end block

    const buyResponse = simnet.callPublicFn(
      "serendipity",
      "buy-ticket",
      [Cl.uint(0)],
      wallet1
    );

    expect(buyResponse.result).toBeErr(Cl.uint(104)); // ERR_RAFFLE_ENDED
  });
});

describe("Winner Selection Tests", () => {
  const title = "Winner Raffle";
  const ticketPrice = 1000000;

  it("allows drawing a winner after end block", () => {
    const startBlock = simnet.blockHeight;
    const endBlock = startBlock + 5;
    
    simnet.callPublicFn(
      "serendipity",
      "create-raffle",
      [Cl.stringAscii(title), Cl.uint(ticketPrice), Cl.uint(endBlock)],
      deployer
    );

    // Buy tickets from multiple users
    simnet.callPublicFn("serendipity", "buy-ticket", [Cl.uint(0)], wallet1);
    simnet.callPublicFn("serendipity", "buy-ticket", [Cl.uint(0)], wallet2);

    simnet.mineEmptyBlocks(5); // Reach end block

    const drawResponse = simnet.callPublicFn(
      "serendipity",
      "draw-winner",
      [Cl.uint(0)],
      deployer
    );

    // Should return an ok response with the winner's principal
    expect(drawResponse.result.type).toBe(ClarityType.ResponseOk);
    const winnerValue = (drawResponse.result as any).value;
    expect(winnerValue.type).toBe(ClarityType.PrincipalStandard);
    
    // Check prize payout event
    const stxEvents = drawResponse.events.filter((e) => e.event === "stx_transfer_event");
    expect(stxEvents).toHaveLength(1);
    expect(stxEvents[0].data.amount).toBe((ticketPrice * 2).toString());
    expect(stxEvents[0].data.sender).toBe(`${deployer}.serendipity`);
  });

  it("prevents drawing winner before end block", () => {
    const endBlock = simnet.blockHeight + 10;
    simnet.callPublicFn(
      "serendipity",
      "create-raffle",
      [Cl.stringAscii(title), Cl.uint(ticketPrice), Cl.uint(endBlock)],
      deployer
    );

    const drawResponse = simnet.callPublicFn(
      "serendipity",
      "draw-winner",
      [Cl.uint(0)],
      deployer
    );

    expect(drawResponse.result).toBeErr(Cl.uint(106)); // ERR_NOT_ENDED
  });
});
