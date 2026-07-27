.PHONY: proof proof-static report clean

proof:
	bash tools/prove_current.sh

proof-static:
	python3 proofs/verify_manifest.py
	python3 proofs/verify_payloads.py
	python3 proofs/generate_scripted_vectors.py --check

report:
	python3 proofs/make_report.py

clean:
	rm -rf proofs/.tmp proof-artifacts
	find . -type d -name __pycache__ -prune -exec rm -rf {} +
