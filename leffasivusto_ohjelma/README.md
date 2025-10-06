# 🎬 Leffasivusto – kehityskäynnistys

## 📦 Esivaatimukset
- Node.js v18+  
- npm  

---

## 🚀 Aloitus (ensimmäinen kerta / päivitys)

1. Kloonaa tai päivitä repo:

```bash
git clone https://github.com/Web-ohjelmoinnin-sprojekti-Group-11/leffasivusto.git
cd leffasivusto
git pull origin main
```

2. Siirry projektin kansioon:

```bash
cd leffasivusto
```

3. Asenna riippuvuudet (riittää jatkossa pelkkä `npm install`):

```bash
npm install
```

4. Käynnistä dev-palvelin:

```bash
npm run dev
```

---

## 🔑 Ympäristömuuttujat
- `.env` (ei versionhallintaan)  
- Löytyy esimerkki tiedostosta `.env.example`  

---

## 🖥️ Git Bash ohjeet

### 🔄 Päivitys (pull)

```bash
git checkout main
git pull origin main
```

### 📤 Muutosten vieminen (push)

```bash
git add .
git commit -m "<kuvaus>"
git push origin main
```

### 🌱 Uuden haaran luonti

```bash
git checkout -b TEPPO_TESTI
```

### ☁️ Haaran vieminen GitHubiin

```bash
git add .
git commit -m "kuvaus"
git push origin TEPPO_TESTI
```

### 🔗 Haaran yhdistäminen (merge)

Kun työ on valmis ja testattu:

```bash
git checkout main
git pull origin main
git merge TEPPO_TESTI
git push origin main
```
 
---

## Shareable favorites (uusi ominaisuus)

Voit jakaa käyttäjän "Favorites"-listan julkisella linkillä. Ominaisuus on lisätty siten, että se ei poista olemassaolevaa toiminnallisuutta vaan toimii erillisenä komponenttina/prosessina.

API-endpointit:
- GET /api/user/favorites/share -> palauttaa { token: null | string } (vaatii auth)
- POST /api/user/favorites/share { action: 'create' | 'remove''} -> luo tai poistaa tokenin (vaatii auth)
- GET /api/share/:token -> julkinen reitti listan hakemiseen (ei vaadi auth)

Frontend:
- Profiili -> Favorites välilehdellä näkyy kenttä, josta käyttäjä voi luoda/poistaa ja kopioida linkin.
- Julkinen reitti: /share/:token näyttää jaetun suosikkilistan julisteina (ei vaadi kirjautumista).

Testaus:
- Kirjaudu sisään, mene Profiili -> Favorites ja paina "Uudelleenluo / Jaa". Kopioi linkki ja avaa se incognito-ikkunassa ilman kirjautumista.


