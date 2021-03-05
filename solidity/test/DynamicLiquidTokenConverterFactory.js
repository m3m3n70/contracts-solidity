const { expect } = require('chai');
const { expectEvent, BN, balance } = require('@openzeppelin/test-helpers');

const { ETH_RESERVE_ADDRESS } = require('./helpers/Constants');

const ContractRegistry = artifacts.require('ContractRegistry');
const DynamicLiquidTokenConverterFactory = artifacts.require('TestDynamicLiquidTokenConverterFactory');
// const TypedConverterAnchorFactory = artifacts.require('TestTypedConverterAnchorFactory');
const DynamicLiquidTokenConverter = artifacts.require('DynamicLiquidTokenConverter');
const DSToken = artifacts.require('DSToken');

contract('DynamicLiquidTokenConverterFactory', accounts => {
    let contractRegistry;
    // let anchorFactory;
    let factory;
    let anchor;
    const owner = accounts[0];
    // const nonOwner = accounts[1];

    const MAX_CONVERSION_FEE = new BN(10000);

    before(async () => {
        // The following contracts are unaffected by the underlying tests, this can be shared.
        contractRegistry = await ContractRegistry.new();
    });

    beforeEach(async () => {
        // anchorFactory = await TypedConverterAnchorFactory.new('TypedAnchor');
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

        const reserveWeight = new BN('910000');
        const reserveBalance = new BN('0');
        const marketCapThreshold = new BN('10000001');
        const minimumWeight = new BN('20000');
        const stepWeight = new BN('30000');

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
