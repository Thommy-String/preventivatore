# Esperimento PDF · BARDA

Generatore standalone per creare un PDF **offerta monofoglio** con layout completamente riorganizzato:

- contenuto solo nella **metà superiore** della pagina
- metà inferiore lasciata volutamente **bianca**
- logo e immagine profilo in versione ridotta
- struttura con bordi netti e griglia più ordinata

## Comando rapido

```bash
npm run pdf:barda
```

Output predefinito:

- `experiments/barda-terms-pdf/output/barda-offerta-1page.pdf`

## Aggiungere logo

```bash
npm run pdf:barda -- --logo ./public/logo-barda.png
```

## Aggiungere immagine profilo

```bash
npm run pdf:barda -- --profile ./public/profilo-serramento.png
```

## Cambiare file di output

```bash
npm run pdf:barda -- --out ./downloads/condizioni-barda.pdf
```

## Note

- Se logo o immagine profilo non sono trovati, il PDF viene comunque generato con placeholder.
- Se non passi `--logo`, lo script prova automaticamente a usare un file logo in `experiments/barda-terms-pdf` (es. `Barda - Logo.jpeg`).
- Se non passi `--profile`, lo script prova automaticamente file profilo in `experiments/barda-terms-pdf` (es. `profilo.png`).
- I dati aziendali e i contenuti demo sono già impostati nello script `generate.mjs`.
- Questo esperimento non modifica i componenti PDF usati dal preventivatore principale.
