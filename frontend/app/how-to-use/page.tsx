export default function HowToUsePage() {
  const steps = [
    {
      title: "1. Choose method & recipient",
      content: (
        <p className="text-sm text-muted-foreground">
          Choose <span className="font-semibold text-foreground">Text → Video</span> (no images) or{" "}
          <span className="font-semibold text-foreground">Image → Video</span> (upload 1+ images),
          then enter the recipient&apos;s email/phone and optional name.
        </p>
      )
    },
    {
      title: "2. Pick gift & occasion",
      content: (
        <p className="text-sm text-muted-foreground">
          Select the voucher brand/value and occasion (Birthday, Thank you, etc.) to set the tone.
        </p>
      )
    },
    {
      title: "3. Write your message",
      content: (
        <p className="text-sm text-muted-foreground">
          Add a short, personal message for the recipient—it will be used as part of the video content.
        </p>
      )
    },
    {
      title: "4. Set the mood",
      content: (
        <p className="text-sm text-muted-foreground">
          Choose a mood (Warm cinematic, Playful upbeat, Elegant minimal, etc.) and optional intent/extra prompt to steer the video direction.
        </p>
      )
    },
    {
      title: "5. Preflight check",
      content: (
        <p className="text-sm text-muted-foreground">
          Review all details: recipient (masked), gift, mood, message, and timeline.
        </p>
      )
    },
    {
      title: "6. Review the prompt",
      content: (
        <p className="text-sm text-muted-foreground">
          See the final structured prompt that will generate the video—you can edit it or regenerate if needed.
        </p>
      )
    },
    {
      title: "7. Generate & send",
      content: (
        <p className="text-sm text-muted-foreground">
          Kick off video generation and get a shareable gift link. Copy the link and send it to your recipient!
        </p>
      )
    },
    {
      title: "8. Receiver experience",
      content: (
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>They open the link and confirm they&apos;re the intended recipient.</li>
          <li>They tap &quot;Open gift&quot; to start the 15s video.</li>
          <li>After the video finishes, they see the redeem QR/code screen.</li>
        </ul>
      )
    }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-24">
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-giftverse-gradient">How to use GiftVerse</h1>
        <p className="text-muted-foreground">
          A quick walkthrough of sending a gift with a personalized 15-second video.
        </p>
      </header>

      <div className="space-y-4">
        {steps.map((step, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/50 bg-card/40 p-6 backdrop-blur"
          >
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-giftverse-gradient">{step.title}</h3>
              {step.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
