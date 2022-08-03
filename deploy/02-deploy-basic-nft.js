const { network } = require('hardhat')
const { verify } = require("../utils/verify")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    log(`Deploying the Basic NFT contract to ${network.name}`)
    const basicNft = await deploy('BasicNFT', {
        from: deployer,
        args: [],
        log: true
    })
    log('------------------------')

    if (network.config.chainId != 31337 && process.env.ETHERSCAN_API_KEY) {
        log('Verifying...')
        await verify(basicNft.address, [])
    }
}

module.exports.tags = ['all', 'basicNft']