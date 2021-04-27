const { expect } = require('chai');
const { expectRevert, expectEvent, constants, BN, balance } = require('@openzeppelin/test-helpers');

const { ETH_RESERVE_ADDRESS, registry } = require('./helpers/Constants');
const { ZERO_ADDRESS } = constants;

const BancorNetwork = artifacts.require('BancorNetwork');
const DynamicLiquidTokenConverter = artifacts.require('DynamicLiquidTokenConverter');
const LiquidTokenConverterFactory = artifacts.require('LiquidTokenConverterFactory');
const DSToken = artifacts.require('DSToken');
const BancorFormula = artifacts.require('BancorFormula');
const ContractRegistry = artifacts.require('ContractRegistry');
const ERC20Token = artifacts.require('ERC20Token');
const ConverterFactory = artifacts.require('ConverterFactory');
const ConverterUpgrader = artifacts.require('ConverterUpgrader');

contract('DynamicLiquidTokenConverter', accounts => {
    const MIN_RETURN = new BN(1);
    const WEIGHT_20_PERCENT = new BN(200000);
    const WEIGHT_25_PERCENT = new BN(250000);
    const WEIGHT_100_PERCENT = new BN(1000000);

    const createConverter = async (tokenAddress, registryAddress = contractRegistry.address, maxConversionFee = 0) => {
        return DynamicLiquidTokenConverter.new(tokenAddress, registryAddress, maxConversionFee);
    };

    const initConverter = async (activate, isETHReserve, maxConversionFee = 0) => {
        let params = {
            activate: true,
            isETHReserve: false,
            maxConversionFee: 0,
            initialReserveBalance: new BN(5000),
            initialReserveWeight: WEIGHT_25_PERCENT
        };

        if (typeof activate === 'boolean') {
            params = { ...params, activate, isETHReserve, maxConversionFee };
        }
        else {
            params = { ...params, ...activate };
        }

        token = await DSToken.new('Token1', 'TKN1', 2);
        tokenAddress = token.address;

        const converter = await createConverter(tokenAddress, contractRegistry.address, params.maxConversionFee);
        await converter.addReserve(getReserve1Address(params.isETHReserve), params.initialReserveWeight);
        await token.issue(sender, 20000);

        if (params.isETHReserve) {
            await converter.send(params.initialReserveBalance);
        }
        else {
            await reserveToken.transfer(converter.address, params.initialReserveBalance);
        }

        if (params.marketCapThreshold) {
            await converter.setMarketCapThreshold(params.marketCapThreshold);
        }

        if (params.activate) {
            await token.transferOwnership(converter.address);
            await converter.acceptTokenOwnership();
        }

        return converter;
    };

    const getReserve1Address = (isETH) => {
        return isETH ? ETH_RESERVE_ADDRESS : reserveToken.address;
    };

    const getBalance = async (token, address, account) => {
        if (address === ETH_RESERVE_ADDRESS) {
            return balance.current(account);
        }

        return token.balanceOf.call(account);
    };

    const getTransactionCost = async (txResult) => {
        const transaction = await web3.eth.getTransaction(txResult.tx);
        return new BN(transaction.gasPrice).mul(new BN(txResult.receipt.cumulativeGasUsed));
    };

    const convert = async (path, amount, minReturn, options = {}) => {
        return bancorNetwork.convertByPath(path, amount, minReturn, ZERO_ADDRESS, ZERO_ADDRESS, 0,
            { from: sender, ...options });
    };

    let bancorNetwork;
    let token;
    let tokenAddress;
    let contractRegistry;
    let reserveToken;
    let upgrader;
    const sender = accounts[0];

    before(async () => {
        // The following contracts are unaffected by the underlying tests, this can be shared.
        contractRegistry = await ContractRegistry.new();

        const bancorFormula = await BancorFormula.new();
        await bancorFormula.init();
        await contractRegistry.registerAddress(registry.BANCOR_FORMULA, bancorFormula.address);

        const factory = await ConverterFactory.new();
        await contractRegistry.registerAddress(registry.CONVERTER_FACTORY, factory.address);

        await factory.registerTypedConverterFactory((await LiquidTokenConverterFactory.new()).address);
    });

    beforeEach(async () => {
        bancorNetwork = await BancorNetwork.new(contractRegistry.address);
        await contractRegistry.registerAddress(registry.BANCOR_NETWORK, bancorNetwork.address);

        upgrader = await ConverterUpgrader.new(contractRegistry.address, ZERO_ADDRESS);
        await contractRegistry.registerAddress(registry.CONVERTER_UPGRADER, upgrader.address);

        const token = await DSToken.new('Token1', 'TKN1', 2);
        tokenAddress = token.address;

        reserveToken = await ERC20Token.new('ERC Token 1', 'ERC1', 18, 1000000000);
    });

    it('should revert when attempting to set the market cap threshold while the converter is active', async () => {
        const converter = await initConverter(true, false);

        await expectRevert(converter.setMarketCapThreshold(new BN(10000)), 'ERR_ACTIVE');
    });

    it('should revert when attempting to set the minimum weight while the converter is active', async () => {
        const converter = await initConverter(true, false);

        await expectRevert(converter.setMinimumWeight(WEIGHT_20_PERCENT), 'ERR_ACTIVE');
    });

    it('should revert when attempting to set the step weight while the converter is active', async () => {
        const converter = await initConverter(true, false);

        await expectRevert(converter.setStepWeight(new BN(10000)), 'ERR_ACTIVE');
    });

    it('should revert when attempting to set the laste weight adjustment market cap while the converter is active', async () => {
        const converter = await initConverter(true, false);

        await expectRevert(converter.setLastWeightAdjustmentMarketCap(new BN(10000)), 'ERR_ACTIVE');
    });

    [false, true].forEach((isETHReserve) => {
        describe(`reduceWeight ${isETHReserve ? '(with ERC20 reserve)' : '(with ETH reserve)'}:`, () => {
            const INITIAL_THRESHOLD_AMOUNT = new BN(10000); // threshold at 100% weight

            const ONE = new BN(1);
            const STEP_WEIGHT = new BN(10000);

            const getConverter = async (params = {}) => await initConverter({
                activate: true,
                isETHReserve,
                initialReserveWeight: WEIGHT_100_PERCENT,
                initialReserveBalance: INITIAL_THRESHOLD_AMOUNT.add(ONE),
                marketCapThreshold: INITIAL_THRESHOLD_AMOUNT,
                ...params
            });

            const getReserveAddress = () => getReserve1Address(isETHReserve);
            const findStepPercentageOf = (value) => value.mul(STEP_WEIGHT).div(WEIGHT_100_PERCENT);
            const reduceByStepPercentage = (value) => value.sub(findStepPercentageOf(value));

            const increaseReserveBalance = async (amount) => {
                const reserveAddress = getReserveAddress();

                if (isETHReserve) {
                    return await convert([reserveAddress, tokenAddress, tokenAddress], amount, MIN_RETURN, { value: amount });
                }

                await reserveToken.approve(bancorNetwork.address, amount, { from: sender });

                return await convert([reserveAddress, tokenAddress, tokenAddress], amount, MIN_RETURN);
            };

            it('updates reserve ratio when changing reserve weight', async () => {
                const converter = await getConverter();

                await converter.reduceWeight(getReserveAddress());

                const reserveRatio = await converter.reserveRatio.call();

                expect(reserveRatio).to.be.bignumber.equal(WEIGHT_100_PERCENT.sub(new BN(10000)));
            });

            it('fires event when changing reserve weight', async () => {
                const initialReserveBalance = INITIAL_THRESHOLD_AMOUNT.add(ONE);

                const converter = await getConverter({ initialReserveBalance });

                const res = await converter.reduceWeight(getReserveAddress());

                expectEvent(res, 'ReserveTokenWeightUpdate', {
                    _prevWeight: WEIGHT_100_PERCENT,
                    _newWeight: WEIGHT_100_PERCENT.sub(STEP_WEIGHT),
                    _percentage: STEP_WEIGHT,
                    _balance: reduceByStepPercentage(initialReserveBalance)
                });
            });

            it('transfers correct percentage of reserve to owner when changing reserve weight', async () => {
                const initialReserveBalance = INITIAL_THRESHOLD_AMOUNT.add(ONE);

                const converter = await getConverter({ initialReserveBalance });

                const reserveTokenPrevBalance = await getBalance(reserveToken, getReserveAddress(), sender);

                const res = await converter.reduceWeight(getReserveAddress());

                const reserveTokenNewBalance = await getBalance(reserveToken, getReserveAddress(), sender);

                let expectedNewBalance = reserveTokenPrevBalance.add(findStepPercentageOf(initialReserveBalance));

                if (isETHReserve) {
                    expectedNewBalance = expectedNewBalance.sub(await getTransactionCost(res));
                }

                expect(reserveTokenNewBalance).to.be.bignumber.equal(expectedNewBalance);
            });

            it('reduces balance of reserve when changing reserve weight', async () => {
                const initialReserveBalance = INITIAL_THRESHOLD_AMOUNT.add(ONE);

                const converter = await getConverter({ initialReserveBalance });

                await converter.reduceWeight(getReserveAddress());

                const newBalance = await converter.reserveBalance(getReserveAddress());
                const balanceChange = findStepPercentageOf(initialReserveBalance);

                expect(newBalance).to.be.bignumber.equal(initialReserveBalance.sub(balanceChange));
            });

            it('updates reserve ratio once market cap has surpassed new threshold', async () => {
                const converter = await getConverter();

                await converter.reduceWeight(getReserveAddress());

                // amount is one more than threshold
                const amount = reduceByStepPercentage(INITIAL_THRESHOLD_AMOUNT).add(ONE);

                await increaseReserveBalance(amount);

                await converter.reduceWeight(getReserveAddress());

                const reserveRatio = await converter.reserveRatio.call();

                expect(reserveRatio).to.be.bignumber.equal(WEIGHT_100_PERCENT.sub(new BN(20000)));
            });

            it('should revert when market cap is not above threshold', async () => {
                const converter = await getConverter({ initialReserveBalance: INITIAL_THRESHOLD_AMOUNT });

                await expectRevert(converter.reduceWeight(getReserveAddress()), 'ERR_MARKET_CAP_BELOW_THRESHOLD');
            });

            it('should revert when market cap not increased by threshold between weight changes', async () => {
                const converter = await getConverter();

                await converter.reduceWeight(getReserveAddress());

                // amount exactly reaches threshold
                const amount = reduceByStepPercentage(INITIAL_THRESHOLD_AMOUNT);

                await increaseReserveBalance(amount);

                await expectRevert(converter.reduceWeight(getReserveAddress()), 'ERR_MARKET_CAP_BELOW_THRESHOLD');
            });

            it('should revert when attempting to reduce weight below minimum', async () => {
                const converter = await getConverter({
                    initialReserveWeight: new BN(30000) // initial weight is equal to minimum
                });

                await expectRevert(converter.reduceWeight(getReserveAddress()), 'ERR_INVALID_RESERVE_WEIGHT');
            });
        });
    });
});
