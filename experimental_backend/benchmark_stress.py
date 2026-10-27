"""Stress benchmark for experimental chord classifier: synthetic noise, drums, bass and transitions.
Run: python -m experimental_backend.benchmark_stress
This measures synthetic examples only; do not infer real-song accuracy.
"""
import json
import time
import resource
import numpy as np
from experimental_backend.app import analyze, AudioInput

SR = 11025
CHORDS = {
    "C": [60, 64, 67], "Am": [57, 60, 64], "F": [53, 57, 60],
    "G": [55, 59, 62], "Dm": [62, 65, 69], "Em": [64, 67, 71],
    "G7": [55, 59, 62, 65], "Cmaj7": [60, 64, 67, 71],
}
CONDITIONS = ("clean", "melody", "bass", "percussion", "noisy")

def synth(name, seconds, seed, condition):
    rng = np.random.default_rng(seed)
    t = np.arange(round(seconds * SR)) / SR
    x = np.zeros(len(t))
    notes = CHORDS[name]
    for note in notes:
        f = 440 * 2 ** ((note - 69) / 12)
        x += np.sin(2 * np.pi * f * t)
        if condition != "clean":
            x += .3 * np.sin(4 * np.pi * f * t)
    x *= .48 / len(notes)
    if condition == "melody":
        f = 440 * 2 ** ((notes[0] + 12 - 69) / 12)
        x += .33 * np.sin(2 * np.pi * f * t)
    if condition == "bass":
        f = 440 * 2 ** ((notes[0] - 24 - 69) / 12)
        x += .45 * np.sin(2 * np.pi * f * t)
    if condition == "percussion":
        for beat in np.arange(0, seconds, .5):
            pos = round(beat * SR)
            length = min(len(x) - pos, round(.12 * SR))
            x[pos:pos + length] += .6 * rng.standard_normal(length) * np.exp(-np.arange(length) / (SR * .018))
    if condition == "noisy":
        x += rng.normal(0, .07, len(t))
    return np.clip(x, -1, 1).astype(np.float32)

def chord_at(events, timestamp):
    label = None
    for event in events:
        if event["time_seconds"] > timestamp:
            break
        label = event["chord"]
    return label

def main():
    started = time.monotonic()
    rows = []
    names = list(CHORDS)
    for condition in CONDITIONS:
        for i in range(10):
            expected = names[i % len(names)]
            samples = synth(expected, 2, i + 100, condition)
            result = analyze(AudioInput(samples=samples.tolist()))
            predicted = chord_at(result["events"], .9)
            rows.append({"condition": condition, "expected": expected,
                         "predicted": predicted, "correct": expected == predicted})
    progression = ["C", "Am", "F", "G"]
    audio = np.concatenate([synth(name, 2, i + 200, "percussion") for i, name in enumerate(progression)])
    events = analyze(AudioInput(samples=audio.tolist()))["events"]
    sequence = []
    for t in np.arange(.75, 8, .25):
        expected = progression[min(int(t // 2), 3)]
        predicted = chord_at(events, t)
        sequence.append({"time": round(float(t), 2), "expected": expected,
                         "predicted": predicted, "correct": expected == predicted})
    report = {
        "benchmark": "synthetic-stress-v1",
        "single_chord_total": len(rows),
        "single_chord_correct": sum(row["correct"] for row in rows),
        "by_condition": {c: {"correct": sum(row["correct"] for row in rows if row["condition"] == c), "total": 10} for c in CONDITIONS},
        "sequence_total": len(sequence),
        "sequence_correct": sum(row["correct"] for row in sequence),
        "sequence_events": events,
        "elapsed_seconds": round(time.monotonic() - started, 3),
        "max_rss_kb": resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
        "rows": rows,
        "sequence_scores": sequence,
        "note": "Synthetic tests only. Runtime and memory are environment-dependent."
    }
    with open("benchmark-stress-report.json", "w") as file:
        json.dump(report, file, indent=2)
    print(json.dumps({k: v for k, v in report.items() if k not in ("rows", "sequence_scores")}, indent=2))
    if report["sequence_correct"] < .75 * report["sequence_total"]:
        print("QUALITY_GATE: FAIL (sequence accuracy below 75%)")
    else:
        print("QUALITY_GATE: PASS")

if __name__ == "__main__":
    main()
