# DECENTRALIZED-APPLICATION-FOR-QUESTION-ANSWER-SESSION-BASED-ON-BLOCKCHAIN
Vyzkoušení aplikace

1. Stáhnout složku s aplikací (Voter/Moderator/Management)

2. Otevřít konzoli a přejít do stažené složky a v rootu spustit příkaz npm install

3. Stáhnout si webové rozšíření Metamask, vytvořit účet a přihlásit se

4. V peněžence Metamask zapnout možnost Show test networks v Settings/Advanced a následně přepnout síť na Sepolia Testnet

5. Stáhnout a nainstalovat Visual Studio Code (Doporučuji rozšíření solidity a Truffle for VS Code)

6. Otevřít aplikaci ve Visual Studio Code a zapnout příkazem npx expo start

7. Zmáčkout možnost open web pomocí tlačítka W

Deploy smart kontraktů
1. Založení účtu na infura.io a vytvořit si nový API klíč s typem Network Web3 API

2. Ve složce src vytvořit soubor s názvem .env a vyplnit následující
  MNEMONIC - Seed phrase Metamask peněženky - 12 slov
  URL_SEPOLIA - URL na sepolia testnet včetně project id
  PRIVATE_KEY - Privátní klíč z Metamask účtu (otevřít Metamask, vpravo od názvu účtu kliknout na trojtečku, zvolit možnost detaily účtu a exportovat privátní klíč)
  
3. Otevřít konzoli a ve složce src spustit příkaz npm install truffle

4. Nasazení smart kontraktu pomocí příkazu v konzoli ze složky src ../node_modules/.bin/truffle migrate --network sepolia

(Aplikace Management)
5. V případě nasazazení smart kontraktu identityRegistry je nutné změnit adresu smart kontraktu identityRegistry v konstruktoru smart kontraktu Queans v aplikacích Voter a Moderator, kterou lze získat z odpovědi po zadání příkazu truffle migrate --network sepolia nebo použitím transaction hashe na webu https://sepolia.etherscan.io/.
Dále je nutné změnit adresu smart kontraktu identityRegistry v aplikace Management ve souboru src/identityRegistry.js, kde se nahradí aktuální adresa smart kontraktu, čímž se docílí napojení aplikace na smart kontrakt.
Následně je nutné použít v root složce v aplikacích Voter a Moderator příkaz npm run compile pro vytvoření ABI smart kontraktu Queans. ABI se vytvoří ve složce build/src_contracts_Queans_sol_Queans.abi a je nutné ho zkopírovat a nahradit stávající ABI v souboru src/queans.js.

(Aplikace Voter nebo Moderator)
Při nasazení smart kontraktu Queans je nutné vložit novou adresu smart kontraktu do souboru src/queans.js.

Test smart kontraktů
1. Otevřít konzoli a ve složce src spustit příkaz npm install ganache

2. Zapnout ganache příkazem ../node_modules/.bin/ganache

3. Otevřít novou konzoli, přejít do složky src a zadat příkaz npm install truffle

4. Použít příkaz ../node_modules/.bin/truffle test k zapnutí testů

+ update v Queans
