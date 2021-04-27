// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.6.12;

import "../../../../token/interfaces/IERC20Token.sol";
import "../../../interfaces/IConverterBase.sol";

/**
  * @dev Liquid Token Converter
  *
  * The dynamic liquid token converter is a specialized version of a converter that manages a liquid token
  * and allows for a reduction in reserve weight within a predefined set of boundaries.
  *
  * The converters govern a token with a single reserve and allow converting between the two.
  * Liquid tokens usually have fractional reserve (reserve ratio smaller than 100%).
  * The weight can be reduced by the defined stepWeight any time the defined marketCapThreshold
  * has been reached.
*/
interface IDynamicLiquidTokenConverter is IConverterBase{

    /**
      * @dev returns the converter type
      *
      * @return see the converter types in the the main contract doc
    */
    function converterType() external pure override returns (uint16);

    /**
      * @dev updates the market cap threshold
      * can only be called by the owner while inactive
      * 
      * @param _marketCapThreshold new threshold
    */
    function setMarketCapThreshold(uint256 _marketCapThreshold) external;

    /**
      * @dev updates the current minimum weight
      * can only be called by the owner while inactive
      * 
      * @param _minimumWeight new minimum weight, represented in ppm
    */
    function setMinimumWeight(uint32 _minimumWeight) external;

    /**
      * @dev updates the current step weight
      * can only be called by the owner while inactive
      * 
      * @param _stepWeight new step weight, represented in ppm
    */
    function setStepWeight(uint32 _stepWeight) external;
    /**
      * @dev updates the current lastWeightAdjustmentMarketCap
      * can only be called by the owner while inactive
      * 
      * @param _lastWeightAdjustmentMarketCap new lastWeightAdjustmentMarketCap, represented in ppm
    */
    function setLastWeightAdjustmentMarketCap(uint256 _lastWeightAdjustmentMarketCap) external;

    /**
      * @dev updates the token reserve weight
      * can only be called by the owner
      * 
      * @param _reserveToken    address of the reserve token
    */
    function reduceWeight(IERC20Token _reserveToken) external;

    function getMarketCap(IERC20Token _reserveToken) external view returns(uint256);

    function minimumWeight() external view returns (uint32);
    function stepWeight() external view returns (uint32);
    function marketCapThreshold() external view returns (uint256);
    function lastWeightAdjustmentMarketCap() external view returns (uint256);
}
