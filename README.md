# ZP formuláre

Čistá statická single-page appka na vyplnenie dvoch PDF formulárov:

- ZP-4, žiadosť o vydanie nákupného povolenia
- ZP-6, žiadosť o zaevidovanie zbrane a vydanie preukazu zbrane

## Spustenie lokálne

Netreba build ani VPS. Z priečinka projektu spusti:

```powershell
python -m http.server 5173
```

Potom otvor:

```text
http://localhost:5173
```

## Deploy

Súbory sa dajú nahrať na ľubovoľný statický hosting, napríklad GitHub Pages,
Netlify alebo Cloudflare Pages. Treba nahrať aj priečinky `templates/`,
`fonts/` a `vendor/`.

## Pridanie ďalších polí

PDF súbory nemajú AcroForm polia, preto sa text vkladá podľa súradníc v
`FORM_CONFIGS` v `app.js`. Ďalšie pole znamená pridať objekt s `field`, `x`,
`y` a `w`.
