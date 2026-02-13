# Esperimento PDF · BARDA

Generatore standalone per creare **solo** le pagine di **Condizioni di Fornitura** in stile verde, separato dal codice principale del preventivatore.

## Comando rapido

```bash
npm run pdf:barda
```

Output predefinito:

- `experiments/barda-terms-pdf/output/barda-condizioni-fornitura.pdf`

## Aggiungere logo

```bash
npm run pdf:barda -- --logo ./public/logo-barda.png
```

## Cambiare file di output

```bash
npm run pdf:barda -- --out ./downloads/condizioni-barda.pdf
```

## Note

- Se il logo non è trovato, il PDF viene comunque generato con placeholder.
- Se non passi `--logo`, lo script prova automaticamente a usare un file logo in `experiments/barda-terms-pdf` (es. `Barda - Logo.jpeg`).
- I dati aziendali BARDA sono già impostati nello script `generate.mjs`.
- Questo esperimento non modifica i componenti PDF usati dal preventivatore principale.
