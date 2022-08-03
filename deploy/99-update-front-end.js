require('dotenv').config()
const { ethers } = require('hardhat')
const fs = require('fs')
const path = require('path')

module.exports = async function () {
    if (!process.env.UPDATE_FRONT_END) return
    const basicNft = await ethers.getContract('BasicNFT')
    const nftMarketplace = await ethers.getContract('NFTMarketplace')
    updateAbi(basicNft, nftMarketplace)
    updateContractAddresses(basicNft, nftMarketplace)
}

function updateAbi(basicNft, nftMarketplace) {
    const basicNftPath = path.resolve(__dirname, '../../nft-marketplace-front-end/constants/BasicNftAbi.json')
    const nftMarketplacePath = path.resolve(__dirname, '../../nft-marketplace-front-end/constants/NftMarketplaceAbi.json')

    fs.writeFileSync(basicNftPath, basicNft.interface.format(ethers.utils.FormatTypes.json))
    fs.writeFileSync(nftMarketplacePath, nftMarketplace.interface.format(ethers.utils.FormatTypes.json))
}

function updateContractAddresses(basicNft, nftMarketplace) {
    const contractAddressesPath = path.resolve(__dirname, '../../nft-marketplace-front-end/constants/networkMapping.json')
    const contractAddresses = {
        NftMarketplace: nftMarketplace.address,
        BasicNft: basicNft.address
    }
    fs.writeFileSync(contractAddressesPath, JSON.stringify(contractAddresses))
}

module.exports.tags = ['all', 'frontend']