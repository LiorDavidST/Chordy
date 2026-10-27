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
    return {"status":"ok","engine":"cpu-chroma-experiment","plan":"free-compatible"}

@app.post("/analyze")
def analyze(data: AudioInput):
    started=time.monotonic()
    x=np.asarray(data.samples,dtype=np.float32)
    if not np.all(np.isfinite(x)) or np.max(np.abs(x))>1.1:
        raise HTTPException(422,"Invalid normalized PCM")
    n=8192
    hop=5512
    window=np.hanning(n).astype(np.float32)
    freqs=np.fft.rfftfreq(n,1/data.sample_rate)
    valid=(freqs>=65)&(freqs<=1800)
    midi=np.rint(69+12*np.log2(np.maximum(freqs[valid],1)/440)).astype(int)%12
    output=[]
    for start in range(0,len(x)-n+1,hop):
        segment=x[start:start+n]*window
        if np.sqrt(np.mean(segment**2))<0.002:
            label=None
        else:
            spectrum=np.abs(np.fft.rfft(segment))[valid]
            chroma=np.bincount(midi,weights=spectrum,minlength=12)
            chroma=chroma/(np.linalg.norm(chroma)+1e-9)
            scores={name:sum(chroma[list(notes)])/np.sqrt(len(notes))-
                    0.12*sum(chroma[[i for i in range(12) if i not in notes]])
                    for name,notes in TEMPLATES.items()}
            label=max(scores,key=scores.get)
        if not output or output[-1]["chord"]!=label:
            output.append({"time_seconds":round(start/data.sample_rate,2),"chord":label})
    return {"events":output,"method":"cpu-chroma-experiment",
            "duration_ms":round((time.monotonic()-started)*1000,1),
            "max_rss_kb":resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
            "limitations":"Experimental baseline; not validated on commercial recordings"}
