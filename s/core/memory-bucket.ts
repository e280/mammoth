
import {bytes, got, nap} from "@e280/stz"
import {Bucket, Id} from "./types.js"
import {relaxer} from "./utils/relaxer.js"

export class MemoryBucket implements Bucket {
	#map = new Map<string, Uint8Array>()

	async has(id: Id) {
		return this.#map.has(id)
	}

	async delete(id: Id) {
		this.#map.delete(id)
	}

	async read(id: Id) {
		return new Blob(
			[got(this.#map.get(id)) as Uint8Array<ArrayBuffer>],
			{type: "application/octet-stream"},
		)
	}

	async write(id: Id, readable: ReadableStream<Uint8Array>) {
		const relax = relaxer()
		const parts: Uint8Array[] = []

		for await (const chunk of readable) {
			parts.push(chunk)
			if (relax()) await nap()
		}

		const payload = bytes.concat(parts)
		this.#map.set(id, payload)
	}
}

