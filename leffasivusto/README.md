Leffasivusto – kehityskäynnistys

Esivaatimukset
- Node 18+ ja npm

Aloitus (ensikerta / päivitys)
1) Kloonaa tai päivitä
   git clone https://github.com/Web-ohjelmoinnin-sprojekti-Group-11/leffasivusto.git
   cd leffasivusto
   git pull origin main

2) Siirry app-kansioon
   cd leffasivusto

3) Asenna riippuvuudet (riittää jatkossa "npm install")
   npm install

4) Käynnistä dev-palvelin
   npm run dev

Ympäristömuuttujat (.env – ei versionhallintaan)
Löytyy esimerkki .env.example


Git bash

## Git pull 

```bash
git checkout main
git pull origin main

## Git push (muutosten vieminen)

```bash
git add .
git commit -m "<kuvaus>"
git push origin main


## Haaran luonti

git checkout -b TEPPO_TESTI

## Haaran vieminen

git add .
git commit -m "kuvaus"
git push origin TEPPO_TESTI

## Merge

git checkout main
git pull origin main
git merge TEPPO_TESTI
git push origin main



