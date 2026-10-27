"""Reproducible 50-case synthetic chord benchmark; no network, no user audio."""
import json, math, time, resource
import numpy as np
from experimental_backend.app import analyze, AudioInput

SR=11025
CHORDS={"C":[60,64,67],"Cm":[60,63,67],"D":[62,66,69],"Dm":[62,65,69],"E":[64,68,71],"Em":[64,67,71],"F":[65,69,72],"Fm":[65,68,72],"G":[67,71,74],"Gm":[67,70,74],"A":[69,73,76],"Am":[69,72,76],"B":[71,75,78],"Bm":[71,74,78],"C7":[60,64,67,70],"Cm7":[60,63,67,70],"Fmaj7":[65,69,72,76],"G7":[67,71,74,77],"Am7":[69,72,76,79],"D7":[62,66,69,72]}
def synth(notes, duration, timbre, inversion, seed):
    rng=np.random.default_rng(seed)
    t=np.arange(int(duration*SR))/SR
    notes=notes[inversion:]+[n+12 for n in notes[:inversion]]
    x=np.zeros(len(t))
    for n in notes:
        freq=440*2**((n-69)/12)
        if timbre=="pure":
            x+=np.sin(2*np.pi*freq*t)
        elif timbre=="harmonic":
            x+=np.sin(2*np.pi*freq*t)+.45*np.sin(4*np.pi*freq*t)+.2*np.sin(6*np.pi*freq*t)
        else:
            x+=np.sin(2*np.pi*freq*t)+.3*np.sin(4*np.pi*freq*t)
    x*=.55/max(len(notes),1)
    if timbre=="noisy": x+=rng.normal(0,.025,len(t))
    return x.astype(np.float32).tolist()
cases=[]
names=list(CHORDS)
for i in range(50):
    name=names[i%len(names)]
    timbre=("pure","harmonic","noisy")[i%3]
    inversion=(i//3)%len(CHORDS[name])
    cases.append((name,timbre,inversion))
started=time.monotonic()
rows=[]
for i,(expected,timbre,inversion) in enumerate(cases):
    samples=synth(CHORDS[expected],2.0,timbre,inversion,i)
    result=analyze(AudioInput(samples=samples))
    events=result["events"]
    pred=next((e["chord"] for e in events if e["chord"]),None)
    rows.append({"case":i+1,"expected":expected,"predicted":pred,"correct":pred==expected,"timbre":timbre,"inversion":inversion,"processing_ms":result["duration_ms"]})
total=sum(r["correct"] for r in rows)
report={"benchmark":"synthetic-50-v1","cases":len(rows),"correct":total,"accuracy":round(total/len(rows),4),"elapsed_seconds":round(time.monotonic()-started,2),"max_rss_kb":resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,"results":rows,"note":"Synthetic test only; does not establish real music accuracy"}
with open("benchmark-report.json","w") as f: json.dump(report,f,indent=2)
print(json.dumps({k:v for k,v in report.items() if k!="results"},indent=2))
for r in rows:
    if not r["correct"]: print("MISMATCH",r)
