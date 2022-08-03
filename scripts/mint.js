const { ethers } = require("hardhat");

async function mint() {
    console.log('Minting an NFT...')
    const basicNft = await ethers.getContract('BasicNFT')
    const txResponse = await basicNft.mintNft()
    await txResponse.wait(1)
}

mint()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })