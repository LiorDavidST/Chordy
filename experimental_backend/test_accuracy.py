"""Deterministic synthetic triad benchmark. Run: python -m unittest discover experimental_backend -p 'test_*.py'"""
import unittest
import numpy as np
from experimental_backend.app import analyze, AudioInput

NOTES={"C":(60,64,67),"Am":(57,60,64),"F":(53,57,60),"G":(55,59,62)}
def tone(midi,seconds=2,sr=11025):
    t=np.arange(int(seconds*sr))/sr
    x=sum(np.sin(2*np.pi*440*2**((note-69)/12)*t) for note in NOTES[midi])
    return (0.22*x).astype(np.float32).tolist()

class AccuracyTests(unittest.TestCase):
    def test_silence_no_chord(self):
        events=analyze(AudioInput(samples=[0.0]*11025))["events"]
        self.assertEqual(events[0]["chord"],None)
    def test_synthetic_triad_accuracy(self):
        expected=["C","Am","F","G"]
        predicted=[]
        for name in expected:
            result=analyze(AudioInput(samples=tone(name)))
            labels=[e["chord"] for e in result["events"] if e["chord"]]
            predicted.append(labels[0] if labels else None)
        accuracy=sum(a==b for a,b in zip(expected,predicted))/len(expected)
        print("synthetic_triad_accuracy=",accuracy,"predictions=",predicted)
        self.assertGreaterEqual(accuracy,0.75)

if __name__=="__main__":
    unittest.main()
