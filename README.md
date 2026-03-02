# osrs-dps-calc
[![](https://img.shields.io/badge/view%20online-red)](https://tools.runescape.wiki/osrs-dps) ![GitHub contributors](https://img.shields.io/github/contributors/weirdgloop/osrs-dps-calc)

Web-based DPS calculator for Old School RuneScape, created for the [OSRS Wiki](https://oldschool.runescape.wiki).

This calculator determines how well certain loadouts, consisting of equipment, prayers, and buffs, will perform against monsters in the game. It heavily uses data from the OSRS Wiki.

## API (minimal)
This fork includes a minimal endpoint for average time-to-kill:

- `POST /api/ttk`
- `GET /api/lookup`

Example body:

```json
{
  "monsterId": 415,
  "setup": {
    "equipment": {
      "weapon": 4151,
      "neck": 6585
    }
  }
}
```

The endpoint returns `ttk` (seconds), plus `dps`, `maxHit`, `accuracy`, and resolved monster metadata.
`monsterId` and `setup.equipment` values can be either numeric IDs or case-insensitive names.
If a name is ambiguous (for example, monster variants), provide `monsterVersion` or use numeric IDs.
You can also inline a variant in `monsterId` as `name#version` (for example `Yama#Normal`).

You can resolve names to IDs with lookup:

```bash
curl -sS "http://localhost:3000/osrs-dps/api/lookup?type=equipment&name=abyssal%20whip&exact=true" | jq
curl -sS "http://localhost:3000/osrs-dps/api/lookup?type=monster&name=abyssal%20demon&exact=true" | jq
```

## Local systemd service
If you want other local projects (for example, Python services) to call this calculator reliably, run it as a user-level `systemd` service.

What:
- A long-running local API process for this repo on `127.0.0.1:3000`.

Why:
- Keeps the DPS engine endpoint available across terminal sessions.
- Lets other local processes call `/osrs-dps/api/ttk` and `/osrs-dps/api/lookup` without manually starting `yarn dev`.

How:
1. Create `~/.config/systemd/user/osrs-dps-api.service`:

```ini
[Unit]
Description=OSRS DPS API (Next.js)
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/mads/osrs-dps-calc
Environment=NODE_ENV=development
ExecStart=/home/mads/.nvm/versions/node/v20.19.0/bin/node /home/mads/osrs-dps-calc/.yarn/releases/yarn-4.9.2.cjs dev -p 3000 -H 127.0.0.1
Restart=always
RestartSec=3

[Install]
WantedBy=default.target
```

2. Enable and start:

```bash
systemctl --user daemon-reload
systemctl --user enable --now osrs-dps-api
```

3. Check logs/status:

```bash
systemctl --user status osrs-dps-api
journalctl --user -u osrs-dps-api -f
```

4. Call from local clients:

```bash
curl -sS -X POST http://127.0.0.1:3000/osrs-dps/api/ttk -H 'Content-Type: application/json' -d '{"monsterId":"yama#normal","setup":{"equipment":{"weapon":"abyssal whip"}}}'
```

## Contributing
We accept issues and pull requests! [Click here for info](CONTRIBUTING.md).

## Acknowledgements
* Bitterkoekje's [spreadsheet](https://docs.google.com/spreadsheets/d/1wzy1VxNWEAAc0FQyDAdpiFggAfn5U6RGPp2CisAHZW8/edit?pli=1#gid=158500257) for a lot of initial math, formulas, and more
* Many [OSRS Wiki](https://oldschool.runescape.wiki) contributors for information on items, monsters, spells, and more
* ...and all of the [contributors](https://github.com/weirdgloop/osrs-dps-calc/graphs/contributors) to this project!
