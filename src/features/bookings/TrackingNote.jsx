// A line under the map that says where the simulated driver is. See lib/simulation.js.

import { formatJourney } from "../../lib/format";

// Shown to the minute while there is a while to go, and to the second in the last minutes
const fmt = (sec) => (sec > 300 ? formatJourney(Math.ceil(sec / 60) * 60) : formatJourney(sec));

export default function TrackingNote({ sim, who = "rider" }) {
  if (!sim) return null;
  const mine = who === "driver";
  const text =
    sim.phase === "approach"
      ? mine
        ? `Heading to the pickup, ${fmt(sim.etaSec)} to go`
        : `Your driver is on the way, about ${fmt(sim.etaSec)} away`
      : sim.phase === "arrived"
        ? mine
          ? "At the pickup. Ask the rider for the start code"
          : "Your driver has reached the pickup. Generate the start code"
        : mine
          ? `Driving to the drop-off, ${fmt(sim.etaSec)} to go`
          : `On the way to the drop-off, about ${fmt(sim.etaSec)} left`;

  return (
    <div className="tracking-note" role="status" aria-live="polite">
      <span className="tracking-note__dot" aria-hidden="true" />
      <span>{text}</span>
      <span className="chip tracking-note__chip" title="A demo driver that moves at the vehicle's average speed. A real version would use the driver's GPS.">
        Simulated
      </span>
    </div>
  );
}
