// Some of this file is copied from:
// https://github.com/Synthetixio/js-monorepo/blob/master/packages/queries/src/queries/network/useEthGasPriceQuery.ts

import { wei } from '@synthetixio/wei';
import { ethers, BigNumber } from 'ethers';

import { NetworkId, NetworkIdByName } from 'sdk/types/common';

const MULTIPLIER = wei(2);

export const computeGasFee = (
	baseFeePerGas: BigNumber,
	maxPriorityFeePerGas: number
): {
	maxPriorityFeePerGas: BigNumber;
	maxFeePerGas: BigNumber;
	baseFeePerGas: BigNumber;
} => ({
	maxPriorityFeePerGas: wei(maxPriorityFeePerGas, 9).toBN(),
	maxFeePerGas: wei(baseFeePerGas, 9).mul(MULTIPLIER).add(wei(maxPriorityFeePerGas, 9)).toBN(),
	baseFeePerGas: baseFeePerGas,
});

export const getGasPriceFromProvider = async (provider: ethers.providers.Provider) => {
	try {
		const gasPrice = await provider.getGasPrice();
		return {
			fastest: { gasPrice },
			fast: { gasPrice },
			average: { gasPrice },
		};
	} catch (e) {
		throw new Error('Could not retrieve gas price from provider');
	}
};

// This is mostly copied over from the Synthetix queries.
// See: https://github.com/Synthetixio/js-monorepo/blob/master/packages/queries/src/queries/network/useEthGasPriceQuery.ts
export const getEthGasPrice = async (networkId: NetworkId, provider: ethers.providers.Provider) => {
	try {
		// If network is Mainnet then we use EIP1559
		if (networkId === NetworkIdByName.mainnet) {
			const block = await provider.getBlock('latest');
			if (block?.baseFeePerGas) {
				return {
					fastest: computeGasFee(block.baseFeePerGas, 6),
					fast: computeGasFee(block.baseFeePerGas, 4),
					average: computeGasFee(block.baseFeePerGas, 2),
				};
			}
		}

		return getGasPriceFromProvider(provider);
	} catch (e) {
		throw new Error(`Could not fetch and compute network fee. ${e}`);
	}
};
