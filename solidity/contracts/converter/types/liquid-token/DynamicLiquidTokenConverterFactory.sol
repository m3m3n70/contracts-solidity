// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.6.12;
import "./DynamicLiquidTokenConverter.sol";
import "../../../token/interfaces/IDSToken.sol";

/*
    DynamicLiquidTokenConverter Factory
*/
contract DynamicLiquidTokenConverterFactory {
    IERC20Token internal constant ETH_RESERVE_ADDRESS = IERC20Token(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);
    event NewConverter(DynamicLiquidTokenConverter indexed _converter, address indexed _owner);

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
    function createConverter(
      IConverterAnchor _anchor,
      IERC20Token _reserveToken,
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
      virtual
      returns (DynamicLiquidTokenConverter)
    {
        _anchor.acceptOwnership();

        DynamicLiquidTokenConverter converter = new DynamicLiquidTokenConverter(IDSToken(address(_anchor)), _registry, _maxConversionFee);

        require(_reserveToken == ETH_RESERVE_ADDRESS ? msg.value == _reserveBalance : msg.value == 0, "ERR_ETH_AMOUNT_MISMATCH");

        converter.addReserve(_reserveToken, _reserveWeight);

        address(converter).transfer(msg.value);

        converter.setMinimumWeight(_minimumWeight);
        converter.setStepWeight(_stepWeight);
        converter.setMarketCapThreshold(_marketCapThreshold);

        _anchor.transferOwnership(address(converter));
        converter.acceptAnchorOwnership();

        converter.transferOwnership(msg.sender);

        emit NewConverter(converter, msg.sender);

        return converter;
    }
}
