// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.6.12;
import "../converter/types/liquid-token/DynamicLiquidTokenConverterFactory.sol";

/*
    Utils test helper that exposes the converter factory functions
*/
contract TestDynamicLiquidTokenConverterFactory is DynamicLiquidTokenConverterFactory {
    DynamicLiquidTokenConverter public createdConverter;

    function createConverter(
      IConverterAnchor _anchor,
      IERC20Token _reserve,
      uint32 _reserveWeight,
      uint256 _reserveBalance,
      IContractRegistry _registry,
      uint32 _maxConversionFee,
      uint32 _minimumWeight,
      uint32 _stepWeight,
      uint256 _marketCapThreshold
    )
    public
    payable
    override
    returns (DynamicLiquidTokenConverter)
    {
        createdConverter = super.createConverter(
          _anchor,
          _reserve,
          _reserveWeight,
          _reserveBalance,
          _registry,
          _maxConversionFee,
          _minimumWeight,
          _stepWeight,
          _marketCapThreshold
        );
        return createdConverter;
    }
}
