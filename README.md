# DEX-Edu Support App — Dark-Ages EXplorer Educational Tool

### A multilingual, offline-ready Progressive Web App (PWA)
Developed by **Alessandro Pezzali** — [pezzaliAPP.com](https://www.pezzaliapp.com)



## 🌍 Overview

**DEX-Edu Support App** è un’applicazione didattica ispirata al concept europeo  
**DEX — Dark-Ages EXplorer**, un interferometro radio a ultra-lunghe lunghezze
d’onda (ULW) pensato per essere collocato sulla **faccia nascosta della Luna**
al fine di studiare l’Universo primordiale (Dark Ages / Cosmic Dawn).

L’app permette di esplorare in modo interattivo i principi scientifici
dell’astronomia radio ULW e di comprendere come vengono progettati gli strumenti
che indagheranno il segnale a 21 cm dell’idrogeno neutro cosmico.


## 🛰️ Features

| Sezione | Descrizione sintetica |
|----------|------------------------|
| **Science Parameters** | Calcolo di z, λ, baseline richiesta D, FoV e età dell’Universo. |
| **21-cm Simulator** | Visualizzazione qualitativa del segnale 21-cm vs foreground. |
| **Array Planner** | Generatore di layout d’antenne e istogramma baseline. |
| **uv-plane Viewer** | Copertura uv sintetica basata sui parametri dell’array. |
| **RFI Shield** | Modellazione concettuale del “radio-shadow” lunare. |

Tutti i moduli sono **completamente client-side**, funzionano **offline**
ed esportano i dati in **JSON**, **CSV** o **Report stampabile**.


## 🈯 Multilingue

Interfaccia disponibile in **Italiano (default)**, **English**, **Deutsch**, **Português**.  
Il selettore lingua si trova in alto a destra; la preferenza è salvata in `localStorage`.


## 🧠 Educational Purpose

Il progetto ha finalità **puramente educative e divulgative**:
- facilitare la comprensione di concetti astrofisici legati alle osservazioni ULW;  
- fornire uno strumento interattivo per studenti, docenti e divulgatori scientifici;  
- promuovere la cultura open-source nel settore **STEM + Space Education**.


## 🧩 Technical Details

- **Technology stack:** HTML5 + CSS3 + Vanilla JS  
- **Frameworks:** none (required 0 dependencies)  
- **PWA ready:** installabile su desktop / mobile / offline  
- **Caching:** Service Worker v2 (full offline bundle)  
- **License:** MIT License (see `LICENSE`)  
- **Source:** hosted on [GitHub Pages](https://www.alessandropezzali.it/DEX_Support_App)


## 🧪 How to Use

1. Apri l’app o installala come PWA.  
2. Seleziona una lingua dal menu in alto a destra.  
3. Naviga tra le schede (Overview, Science, Simulator, Array, uv-plane, RFI Shield).  
4. Esporta i risultati in formato JSON, CSV o Report stampabile.  

Tutti i dati restano in locale: nessuna telemetria né connessione esterna è richiesta.


## ⚠️ Disclaimer

Questo software è un **progetto indipendente** a scopo **educativo e non commerciale**,  
**ispirato** al concept **DEX — Dark-Ages EXplorer** (ESA).  
Non rappresenta né è approvato da ESA, EU, NASA o altri enti istituzionali.


## 🧾 License

Distributed under the terms of the [MIT License](LICENSE).  
© 2025 Alessandro Pezzali — *pezzaliAPP / Il Quarto Attore*
