const { network, deployments, ethers } = require('hardhat')
const { assert, expect } = require('chai')

network.config.chainId != 31337
    ? describe.skip
    : describe('NFT Marketplace unit tests', () => {
        let nftMarketplace, basicNft, deployer, player
        const PRICE = ethers.utils.parseEther('10')

        beforeEach(async () => {
            const accounts = await ethers.getSigners()
            deployer = accounts[0]
            player = accounts[1]
            player_two = accounts[2]
            await deployments.fixture(['all'])
            nftMarketplace = await ethers.getContract('NFTMarketplace', player)
            basicNft = await ethers.getContract('BasicNFT', player)
            await basicNft.mintNft()
            await basicNft.approve(nftMarketplace.address, 0)
        })

        describe('listItem', () => {
            it('reverts if price is not above zero', async () => {
                await expect(nftMarketplace.listItem(basicNft.address, 0, 0))
                    .to.be.revertedWithCustomError(nftMarketplace, 'NFTMarketplace__PriceMustBeAboveZero')
            })

            it('reverts if the marketplace is not approved', async () => {
                await basicNft.mintNft()
                await expect(nftMarketplace.listItem(basicNft.address, 1, PRICE))
                    .to.be.revertedWithCustomError(nftMarketplace, 'NFTMarketplace__NotApprovedForMarketplace')
            })

            it('reverts if the nft is already listed', async () => {
                await nftMarketplace.listItem(basicNft.address, 0, PRICE)
                await expect(nftMarketplace.listItem(basicNft.address, 0, PRICE))
                    .to.be.revertedWithCustomError(nftMarketplace, 'NFTMarketplace__AlreadyListed')
                    .withArgs(basicNft.address, 0)
            })

            it('reverts if the caller does not own the nft', async () => {
                const basicNftNotOwned = await ethers.getContract('BasicNFT')
                await basicNftNotOwned.connect(deployer)
                await basicNftNotOwned.mintNft()
                await expect(nftMarketplace.listItem(basicNft.address, 1, PRICE))
                    .to.be.revertedWithCustomError(nftMarketplace, 'NFTMarketplace__NotOwner')
            })

            it('updaes the nft listing correctly', async () => {
                await nftMarketplace.listItem(basicNft.address, 0, PRICE)
                const nftListing = await nftMarketplace.getListing(basicNft.address, 0)
                assert.equal(nftListing.price.toString(), PRICE.toString())
                assert.equal(nftListing.seller, player.address)
            })

            it('emits an event after items is listed', async () => {
                await expect(nftMarketplace.listItem(basicNft.address, 0, PRICE))
                    .to.emit(nftMarketplace, 'ItemListed')
                    .withArgs(player.address, basicNft.address, 0, PRICE)
            })
        })

        describe('buyItem', () => {
            let nftMarketplaceContract, nftMarketPlaceBuyer
            beforeEach(async () => {
                await nftMarketplace.listItem(basicNft.address, 0, PRICE)
                nftMarketplaceContract = await ethers.getContract('NFTMarketplace')
                nftMarketPlaceBuyer = nftMarketplaceContract.connect(deployer)
            })

            it('reverts if nft is not listed', async () => {
                await expect(nftMarketplace.buyItem(basicNft.address, 3))
                    .to.be.revertedWithCustomError(nftMarketplace, 'NFTMarketplace__NotListed')
                    .withArgs(basicNft.address, 3)
            })

            it('reverts if nft price is not met', async () => {
                await expect(nftMarketplace.buyItem(basicNft.address, 0))
                    .to.be.revertedWithCustomError(nftMarketplace, 'NFTMarketplace__PriceNotMet')
                    .withArgs(basicNft.address, 0, PRICE)
            })

            it('updates the seller proceeds and listings mapping correctly', async () => {
                await nftMarketPlaceBuyer.buyItem(basicNft.address, 0, { value: PRICE })
                const proceeds = await nftMarketplace.getProceeds(player.address)
                const nftListing = await nftMarketplace.getListing(basicNft.address, 0)
                assert.equal(proceeds.toString(), PRICE.toString())
                assert.equal(nftListing.price, 0)
                assert.equal(nftListing.seller.toString(), ethers.constants.AddressZero)
            })

            it('transfers nft from seller to buyer', async () => {
                await nftMarketPlaceBuyer.buyItem(basicNft.address, 0, { value: PRICE })
                const nftOwner = await basicNft.ownerOf(0)
                assert.equal(nftOwner, deployer.address)
            })

            it('emits an event after the nft is bought', async () => {
                await expect(nftMarketPlaceBuyer.buyItem(basicNft.address, 0, { value: PRICE }))
                    .to.emit(nftMarketplace, 'ItemBought')
                    .withArgs(deployer.address, basicNft.address, 0, PRICE)
            })
        })

        describe('cancelListing', () => {
            beforeEach(async () => {
                await nftMarketplace.listItem(basicNft.address, 0, PRICE)
            })

            it('reverts if the function is not called by the nft owner', async () => {
                const nftMarketplaceContract = await ethers.getContract('NFTMarketplace')
                const nftMarketplaceNotOwner = nftMarketplaceContract.connect(deployer)
                await expect(nftMarketplaceNotOwner.cancelListing(basicNft.address, 0))
                    .to.be.revertedWithCustomError(nftMarketplace, 'NFTMarketplace__NotOwner')
            })

            it('reverts if nft is not previously listed', async () => {
                await basicNft.mintNft()
                await expect(nftMarketplace.cancelListing(basicNft.address, 1))
                    .to.be.revertedWithCustomError(nftMarketplace, 'NFTMarketplace__NotListed')
                    .withArgs(basicNft.address, 1)
            })

            it('removes the listing from the marketplace', async () => {
                await nftMarketplace.cancelListing(basicNft.address, 0)
                const nftListing = await nftMarketplace.getListing(basicNft.address, 0)
                assert.equal(nftListing.seller.toString(), ethers.constants.AddressZero)
                assert.equal(nftListing.price, 0)
            })

            it('emits an event after the nft was removed from listings', async () => {
                await expect(nftMarketplace.cancelListing(basicNft.address, 0))
                    .to.emit(nftMarketplace, 'ItemCanceled')
                    .withArgs(player.address, basicNft.address, 0)
            })
        })

        describe('updateListing', () => {
            const NEW_PRICE = ethers.utils.parseEther('5')

            beforeEach(async () => {
                await nftMarketplace.listItem(basicNft.address, 0, PRICE)
            })

            it('reverts if the nft is not already listed', async () => {
                await basicNft.mintNft()
                await expect(nftMarketplace.updateListing(basicNft.address, 1, NEW_PRICE))
                    .to.be.revertedWithCustomError(nftMarketplace, 'NFTMarketplace__NotListed')
                    .withArgs(basicNft.address, 1)
            })

            it('reverts if the caller does not own the nft', async () => {
                const nftMarketplaceContract = await ethers.getContract('NFTMarketplace')
                const nftMarketPlaceBuyer = nftMarketplaceContract.connect(deployer)
                await expect(nftMarketPlaceBuyer.updateListing(basicNft.address, 0, NEW_PRICE))
                    .to.be.revertedWithCustomError(nftMarketplace, 'NFTMarketplace__NotOwner')
            })

            it('updates the listing correctly to adjust for the new price', async () => {
                await nftMarketplace.updateListing(basicNft.address, 0, NEW_PRICE)
                const nftListing = await nftMarketplace.getListing(basicNft.address, 0)
                assert.equal(nftListing.price.toString(), NEW_PRICE.toString())
            })

            it('emits an event after the nft listing was updated', async () => {
                await expect(nftMarketplace.updateListing(basicNft.address, 0, NEW_PRICE))
                    .to.emit(nftMarketplace, 'ItemListed')
                    .withArgs(player.address, basicNft.address, 0, NEW_PRICE)
            })
        })

        describe('withdrawProceeds', () => {
            let nftMarketplaceBuyer
            beforeEach(async () => {
                const nftMarketplaceContract = await ethers.getContract('NFTMarketplace')
                nftMarketplaceBuyer = nftMarketplaceContract.connect(deployer)
                await nftMarketplace.listItem(basicNft.address, 0, PRICE)
            })

            it('reverts if the user has no proceeds', async () => {
                await expect(nftMarketplace.withdrawProceeds())
                    .to.be.revertedWithCustomError(nftMarketplace, 'NFTMarketplace__NoProceeds')
            })

            it('resets the proceeds of withdrawer to zero and transfers money to his account', async () => {
                const balanceBeforeSale = await player.getBalance()
                await nftMarketplaceBuyer.buyItem(basicNft.address, 0, { value: PRICE })
                const proceedsBefore = await nftMarketplace.getProceeds(player.address)
                assert.equal(proceedsBefore.toString(), PRICE.toString())
                const txResponse = await nftMarketplace.withdrawProceeds()
                const txReceipt = await txResponse.wait(1)
                const { gasUsed, effectiveGasPrice } = txReceipt
                const gasCost = gasUsed.mul(effectiveGasPrice)
                const balanceAfterSale = await player.getBalance()
                const proceedsAfter = await nftMarketplace.getProceeds(player.address)
                assert.equal(proceedsAfter, 0)
                assert.equal(balanceBeforeSale.add(PRICE).toString(), balanceAfterSale.add(gasCost).toString())
            })
        })
    }) 