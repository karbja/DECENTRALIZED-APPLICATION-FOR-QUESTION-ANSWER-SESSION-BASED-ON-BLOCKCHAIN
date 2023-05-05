# DECENTRALIZED-APPLICATION-FOR-QUESTION-ANSWER-SESSION-BASED-ON-BLOCKCHAIN
// Vyzkoušení aplikace

1. Stáhnout složku s aplikací

2. V konzoli přejít do stažené složky a rootu spustit příkaz npm install

3. Stáhnout webové rozšíření Metamask a vytvořit účet a přihlásit se

4. Zapnout možnost Show test networks v Settings/Advanced

5. Přepnutí na Sepolia Testnet

6. Stáhnout Visual Studio Code

7. Otevření apliakce a zapnutí příkazem npx expo start

8. Stisk w

// Deploy smart kontraktů
Založení účtu na infura.io, vytvořit projekt a 
Ve složce src vytvořit soubor .env a vyplnit následující
  MNEMONIC - Seed phrase Metamask peněženky - 12 slov
  URL_SEPOLIA - URL na sepolia testnet včetně project id
  PRIVATE_KEY - Privátní klíč z Metamask účtu - otevřít Metamask, vpravo od názvu účtu kliknout na trojtečku, zvolit možnost detaily účtu a exportovat privátní klíč
ve stažené složce v rootu npm install truffle
../node_modules/.bin/truffle migrate --network sepolia
V případě nasazazení smart kontraktu identityRegistry je nutné změnit adresu smart kontraktu identityRegistry ve smart kontraktu Queans ve konstruktoru v aplikacích Voter a Moderator, kterou lze získat jako odpověď po zadání příkazu truffle migrate --network sepolia nebo použitím transaction hashe na webu https://sepolia.etherscan.io/ a změnit adresu smart kontraktu identityRegistry v aplikace Management ve složce src/identityRegistry.js, kde se nahradí aktuální adresa smart kontraktu, tak se docílí napojení aplikace na smart kontrakt
Následně je nutné použít v root složce v aplikacích Voter a Moderator příkaz npm run compile pro vytvoření ABI smart kontraktu Queans. ABI se vytvoří ve složce build/src_contracts_Queans_sol_Queans.abi a je nutné ho zkopírovat a nahradit stávající ABI ve složce src/queans.js

// Test smart kontraktů

