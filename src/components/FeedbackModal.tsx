import { useState } from "react";
import { motion } from "framer-motion";
import { Icon } from "./arcade/Icon";

// Demo feedback form. Static site, no backend — FormSubmit.co relays the POST
// to our business email. First-ever submission triggers a one-time activation
// email to that inbox; click its link once and all later submissions deliver.
const FEEDBACK_ENDPOINT =
  "https://formsubmit.co/ajax/abstudiosofficialbusiness@gmail.com";

type Status = "idle" | "sending" | "sent" | "error";

export function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function submit() {
    if (!message.trim() || status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch(FEEDBACK_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: "Curry Clicker demo feedback",
          message: message.trim(),
          email: email.trim() || "(not provided)",
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-[58] flex items-end justify-center bg-ink/50 p-4 sm:items-center">
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 220 }}
        className="arcade-box w-full max-w-sm p-6"
      >
        {status === "sent" ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <Icon name="mark_email_read" fill size={40} className="text-primary" />
            <h2 className="font-display text-xl font-black uppercase text-ink">
              Thanks, chef!
            </h2>
            <p className="text-sm font-semibold text-ink/70">
              Your feedback is on its way to the kitchen.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="arcade-btn w-full bg-primary py-2.5 uppercase text-white"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Icon name="mail" fill size={26} className="text-primary" />
              <h2 className="font-display text-xl font-black uppercase text-ink">
                Contact us
              </h2>
            </div>
            <p className="mt-2 text-sm font-semibold text-ink/70">
              Loved it? Hated it? Tell us — every message reaches the devs.
            </p>

            <label className="mt-4 block text-xs font-black uppercase tracking-wide text-ink/60">
              Your feedback
            </label>
            <textarea
              value={message}
              maxLength={2000}
              rows={5}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What did you think of the demo?"
              className="mt-1 w-full resize-none rounded-md border-4 border-ink bg-cream-50 px-3 py-2 text-sm font-semibold text-ink outline-none focus:bg-white"
            />

            <label className="mt-3 block text-xs font-black uppercase tracking-wide text-ink/60">
              Your email (optional, for a reply)
            </label>
            <input
              type="email"
              value={email}
              maxLength={100}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-md border-4 border-ink bg-cream-50 px-3 py-2 text-sm font-semibold text-ink outline-none focus:bg-white"
            />

            {status === "error" && (
              <p className="mt-2 text-xs font-bold text-tier-terrible">
                Couldn't send — check your connection and try again.
              </p>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="arcade-btn flex-1 bg-white py-2.5 uppercase text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!message.trim() || status === "sending"}
                className="arcade-btn flex-[2] bg-primary py-2.5 uppercase text-white disabled:opacity-50"
              >
                <Icon name="send" size={20} />
                {status === "sending" ? "Sending…" : "Submit"}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
