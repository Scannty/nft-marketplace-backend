const { ethers } = require("hardhat");

const PRICE = ethers.utils.parseEther('5')

async function mintAndList() {
    const nftMarketplace = await ethers.getContract('NFTMarketplace')
    console.log('Minting an NFT...')
    const basicNft = await ethers.getContract('BasicNFT')
    const txResponse = await basicNft.mintNft()
    const txReceipt = await txResponse.wait(1)
    const tokenId = txReceipt.events[0].args.tokenId
    console.log('Approving NFT Marketplace to use the NFT...')
    const approvalTx = await basicNft.approve(nftMarketplace.address, tokenId)
    await approvalTx.wait(1)
    console.log('Listing the NFT to the marketplace')
    const listTx = await nftMarketplace.listItem(basicNft.address, tokenId, PRICE)
    await listTx.wait(1)
    console.log('All done! :))')
}

mintAndList()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })