#!/usr/bin/env python3
"""Préparer hors ligne un Worker monAvenir complet à partir de son script exporté.

Ne déploie rien. Préserve le code existant et ajoute uniquement les ressources
du Laboratoire et du tableur à la carte `assets` du Worker actuel.
Usage : python3 scripts/prepare-worker-lab.py worker-original.js worker-lab-preview.js
"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
ASSETS = {
    "/laboratoire.html": ("text/html; charset=utf-8", "laboratoire.html"),
    "/tp-tableur.html": ("text/html; charset=utf-8", "tp-tableur.html"),
    "/tp-tableur.css": ("text/css; charset=utf-8", "tp-tableur.css"),
    "/js/tp-tableur.js": ("text/javascript; charset=utf-8", "js/tp-tableur.js"),
    "/js/tableur-engine.js": ("text/javascript; charset=utf-8", "js/tableur-engine.js"),
    "/js/tableur-xlsx.js": ("text/javascript; charset=utf-8", "js/tableur-xlsx.js"),
    "/js/api.js": ("text/javascript; charset=utf-8", "js/api.js"),
}
MARKER = "const assets={"

def prepare(original: pathlib.Path, destination: pathlib.Path) -> None:
    source = original.read_text(encoding="utf-8")
    if not source.startswith(MARKER):
        raise ValueError("Format du Worker inconnu : abandon sans modification")
    if source.count(MARKER) != 1:
        raise ValueError("Déclaration des assets ambiguë")
    if "export default {async fetch(request,env)" not in source:
        raise ValueError("Point d'entrée Worker absent : abandon")
    if "/api/ege-ai" not in source or "/api/interactive-ai" not in source:
        raise ValueError("API existante absente : abandon")
    entries = []
    for url, (mime, relative_path) in ASSETS.items():
        if json.dumps(url, ensure_ascii=False) + ":[" in source:
            raise ValueError(f"Ressource déjà présente dans le Worker : {url}")
        payload = (ROOT / relative_path).read_text(encoding="utf-8")
        entries.append(json.dumps(url, ensure_ascii=False) + ":" +
                       json.dumps([mime, False, payload], ensure_ascii=False))
    insert = ",".join(entries) + ","
    result = source.replace(MARKER, MARKER + insert, 1)
    if not result.endswith(source[len(MARKER):]):
        raise AssertionError("Le code existant n'est pas resté identique")
    if destination.resolve() == original.resolve():
        raise ValueError("La destination doit différer du fichier original")
    destination.write_text(result, encoding="utf-8")
    print(f"Worker de prévisualisation créé : {destination} ({len(ASSETS)} ressources ajoutées)")
    print("Aucun déploiement effectué. Vérifier syntaxe, limites Worker, tests et bindings.")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    prepare(pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]))
