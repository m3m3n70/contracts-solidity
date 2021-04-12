pragma solidity 0.6.12;

import "./ConverterRegistry.sol";

contract DynamicConverterRegistry is ConverterRegistry {
    /**
      * @dev triggered when a converter anchor is added to the registry
      *
      * @param _anchor anchor token
    */
    event DynamicConverterAnchorAdded(IDynamicConverterAnchor indexed _anchor);

    /**
      * @dev triggered when a converter anchor is removed from the registry
      *
      * @param _anchor anchor token
    */
    event DynamicConverterAnchorRemoved(IDynamicConverterAnchor indexed _anchor);


}