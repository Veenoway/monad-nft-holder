const { ethers } = require("ethers");
const fs = require("fs");

async function fetchNFTHolders(contractAddress) {
  // Configuration du provider
  const provider = new ethers.JsonRpcProvider(
    "https://testnet-rpc2.monad.xyz/52227f026fa8fac9e2014c58fbf5643369b3bfc6"
  );

  // ABI minimal pour les fonctions nécessaires
  const abi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    "function ownerOf(uint256 tokenId) view returns (address)",
  ];

  // Création de l'instance du contrat
  const contract = new ethers.Contract(contractAddress, abi, provider);

  try {
    console.log("Récupération des détenteurs actuels...");

    // Récupération du nombre total de tokens
    const totalSupply = await contract.totalSupply();
    console.log(`Nombre total de tokens: ${totalSupply}`);

    // Map pour stocker les balances par adresse
    const holderBalances = new Map();
    let count = 1;

    // Création du contenu du fichier
    let fileContent = `Liste des détenteurs du contrat ${contractAddress}\n`;
    fileContent += `Date: ${new Date().toISOString()}\n\n`;

    // Parcours de tous les tokens
    for (let i = 0; i < totalSupply; i++) {
      try {
        const owner = await contract.ownerOf(i);
        const balance = await contract.balanceOf(owner);

        if (balance > 0) {
          // Mise à jour de la balance totale pour cette adresse
          holderBalances.set(owner, balance);
        }
      } catch (error) {
        // Certains tokens peuvent ne pas exister ou être brûlés
        console.log(`Token ${i} non trouvé`);
      }
    }

    // Affichage des résultats
    for (const [address, balance] of holderBalances) {
      const line = `${count}. ${address} - Balance: ${balance}\n`;
      console.log(line.trim());
      fileContent += line;
      count++;
    }

    fileContent += `\nNombre total de détenteurs: ${holderBalances.size}\n`;

    // Sauvegarde dans un fichier
    const fileName = `holders_${contractAddress.slice(
      0,
      10
    )}_${Date.now()}.txt`;
    fs.writeFileSync(fileName, fileContent);
    console.log(`\nRésultats sauvegardés dans le fichier: ${fileName}`);

    return Array.from(holderBalances.keys());
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des détenteurs:",
      error.message
    );
    throw error;
  }
}

// Exemple d'utilisation
const contractAddress = process.argv[2];
if (!contractAddress) {
  console.error("Veuillez fournir une adresse de contrat en argument");
  process.exit(1);
}

fetchNFTHolders(contractAddress).catch(console.error);
