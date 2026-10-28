"""Read-only checks of the target Auth settings and anonymous access boundaries.

No account, message or payment is created. Only the public client key is used.
"""
import json
import re
import urllib.error
import urllib.request
from pathlib import Path

config = (Path(__file__).resolve().parents[1] / "js/api.js").read_text()
url = re.search(r'https://[a-z]+\.supabase\.co', config).group()
key = re.search(r'sb_publishable_[A-Za-z0-9_-]+', config).group()
assert url == "https://yxlyfgyviupkzoboxpte.supabase.co"

def request(path, data=None):
    headers = {"apikey": key, "Content-Type": "application/json"}
    req = urllib.request.Request(url + path, data=data, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as error:
        return error.code, json.loads(error.read())

status, settings = request("/auth/v1/settings")
assert status == 200, "Auth settings unavailable"
print(json.dumps({"auth_http": status,
                  "email_enabled": settings.get("external", {}).get("email"),
                  "google_enabled": settings.get("external", {}).get("google"),
                  "email_confirmation_required": not settings.get("mailer_autoconfirm", False)}))
status, _ = request("/rest/v1/profils?select=id&limit=1")
assert status in (401, 403), "Anonymous profile reads must be denied"
print(json.dumps({"anonymous_profiles": "denied", "http": status}))
status, _ = request("/rest/v1/rpc/statistiques_admin", data=b"{}")
assert status in (401, 403), "Anonymous administrative RPC must be denied"
print(json.dumps({"anonymous_admin_rpc": "denied", "http": status}))
