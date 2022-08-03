const { network } = require('hardhat')
const { verify } = require("../utils/verify")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    log(`Deploying the NFT Marketplace contract to ${network.name}...`)
    const nftMarketplace = await deploy('NFTMarketplace', {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: 6
    })
    log('------------------------------')

    if (network.config.chainId != 31337 && process.env.ETHERSCAN_API_KEY) {
        log('Verifying...')
        await verify(nftMarketplace.address, [])
    }
}

module.exports.tags = ['all', 'nftMarketplace']