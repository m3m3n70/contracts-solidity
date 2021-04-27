const { expect } = require('chai');
const { BN } = require('@openzeppelin/test-helpers');
const Decimal = require('decimal.js');
const MathUtils = require('./helpers/MathUtils');

const MathContract = artifacts.require('TestMath');

const MAX_UINT256 = Decimal(2).pow(256).sub(1);
const SCALES = [6, 18, 30].map(n => Decimal(10).pow(n));

contract('Math', accounts => {
    before(async () => {
        mathContract = await MathContract.new();
    });

    for (let n = 1; n <= 256; n++) {
        for (const k of n < 256 ? [-1, 0, +1] : [-1]) {
            const x = new BN(2).pow(new BN(n)).add(new BN(k));
            it(`Function floorSqrt(0x${x.toString(16)})`, async () => {
                const expected = MathUtils.floorSqrt(x);
                const actual = await mathContract.floorSqrtTest(x);
                expect(actual).to.be.bignumber.equal(expected);
            });
        }
    }

    for (const scale of SCALES) {
        for (let a = 0; a < 10; a++) {
            for (let b = 1; b <= 10; b++) {
                it(`reducedRatio(${a}, ${b}, ${scale.toFixed()})`, async () => {
                    const expected = MathUtils.reducedRatio(a, b, scale);
                    const actual = await mathContract.reducedRatioTest(a, b, scale.toFixed());
                    expect(actual[0]).to.be.bignumber.equal(expected[0]);
                    expect(actual[1]).to.be.bignumber.equal(expected[1]);
                });
            }
        }
    }

    for (const scale of SCALES) {
        for (let i = Decimal(1); i.lte(scale); i = i.mul(10)) {
            const a = MAX_UINT256.divToInt(scale).mul(i).add(1);
            for (let j = Decimal(1); j.lte(scale); j = j.mul(10)) {
                const b = MAX_UINT256.divToInt(scale).mul(j).add(1);
                it(`reducedRatio(${a.toFixed()}, ${b.toFixed()}, ${scale.toFixed()})`, async () => {
                    const expected = MathUtils.reducedRatio(a, b, scale);
                    const actual = await mathContract.reducedRatioTest(a.toFixed(), b.toFixed(), scale.toFixed());
                    expect(actual[0]).to.be.bignumber.equal(expected[0]);
                    expect(actual[1]).to.be.bignumber.equal(expected[1]);
                });
            }
        }
    }

    for (const scale of SCALES) {
        for (let a = 0; a < 10; a++) {
            for (let b = 1; b <= 10; b++) {
                it(`normalizedRatio(${a}, ${b}, ${scale.toFixed()})`, async () => {
                    const expected = MathUtils.normalizedRatio(a, b, scale);
                    const actual = await mathContract.normalizedRatioTest(a, b, scale.toFixed());
                    expect(actual[0]).to.be.bignumber.equal(expected[0]);
                    expect(actual[1]).to.be.bignumber.equal(expected[1]);
                });
            }
        }
    }

    for (const scale of SCALES) {
        for (let i = Decimal(1); i.lte(scale); i = i.mul(10)) {
            const a = MAX_UINT256.divToInt(scale).mul(i).add(1);
            for (let j = Decimal(1); j.lte(scale); j = j.mul(10)) {
                const b = MAX_UINT256.divToInt(scale).mul(j).add(1);
                it(`normalizedRatio(${a.toFixed()}, ${b.toFixed()}, ${scale.toFixed()})`, async () => {
                    const expected = MathUtils.normalizedRatio(a, b, scale);
                    const actual = await mathContract.normalizedRatioTest(a.toFixed(), b.toFixed(), scale.toFixed());
                    expect(actual[0]).to.be.bignumber.equal(expected[0]);
                    expect(actual[1]).to.be.bignumber.equal(expected[1]);
                });
            }
        }
    }

    for (const scale of SCALES) {
        for (let a = 0; a < 10; a++) {
            for (let b = Math.max(a, 1); b <= 10; b++) {
                it(`accurateRatio(${a}, ${b}, ${scale.toFixed()})`, async () => {
                    const expected = MathUtils.accurateRatio(a, b, scale);
                    const actual = await mathContract.accurateRatioTest(a, b, scale.toFixed());
                    expect(actual[0]).to.be.bignumber.equal(expected[0]);
                    expect(actual[1]).to.be.bignumber.equal(expected[1]);
                });
            }
        }
    }

    for (const scale of SCALES) {
        for (let i = Decimal(1); i.lte(scale); i = i.mul(10)) {
            const a = MAX_UINT256.divToInt(scale).mul(i).add(1);
            for (let j = Decimal(1); j.lte(scale); j = j.mul(10)) {
                const b = MAX_UINT256.divToInt(scale).mul(j).add(1);
                it(`accurateRatio(${a.toFixed()}, ${b.toFixed()}, ${scale.toFixed()})`, async () => {
                    const expected = MathUtils.accurateRatio(a, b, scale);
                    const actual = await mathContract.accurateRatioTest(a.toFixed(), b.toFixed(), scale.toFixed());
                    expect(actual[0]).to.be.bignumber.equal(expected[0]);
                    expect(actual[1]).to.be.bignumber.equal(expected[1]);
                });
            }
        }
    }

    for (let n = 0; n < 10; n++) {
        for (let d = 1; d <= 10; d++) {
            it(`roundDiv(${n}, ${d})`, async () => {
                const expected = MathUtils.roundDiv(n, d);
                const actual = await mathContract.roundDivTest(n, d);
                expect(actual).to.be.bignumber.equal(expected);
            });
        }
    }
});
