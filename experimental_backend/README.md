# Experimental chord backend — isolated branch
CPU-only FastAPI proof of concept, no authentication and no persistent storage.
POST /analyze takes up to 20 seconds of mono normalized PCM at 11025 Hz.
Do **not** submit copyrighted or private recordings to this public endpoint.
This is a synthetic benchmark, not evidence of real-song accuracy.
Run: pip install -r experimental_backend/requirements.txt
Test: python -m unittest discover experimental_backend -p 'test_*.py'
Start: uvicorn experimental_backend.app:app --host 0.0.0.0 --port 10000
Production integration requires access control, input constraints and verified real-song benchmarks.
