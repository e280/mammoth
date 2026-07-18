
import {hex, nap} from "@e280/stz"
import {blake3} from "@noble/hashes/blake3.js"
import {relaxer} from "./utils/relaxer.js"

export async function hashStream(readable: ReadableStream<Uint8Array>) {
	const hasher = blake3.create()
	const relax = relaxer()

	for await (const chunk of readable) {
		hasher.update(chunk)

		if (relax())
			await nap()
	}

	return hex.fromBytes(hasher.digest())
}

