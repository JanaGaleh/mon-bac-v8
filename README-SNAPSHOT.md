# Snapshot de production monAvenir — 19 novembre 2026

Source : Cloudflare Worker `ege-gfm-2027`, version `6fcee436-e16b-48e9-a48e-7e1bfd649bee` (déployée à 15:38:34 UTC).

Ce snapshot contient la table des **251 ressources statiques** réellement servies par le Worker (HTML, JS, CSS, images, etc.), sauvegardée en sept segments UTF-8 ordonnés. Les segments concaténés forment un objet JSON dont les clés sont les chemins URL et les valeurs sont `[mime, binary, content]`. Lorsque `binary=true`, le contenu est encodé en base64.

Reconstruction :

```python
from pathlib import Path
import json, base64
parts = sorted(Path('snapshot-assets').glob('assets.part-*.jsonpart'))
assets = json.loads(''.join(p.read_text(encoding='utf-8') for p in parts))
for path, (mime, binary, content) in assets.items():
    target = Path('restored') / path.lstrip('/')
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(base64.b64decode(content) if binary else content.encode('utf-8'))
print(len(assets), 'fichiers restaurés')
```

**Attention :** il s'agit d'une sauvegarde des ressources statiques, pas du code serveur intégral ni des données Supabase. Ne pas déployer cette branche directement sur le Worker sans contrôle.
