
import {got, hex} from "@e280/stz"
import {blake3} from "@noble/hashes/blake3.js"
import {randomId} from "../utils/random-id.js"
import {Glacier, Hash, RandomId} from "../types.js"
import {concatBytes} from "../utils/concat-bytes.js"

export class MemoryGlacier implements Glacier {
	#hot = new Map<RandomId, {time: number, parts: Uint8Array[]}>()
	#cold = new Map<Hash, Uint8Array>()

	async read(hash: Hash): Promise<Blob> {
		return new Blob(
			[got(this.#cold.get(hash)) as Uint8Array<ArrayBuffer>],
			{type: "application/octet-stream"},
		)
	}

	async has(hash: Hash): Promise<boolean> {
		return this.#cold.has(hash)
	}

	async size(hash: Hash): Promise<number> {
		return got(this.#cold.get(hash)).byteLength
	}

	async write(readable: ReadableStream<Uint8Array>): Promise<Hash> {
		const record = {time: Date.now(), parts: [] as Uint8Array[]}
		const id = randomId()
		this.#hot.set(id, record)

		const hasher = blake3.create()

		try {
			for await (const chunk of readable) {
				record.parts.push(chunk)
				hasher.update(chunk)
			}
			const hash = hex.fromBytes(hasher.digest())
			this.#cold.set(hash, concatBytes(record.parts))
			return hash
		}
		finally {
			this.#hot.delete(id)
		}
	}
}

