const { expect } = require('chai');
const { expectEvent, BN } = require('@openzeppelin/test-helpers');

const { ETH_RESERVE_ADDRESS } = require('./helpers/Constants');

const ContractRegistry = artifacts.require('ContractRegistry');
const DynamicLiquidTokenConverterFactory = artifacts.require('TestDynamicLiquidTokenConverterFactory');
const DynamicLiquidTokenConverter = artifacts.require('DynamicLiquidTokenConverter');
const DSToken = artifacts.require('DSToken');

contract('DynamicLiquidTokenConverterFactory', accounts => {
    let contractRegistry;
    let factory;
    let anchor;
    const owner = accounts[0];
    // XXX const nonOwner = accounts[1];

    const MAX_CONVERSION_FEE = new BN(10000);

    before(async () => {
        contractRegistry = await ContractRegistry.new();
    });

    describe('createToken', () => {
        beforeEach(async () => {
            factory = await DynamicLiquidTokenConverterFactory.new();
        });

        it('should create token with ETH reserve', async () => {
            const reserveWeight = new BN('910000');
            const reserveBalance = new BN('100000009');
            const marketCapThreshold = new BN('10000001');
            const minimumWeight = new BN('20000');
            const initialSupply = new BN('21000000000000000000000');
            const stepWeight = new BN('30000');

            const res = await factory.createToken(
                'tokeen',
                'TKEN',
                18,
                initialSupply,
                ETH_RESERVE_ADDRESS,
                reserveWeight,
                reserveBalance,
                contractRegistry.address,
                MAX_CONVERSION_FEE,
                minimumWeight,
                stepWeight,
                marketCapThreshold,
                { value: reserveBalance }
            );

            const tokenAddress = await factory.createdToken.call();

            const token = await DSToken.at(tokenAddress);
            const converter = await DynamicLiquidTokenConverter.at(await token.owner.call());

            const reserveTokenAddress = await converter.reserveTokens.call(0);
            const reserve = await converter.reserves.call(reserveTokenAddress);

            expect(await token.name.call(), 'incorrect token name').to.be.eql('tokeen');
            expect(await token.symbol.call(), 'incorrect token symbol').to.be.eql('TKEN');
            expect(await token.decimals.call(), 'incorrect number of decimals').to.be.bignumber.equal('18');
            expect(await token.balanceOf.call(owner), 'incorrect initial supply').to.be.bignumber.equal(initialSupply);

            expect(reserveTokenAddress, 'incorrect reserve address').to.be.eql(ETH_RESERVE_ADDRESS);
            expect(reserve.weight, 'incorrect reserve weight').to.be.bignumber.equal(reserveWeight);
            expect(reserve.balance, 'incorrect reserve balance').to.be.bignumber.equal(reserveBalance);
            expect(await converter.anchor.call(), 'incorrect anchor').to.be.eql(token.address);
            expect(await converter.maxConversionFee.call(), 'incorrect maxConversionFee').to.be.bignumber.equal(MAX_CONVERSION_FEE);
            expect(await converter.registry.call(), 'incorrect registry').to.be.eql(contractRegistry.address);
            expect(await converter.owner.call(), 'incorrect owner').to.be.eql(factory.address);
            expect(await converter.newOwner.call(), 'incorrect new owner').to.be.eql(owner);

            expect(await converter.marketCapThreshold.call(), 'incorrect marketCapThreshold').to.be.bignumber.equal(marketCapThreshold);
            expect(await converter.minimumWeight.call(), 'incorrect minimumWeight').to.be.bignumber.equal(minimumWeight);
            expect(await converter.stepWeight.call(), 'incorrect stepWeight').to.be.bignumber.equal(stepWeight);

            expectEvent(res, 'NewConverter', { _converter: converter.address, _owner: owner });
            expectEvent(res, 'NewToken', { _token: token.address });
        });

        it('should create token with ERC20 reserve', async () => {
            const reserveToken = await DSToken.new('Token1', 'TKN1', 18);
            reserveToken.issue(owner, 100000009);

            const reserveWeight = new BN('910000');
            const reserveBalance = new BN('100000009');
            const marketCapThreshold = new BN('10000001');
            const minimumWeight = new BN('20000');
            const stepWeight = new BN('30000');
            const initialSupply = new BN('21000000000000000000000');

            await reserveToken.approve(factory.address, reserveBalance);

            const res = await factory.createToken(
                'tokeen',
                'TKEN',
                18,
                initialSupply,
                reserveToken.address,
                reserveWeight,
                reserveBalance,
                contractRegistry.address,
                MAX_CONVERSION_FEE,
                minimumWeight,
                stepWeight,
                marketCapThreshold
            );

            const tokenAddress = await factory.createdToken.call();

            const token = await DSToken.at(tokenAddress);
            const converter = await DynamicLiquidTokenConverter.at(await token.owner.call());

            const reserveTokenAddress = await converter.reserveTokens.call(0);
            const reserve = await converter.reserves.call(reserveTokenAddress);

            expect(await token.name.call(), 'incorrect token name').to.be.eql('tokeen');
            expect(await token.symbol.call(), 'incorrect token symbol').to.be.eql('TKEN');
            expect(await token.decimals.call(), 'incorrect number of decimals').to.be.bignumber.equal('18');
            expect(await token.balanceOf.call(owner), 'incorrect initial supply').to.be.bignumber.equal(initialSupply);

            expect(reserveTokenAddress, 'incorrect reserve address').to.be.eql(reserveToken.address);
            expect(reserve.weight, 'incorrect reserve weight').to.be.bignumber.equal(reserveWeight);
            expect(reserve.balance, 'incorrect reserve balance').to.be.bignumber.equal(reserveBalance);
            expect(await converter.anchor.call(), 'incorrect anchor').to.be.eql(token.address);
            expect(await converter.maxConversionFee.call(), 'incorrect maxConversionFee').to.be.bignumber.equal(MAX_CONVERSION_FEE);
            expect(await converter.registry.call(), 'incorrect registry').to.be.eql(contractRegistry.address);
            expect(await converter.owner.call(), 'incorrect owner').to.be.eql(factory.address);
            expect(await converter.newOwner.call(), 'incorrect new owner').to.be.eql(owner);

            expect(await converter.marketCapThreshold.call(), 'incorrect marketCapThreshold').to.be.bignumber.equal(marketCapThreshold);
            expect(await converter.minimumWeight.call(), 'incorrect minimumWeight').to.be.bignumber.equal(minimumWeight);
            expect(await converter.stepWeight.call(), 'incorrect stepWeight').to.be.bignumber.equal(stepWeight);

            expectEvent(res, 'NewConverter', { _converter: converter.address, _owner: owner });
            expectEvent(res, 'NewToken', { _token: token.address });
        });
    });

    describe('createConverter', () => {
        beforeEach(async () => {
            factory = await DynamicLiquidTokenConverterFactory.new();
            anchor = await DSToken.new('Token1', 'TKN1', 2);
            anchor.transferOwnership(factory.address);
        });

        it('should create converter with ETH reserve', async () => {
            const reserveWeight = new BN('910000');
            const reserveBalance = new BN('100000009');
            const marketCapThreshold = new BN('10000001');
            const minimumWeight = new BN('20000');
            const stepWeight = new BN('30000');

            const res = await factory.createConverter(
                anchor.address,
                ETH_RESERVE_ADDRESS,
                reserveWeight,
                reserveBalance,
                contractRegistry.address,
                MAX_CONVERSION_FEE,
                minimumWeight,
                stepWeight,
                marketCapThreshold,
                { value: reserveBalance }
            );

            const converterAddress = await factory.createdConverter.call();

            const converter = await DynamicLiquidTokenConverter.at(converterAddress);

            const reserveTokenAddress = await converter.reserveTokens.call(0);
            const reserve = await converter.reserves.call(reserveTokenAddress);

            expect(reserveTokenAddress, 'incorrect reserve address').to.be.eql(ETH_RESERVE_ADDRESS);
            expect(reserve.weight, 'incorrect reserve weight').to.be.bignumber.equal(reserveWeight);
            expect(reserve.balance, 'incorrect reserve balance').to.be.bignumber.equal(reserveBalance);
            expect(await converter.anchor.call(), 'incorrect anchor').to.be.eql(anchor.address);
            expect(await converter.maxConversionFee.call(), 'incorrect maxConversionFee').to.be.bignumber.equal(MAX_CONVERSION_FEE);
            expect(await converter.registry.call(), 'incorrect registry').to.be.eql(contractRegistry.address);
            expect(await converter.owner.call(), 'incorrect owner').to.be.eql(factory.address);
            expect(await converter.newOwner.call(), 'incorrect new owner').to.be.eql(owner);

            expect(await converter.marketCapThreshold.call(), 'incorrect marketCapThreshold').to.be.bignumber.equal(marketCapThreshold);
            expect(await converter.minimumWeight.call(), 'incorrect minimumWeight').to.be.bignumber.equal(minimumWeight);
            expect(await converter.stepWeight.call(), 'incorrect stepWeight').to.be.bignumber.equal(stepWeight);

            expectEvent(res, 'NewConverter', { _converter: converter.address, _owner: owner });
        });

        it('should create converter with ERC20 reserve', async () => {
            const reserveToken = await DSToken.new('Token1', 'TKN1', 18);
            reserveToken.issue(owner, 10000);

            const reserveWeight = new BN('910000');
            const reserveBalance = new BN('10000');
            const marketCapThreshold = new BN('10000001');
            const minimumWeight = new BN('20000');
            const stepWeight = new BN('30000');

            await reserveToken.approve(factory.address, reserveBalance);

            const res = await factory.createConverter(
                anchor.address,
                reserveToken.address,
                reserveWeight,
                reserveBalance,
                contractRegistry.address,
                MAX_CONVERSION_FEE,
                minimumWeight,
                stepWeight,
                marketCapThreshold
            );

            const converterAddress = await factory.createdConverter.call();

            const converter = await DynamicLiquidTokenConverter.at(converterAddress);

            const reserveTokenAddress = await converter.reserveTokens.call(0);
            const reserve = await converter.reserves.call(reserveTokenAddress);

            expect(reserveTokenAddress, 'incorrect reserve address').to.be.eql(reserveToken.address);
            expect(reserve.weight, 'incorrect reserve weight').to.be.bignumber.equal(reserveWeight);
            expect(reserve.balance, 'incorrect reserve balance').to.be.bignumber.equal(reserveBalance);
            expect(await converter.anchor.call(), 'incorrect anchor').to.be.eql(anchor.address);
            expect(await converter.maxConversionFee.call(), 'incorrect maxConversionFee').to.be.bignumber.equal(MAX_CONVERSION_FEE);
            expect(await converter.registry.call(), 'incorrect registry').to.be.eql(contractRegistry.address);
            expect(await converter.owner.call(), 'incorrect owner').to.be.eql(factory.address);
            expect(await converter.newOwner.call(), 'incorrect new owner').to.be.eql(owner);

            expect(await converter.marketCapThreshold.call(), 'incorrect marketCapThreshold').to.be.bignumber.equal(marketCapThreshold);
            expect(await converter.minimumWeight.call(), 'incorrect minimumWeight').to.be.bignumber.equal(minimumWeight);
            expect(await converter.stepWeight.call(), 'incorrect stepWeight').to.be.bignumber.equal(stepWeight);

            expectEvent(res, 'NewConverter', { _converter: converter.address, _owner: owner });
        });

        it('transfers anchor ownership to converter', async () => {
            const reserveWeight = new BN('910000');
            const reserveBalance = new BN('100000009');
            const marketCapThreshold = new BN('10000001');
            const minimumWeight = new BN('20000');
            const stepWeight = new BN('30000');

            await factory.createConverter(
                anchor.address,
                ETH_RESERVE_ADDRESS,
                reserveWeight,
                reserveBalance,
                contractRegistry.address,
                MAX_CONVERSION_FEE,
                minimumWeight,
                stepWeight,
                marketCapThreshold,
                { value: reserveBalance }
            );

            const converterAddress = await factory.createdConverter.call();

            expect(await anchor.owner.call(), 'incorrect anchor owner').to.be.eql(converterAddress);
        });
    });
});
