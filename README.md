## Vyzkoušení aplikace
1. Stáhnout složku s aplikací (Voter/Moderator/Management)
2. Stáhnout a nainstalovat Visual Studio Code (Doporučuji rozšíření solidity a Truffle for VS Code)
3. Otevřít aplikaci ve Visual Studio Code a spustit příkaz npm install
4. Stáhnout si webové rozšíření Metamask, vytvořit účet a přihlásit se
5. V peněžence Metamask zapnout možnost Show test networks v Settings/Advanced a následně přepnout síť na Sepolia Testnet
6. Ve Visual Studio Code zapnout aplikaci příkazem npx expo start
7. Zmáčkout možnost open web pomocí tlačítka W

## Nasazení smart kontraktů
1. Založení účtu na infura.io a vytvořit si nový API klíč s typem Network Web3 API
2. Ve složce src vytvořit soubor s názvem .env a vyplnit následující 
    1. **MNEMONIC** - Seed phrase Metamask peněženky - 12 slov 
    2. **URL_SEPOLIA** - URL na sepolia testnet včetně project id 
    3. **PRIVATE_KEY** - Privátní klíč z Metamask účtu (otevřít Metamask, vpravo od názvu účtu kliknout na trojtečku, zvolit možnost detaily účtu a exportovat privátní klíč)
3. Otevřít konzoli a ve složce src spustit příkaz **npm install truffle**
4. Nasazení smart kontraktu ze složky src pomocí příkazu v konzoli **. ./node_modules/.bin/truffle migrate --network sepolia**

### (Nasazení identityRegistry) 

V případě nasazazení smart kontraktu identityRegistry je nutné změnit adresu smart kontraktu identityRegistry v konstruktoru smart kontraktu Queans v aplikacích Voter a Moderator, kterou lze získat z odpovědi po zadání příkazu **truffle migrate --network sepolia** nebo použitím transaction hashe na webu https://sepolia.etherscan.io/. 
Dále je nutné změnit adresu smart kontraktu identityRegistry v aplikaci Management v souboru /src/identityRegistry.js, kde se nahradí aktuální adresa smart kontraktu, čímž se docílí napojení aplikace na smart kontrakt. Následně je nutné použít v root složce v aplikacích Voter a Moderator příkaz **npm run compile** pro vytvoření ABI smart kontraktu Queans. ABI se vytvoří ve složce /build/src_contracts_Queans_sol_Queans.abi a je nutné ho zkopírovat a nahradit stávající ABI v souboru src/queans.js.

### (Nasazení Queans) 
Při nasazení smart kontraktu Queans je nutné vložit novou adresu smart kontraktu do souboru src/queans.js.

## Test smart kontraktů (Dostupné v aplikacích Voter a Moderator)
1. Otevřít konzoli a ve složce src spustit příkaz **npm install ganache**
2. Zapnout ganache příkazem **. ./node_modules/.bin/ganache**
3. Otevřít novou konzoli, přejít do složky src a zadat příkaz **npm install truffle**
4. Otevřít aplikaci a ve smart kontraktu Queans je nutné odkomentovat funkci update 
5. Použít příkaz **. ./node_modules/.bin/truffle test** k zapnutí testů

### Odkaz na Youtube video
https://youtu.be/ZtQJVtt6sNc
