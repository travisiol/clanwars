"use client";

import { useEffect, useState } from "react";
import { useConnect, useConnection, useDisconnect, useSwitchChain } from "wagmi";
import { clsx } from "clsx";
import { robinhoodChain } from "@/lib/chain";
import { shortAddress } from "@/lib/format";

/**
 * Whether a wallet is actually reachable in this browser.
 *
 * wagmi registers the injected connector whether or not anything is there to
 * inject, so its presence says nothing — trusting it leaves the button enabled
 * on a machine with no wallet, where pressing it does nothing at all. This
 * looks for a real provider: `window.ethereum` for older wallets, and the
 * EIP-6963 announcement current ones use.
 *
 * Starts optimistic so the server render and the first client render agree,
 * then corrects itself once the browser has had a moment to answer.
 */
function useWalletAvailable(): boolean {
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    let found = typeof window !== "undefined" && "ethereum" in window;

    const onAnnounce = () => {
      found = true;
      setAvailable(true);
    };
    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    const timer = window.setTimeout(() => setAvailable(found), 400);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
    };
  }, []);

  return available;
}

export function WalletConnect({
  className,
  wrapperClassName,
  variant = "outline",
  showHint = true,
}: {
  className?: string;
  wrapperClassName?: string;
  /**
   * `solid` is gold and belongs to the one place connecting is the point of
   * the screen. Everywhere else the wallet is a utility and wears an outline —
   * two gold buttons in one view and neither of them means anything.
   */
  variant?: "solid" | "outline";
  /**
   * The explanation under the button. On by default, because a disabled button
   * with no reason is the thing this component exists to avoid — but in a 56px
   * rail there is no room for two lines of it, and the same explanation is
   * repeated beside the hero button a screen below.
   */
  showHint?: boolean;
}) {
  const { address, isConnected, chainId } = useConnection();
  const { connect, connectors, isPending: isConnecting, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { mutate: switchChain, isPending: isSwitching } = useSwitchChain();
  const walletAvailable = useWalletAvailable();

  const shell = "type-label px-4 py-3 transition-colors duration-150";
  const solid =
    "bg-gold text-void hover:bg-gold-bright disabled:cursor-not-allowed disabled:bg-transparent disabled:text-chalk-muted disabled:ring-1 disabled:ring-rule-strong disabled:ring-inset";
  const outline =
    "text-chalk ring-1 ring-rule-strong ring-inset hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:text-chalk-muted";

  if (isConnected && address) {
    if (chainId !== robinhoodChain.id) {
      return (
        <button
          type="button"
          onClick={() => switchChain({ chainId: robinhoodChain.id })}
          disabled={isSwitching}
          className={clsx(shell, solid, className)}
        >
          {isSwitching ? "Switching…" : "Switch network"}
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => disconnect()}
        title="Disconnect wallet"
        className={clsx(
          shell,
          "flex items-center gap-2 text-chalk ring-1 ring-rule-strong ring-inset hover:text-gold",
          className,
        )}
      >
        <span className="h-1.5 w-1.5 bg-gain" aria-hidden />
        {shortAddress(address)}
      </button>
    );
  }

  const connector = connectors[0];
  const canConnect = walletAvailable && !!connector;

  return (
    <span className={clsx("inline-flex flex-col items-start gap-1", wrapperClassName)}>
      <button
        type="button"
        disabled={!canConnect || isConnecting}
        onClick={() => connector && connect({ connector })}
        title={canConnect ? undefined : "No browser wallet detected on this device"}
        className={clsx(shell, variant === "solid" ? solid : outline, className)}
      >
        {isConnecting ? "Connecting…" : canConnect ? "Connect wallet" : "No wallet found"}
      </button>

      {showHint && connectError && (
        <span className="type-data max-w-[240px] text-chalk-soft">
          {connectError.message.split("\n")[0]}
        </span>
      )}
      {showHint && !canConnect && !connectError && (
        <span className="type-data max-w-[240px] text-chalk-muted">
          Install a browser wallet to connect.
        </span>
      )}
    </span>
  );
}
