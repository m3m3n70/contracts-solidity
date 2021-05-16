// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.6.12;
import "./DynamicLiquidTokenConverter.sol";
import "../../../token/interfaces/IDSToken.sol";
import "../../../utility/TokenHolder.sol";
import "../../interfaces/ITypedConverterFactory.sol";
import "../../../token/DSToken.sol";

/*
    DynamicLiquidTokenConverter Factory
*/
contract DynamicLiquidTokenConverterFactory is ITypedConverterFactory {
    IERC20Token internal constant ETH_RESERVE_ADDRESS = IERC20Token(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);
    event NewConverter(DynamicLiquidTokenConverter indexed _converter, address indexed _owner);
    
    function converterType() public pure override returns (uint16) {
        return 3;
    }

    /**
      * @dev creates a new converter with the given arguments and transfers
      * the ownership to the caller
      *
      * @param _anchor            anchor governed by the converter
      * @param _registry          address of a contract registry contract
      * @param _maxConversionFee  maximum conversion fee, represented in ppm
      *
      * @return a new converter
    */
    function createConverter(IConverterAnchor _anchor, IContractRegistry _registry, uint32 _maxConversionFee) external override virtual returns (IConverter) {
        IConverter converter = new DynamicLiquidTokenConverter(IDSToken(address(_anchor)), _registry, _maxConversionFee);
        converter.transferOwnership(msg.sender);
        return converter;
    }
}
