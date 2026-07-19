
import {hex, nap} from "@e280/stz"
import {blake3} from "@awasm/noble"
import {Analysis} from "./types.js"
import {relaxer} from "./utils/relaxer.js"

export async function analyze(readable: ReadableStream<Uint8Array>): Promise<Analysis> {
	let size = 0
	const hasher = blake3.create()
	const relax = relaxer()

	for await (const chunk of readable) {
		hasher.update(chunk)
		size += chunk.byteLength

		if (relax())
			await nap()
	}

	const hash = hex.fromBytes(hasher.digest())
	return {hash, size}
}

