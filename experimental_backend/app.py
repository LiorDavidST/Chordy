"""Experimental CPU-only chord classifier. Accepts short PCM samples, never YouTube URLs."""
import os
import time
import resource
from typing import Literal
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="Chordy experimental chord analysis", version="0.1.0")
NAMES = ("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B")
TEMPLATES = {NAMES[r]+suffix: {(r+i)%12 for i in steps}
             for r in range(12)
             for suffix,steps in (("",(0,4,7)),("m",(0,3,7)),
                                  ("7",(0,4,7,10)),("m7",(0,3,7,10)),
                                  ("maj7",(0,4,7,11)))}
MAX_SAMPLES = 220500
class AudioInput(BaseModel):
    sample_rate: Literal[11025] = 11025
    samples: list[float] = Field(min_length=4096,max_length=MAX_SAMPLES)

@app.get("/health")
def health():
    return {"status":"ok","engine":"cpu-harmonic-chroma-v2","plan":"free-compatible"}

@app.post("/analyze")
def analyze(data: AudioInput):
    started=time.monotonic()
    x=np.asarray(data.samples,dtype=np.float32)
    if not np.all(np.isfinite(x)) or np.max(np.abs(x))>1.1:
        raise HTTPException(422,"Invalid normalized PCM")
    # Harmonic salience: spectral peaks, local noise-floor subtraction and
    # down-weighting of upper harmonics. Designed for chordal accompaniment,
    # not for transcription of every melodic or percussive event.
    n=8192
    hop=2756
    window=np.hanning(n).astype(np.float32)
    freqs=np.fft.rfftfreq(n,1/data.sample_rate)
    valid=(freqs>=80)&(freqs<=1500)
    frequencies=freqs[valid]
    midi=np.rint(69+12*np.log2(frequencies/440)).astype(int)%12
    raw=[]
    for start in range(0,len(x)-n+1,hop):
        segment=x[start:start+n]*window
        if np.sqrt(np.mean(segment**2))<0.002:
            raw.append(None)
            continue
        spectrum=np.abs(np.fft.rfft(segment))[valid]
        # Remove the broad-band floor typical of cymbals, noise and transients.
        floor=np.quantile(spectrum,.65)
        spectrum=np.maximum(0,spectrum-floor)
        peak=np.zeros_like(spectrum)
        peak[1:-1]=np.where(
            (spectrum[1:-1]>=spectrum[:-2]) &
            (spectrum[1:-1]>=spectrum[2:]),spectrum[1:-1],0)
        # Emphasize fundamental/midrange notes while retaining bass evidence.
        weights=1/np.sqrt(np.maximum(frequencies,80)/220)
        chroma=np.bincount(midi,weights=peak*weights,minlength=12)
        chroma=chroma/(np.linalg.norm(chroma)+1e-9)
        if np.linalg.norm(chroma)<.01:
            raw.append(None)
            continue
        scores={}
        for name,notes in TEMPLATES.items():
            inside=sum(chroma[list(notes)])/np.sqrt(len(notes))
            outside=sum(chroma[[i for i in range(12) if i not in notes]])
            # Seventh chords need evidence for the fourth pitch; avoid
            # gratuitous maj7/m7 predictions when a simple triad suffices.
            complexity=.075 if len(notes)==4 else 0
            scores[name]=inside-.17*outside-complexity
        raw.append(max(scores,key=scores.get))
    # Three-frame majority vote suppresses isolated percussion transients.
    # Keep edges conservative rather than inventing new chord labels.
    smoothed=[]
    for i,label in enumerate(raw):
        neighbors=[v for v in raw[max(0,i-1):min(len(raw),i+2)] if v]
        if label is None:
            smoothed.append(None)
        elif neighbors:
            counts={v:neighbors.count(v) for v in set(neighbors)}
            winner=max(counts,key=lambda v:(counts[v],v==label))
            smoothed.append(winner if counts[winner]>=2 else label)
        else:
            smoothed.append(label)
    output=[]
    for i,label in enumerate(smoothed):
        if not output or output[-1]["chord"]!=label:
            output.append({"time_seconds":round(i*hop/data.sample_rate,2),"chord":label})
    return {"events":output,"method":"cpu-harmonic-chroma-v2",
            "duration_ms":round((time.monotonic()-started)*1000,1),
            "max_rss_kb":resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
            "limitations":"Experimental baseline; not validated on commercial recordings"}
