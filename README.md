# DECENTRALIZED-APPLICATION-FOR-QUESTION-ANSWER-SESSION-BASED-ON-BLOCKCHAIN
// Vyzkoušení aplikace

1. Stáhnout složku s aplikací (Voter/Moderator/Management)

2. Otevřít konzoli a přejít do stažené složky a v rootu spustit příkaz npm install

3. Stáhnout si webové rozšíření Metamask, vytvořit účet a přihlásit se

4. V peněžence Metamask zapnout možnost Show test networks v Settings/Advanced a následně přepnout síť na Sepolia Testnet

5. Stáhnout Visual Studio Code

6. Otevřít aplikaci ve Visual Studio Code a zapnout příkazem npx expo start

7. Zmáčkout možnost open web pomocí tlačítka W

// Deploy smart kontraktů
1. Založení účtu na infura.io a vytvořit si nový API klíč s typem Network Web3 API
Ve složce src vytvořit soubor s názvem .env a vyplnit následující
  MNEMONIC - Seed phrase Metamask peněženky - 12 slov
  URL_SEPOLIA - URL na sepolia testnet včetně project id
  PRIVATE_KEY - Privátní klíč z Metamask účtu - otevřít Metamask, vpravo od názvu účtu kliknout na trojtečku, zvolit možnost detaily účtu a exportovat privátní klíč
ve stažené složce v rootu npm install truffle
../node_modules/.bin/truffle migrate --network sepolia
V případě nasazazení smart kontraktu identityRegistry je nutné změnit adresu smart kontraktu identityRegistry ve smart kontraktu Queans ve konstruktoru v aplikacích Voter a Moderator, kterou lze získat jako odpověď po zadání příkazu truffle migrate --network sepolia nebo použitím transaction hashe na webu https://sepolia.etherscan.io/ a změnit adresu smart kontraktu identityRegistry v aplikace Management ve složce src/identityRegistry.js, kde se nahradí aktuální adresa smart kontraktu, tak se docílí napojení aplikace na smart kontrakt
Následně je nutné použít v root složce v aplikacích Voter a Moderator příkaz npm run compile pro vytvoření ABI smart kontraktu Queans. ABI se vytvoří ve složce build/src_contracts_Queans_sol_Queans.abi a je nutné ho zkopírovat a nahradit stávající ABI ve složce src/queans.js
Při nasazení smart kontraktu Queans je nutné vložit novou adresu smart kontraktu do souboru queans.js ve složce src.
// Test smart kontraktů
ve stažené složce v rootu npm install ganache
zapnutí ganache příkazem ../node_modules/.bin/ganache
v jiné okně ve stažené složce v rootu npm install truffle
a použít příkaz ../node_modules/.bin/truffle test

