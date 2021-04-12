const fs = require('fs');
const path = require('path');

const truffleContract = require('@truffle/contract');

const { constants } = require('@openzeppelin/test-helpers');

const { ZERO_ADDRESS } = constants;

const Converter = artifacts.require('ConverterBase');
const LiquidTokenConverter = artifacts.require('LiquidTokenConverter');
const LiquidityPoolV1Converter = artifacts.require('LiquidityPoolV1Converter');
const LiquidityPoolV2Converter = artifacts.require('LiquidityPoolV2Converter');
const DynamicLiquidTokenConverter = artifacts.require('DynamicLiquidTokenConverter');

module.exports.new = async (type, tokenAddress, registryAddress, maxConversionFee, reserveTokenAddress, weight, version) => {
    if (version) {
        const abi = fs.readFileSync(path.resolve(__dirname, `../bin/converter_v${version}.abi`));
        const bin = fs.readFileSync(path.resolve(__dirname, `../bin/converter_v${version}.bin`));
        const converter = truffleContract({ abi: JSON.parse(abi), unlinked_binary: `0x${bin}` });
        const block = await web3.eth.getBlock('latest');
        converter.setProvider(web3.currentProvider);
        converter.defaults({ from: (await web3.eth.getAccounts())[0], gas: block.gasLimit });

        return converter.new(tokenAddress, registryAddress, maxConversionFee, reserveTokenAddress, weight);
    }

    const converterType = [LiquidTokenConverter, LiquidityPoolV1Converter, LiquidityPoolV2Converter, DynamicLiquidTokenConverter][type];
    const converter = await converterType.new(tokenAddress, registryAddress, maxConversionFee);
    if (reserveTokenAddress !== ZERO_ADDRESS) {
        await converter.addReserve(reserveTokenAddress, weight);
    }

    return converter;
};

module.exports.at = async (address, version) => {
    if (version) {
        const abi = fs.readFileSync(path.resolve(__dirname, `../bin/converter_v${version}.abi`));
        const converter = truffleContract({ abi: JSON.parse(abi) });
        return converter.at(address);
    }

    return Converter.at(address);
};
