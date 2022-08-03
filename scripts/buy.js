const { ethers } = require('hardhat')

async function buyNft() {
    const basicNft = await ethers.getContract('BasicNFT')
    const nftMarketplace = await ethers.getContract('NFTMarketplace')
    const txResponse = await nftMarketplace.buyItem(basicNft.address, 0)
    await txResponse.wait(1)
}

buyNft()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })